import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const analysis = await prisma.analysis.findFirst({
    where: { brandOrKeyword: { contains: 'QS', mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      brandOrKeyword: true,
      competitors: true,
    }
  });

  if (analysis === null) {
    console.log('No QS analysis found');
    return;
  }

  console.log('Analysis:', analysis.id);
  console.log('Brand:', analysis.brandOrKeyword);
  console.log('Configured competitors:', analysis.competitors);

  const insights = await prisma.aIInsight.findMany({
    where: { analysisId: analysis.id, category: 'journey_stage' },
    select: { title: true, expectedImpact: true }
  });

  console.log('\nCompetitor mention rates detected in responses:');

  const allCompetitors = new Map<string, { total: number; count: number }>();
  const brandMentionRates: number[] = [];

  insights.forEach((insight) => {
    const impact = insight.expectedImpact as any;
    const compComparison = impact?.portrayal?.competitorComparison || [];
    const mentionRate = impact?.portrayal?.mentionRate || 0;
    brandMentionRates.push(mentionRate);

    console.log('\n' + insight.title + ' (your mention rate: ' + mentionRate + '%):');
    compComparison.forEach((c: any) => {
      console.log('  ', c.competitorName, '- mention rate:', c.mentionRate + '%');

      const name = c.competitorName;
      if (name && name !== 'QS') {
        if (!allCompetitors.has(name)) {
          allCompetitors.set(name, { total: 0, count: 0 });
        }
        const entry = allCompetitors.get(name);
        if (entry) {
          entry.total += (c.mentionRate || 0);
          entry.count += 1;
        }
      }
    });
  });

  const yourMentionRate = brandMentionRates.length > 0
    ? Math.round(brandMentionRates.reduce((a, b) => a + b, 0) / brandMentionRates.length)
    : 0;

  console.log('\n=== COMPETITOR INTELLIGENCE CALCULATION ===');
  console.log('Your avg mention rate:', yourMentionRate + '%');

  const competitorScores = Array.from(allCompetitors.entries()).map(([name, data]) => ({
    name,
    avgScore: Math.round(data.total / data.count)
  }));

  console.log('\nCompetitor avg mention rates:');
  competitorScores.forEach(c => {
    const result = yourMentionRate > c.avgScore ? 'OUTPERFORMING' : 'BEHIND';
    console.log('  ', c.name, '- avg:', c.avgScore + '%', '-', result);
  });

  const beatingCount = competitorScores.filter(c => yourMentionRate > c.avgScore).length;
  console.log('\nResult: Outperforming', beatingCount, '/', competitorScores.length, 'competitors');
}

main().catch(console.error).finally(() => prisma.$disconnect());
