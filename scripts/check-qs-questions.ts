import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get the most recent QS analysis
  const analysis = await prisma.analysis.findFirst({
    where: { brandOrKeyword: { contains: 'QS', mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true }
  });

  if (analysis === null) {
    console.log('No QS analysis found');
    return;
  }

  console.log('Analysis:', analysis.id);
  console.log('Date:', analysis.createdAt);

  // Get discovered questions
  const questions = await prisma.discoveredQuestion.findMany({
    where: { analysisId: analysis.id },
    select: {
      question: true,
      category: true,
      searchVolume: true
    },
    orderBy: { category: 'asc' }
  });

  console.log('\nTotal questions:', questions.length);

  const byCategory: Record<string, number> = {};
  questions.forEach(q => {
    byCategory[q.category] = (byCategory[q.category] || 0) + 1;
  });
  console.log('By category:', byCategory);

  console.log('\n=== AWARENESS ===');
  questions.filter(q => q.category === 'awareness').forEach(q => {
    console.log(`${q.question} (${q.searchVolume}/mo)`);
  });

  console.log('\n=== CONSIDERATION ===');
  questions.filter(q => q.category === 'consideration').forEach(q => {
    console.log(`${q.question} (${q.searchVolume}/mo)`);
  });

  console.log('\n=== DECISION ===');
  questions.filter(q => q.category === 'decision').forEach(q => {
    console.log(`${q.question} (${q.searchVolume}/mo)`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
