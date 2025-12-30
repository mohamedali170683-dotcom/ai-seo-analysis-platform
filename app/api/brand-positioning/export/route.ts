import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/brand-positioning/export
 * Export brand positioning report as downloadable data (for PDF generation client-side)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisId, format = 'json' } = body;

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Get the brand positioning data with scans
    const analysis = await prisma.brandGroundTruth.findUnique({
      where: { id: analysisId },
      include: {
        hallucinationDetections: {
          orderBy: { scanDate: 'desc' },
          take: 10,
          include: {
            hallucinations: true,
            recommendations: true
          }
        }
      }
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Brand analysis not found' },
        { status: 404 }
      );
    }

    // Parse positioning
    let positioning = null;
    try {
      if (analysis.description && analysis.description.startsWith('{')) {
        positioning = JSON.parse(analysis.description);
      }
    } catch {
      positioning = null;
    }

    // Format report data
    const reportData = {
      title: `Brand Positioning Alignment Report`,
      brandName: analysis.companyName,
      domain: analysis.websiteUrl || '',
      generatedAt: new Date().toISOString(),
      positioning: positioning || {
        primary: analysis.industry || 'Not specified',
        secondary: [],
        targetAudience: 'Not specified',
        pricePoint: 'Not specified',
        keyAttributes: [],
        brandPromise: 'Not specified',
        tone: []
      },
      summary: {
        totalScans: analysis.hallucinationDetections.length,
        latestScore: analysis.hallucinationDetections[0]?.adjustedAccuracy || 0,
        averageScore: analysis.hallucinationDetections.length > 0
          ? Math.round(
              analysis.hallucinationDetections.reduce(
                (sum, d) => sum + (d.adjustedAccuracy || 0),
                0
              ) / analysis.hallucinationDetections.length
            )
          : 0,
        trend: calculateTrend(analysis.hallucinationDetections)
      },
      scans: analysis.hallucinationDetections.map(detection => {
        // Group hallucinations by LLM
        const llmResponses: Record<string, any[]> = {
          chatgpt: [],
          gemini: [],
          perplexity: [],
          claude: []
        };

        for (const h of detection.hallucinations) {
          let context: any = {};
          try {
            if (h.fullContext) {
              context = JSON.parse(h.fullContext);
            }
          } catch {
            context = {};
          }

          const response = {
            aspect: context.aspect || 'unknown',
            question: h.query,
            expectedAnswer: h.actualFact,
            llmAnswer: h.claimedFact,
            alignment: context.alignment || 'partially_aligned',
            explanation: h.suggestedAction || context.explanation || ''
          };

          if (llmResponses[h.llm]) {
            llmResponses[h.llm].push(response);
          }
        }

        return {
          scanDate: detection.scanDate.toISOString(),
          alignmentScore: detection.adjustedAccuracy || 0,
          llmScores: {
            chatgpt: detection.chatgptAccuracy || 0,
            gemini: detection.geminiAccuracy || 0,
            perplexity: detection.perplexityAccuracy || 0,
            claude: detection.claudeAccuracy || 0
          },
          details: llmResponses
        };
      }),
      recommendations: generateReportRecommendations(
        analysis.companyName,
        positioning,
        analysis.hallucinationDetections
      )
    };

    if (format === 'html') {
      // Generate HTML report for PDF conversion
      const html = generateHTMLReport(reportData);
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${analysis.companyName}-brand-report.html"`
        }
      });
    }

    // Return JSON by default
    return NextResponse.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

function calculateTrend(detections: any[]): 'improving' | 'declining' | 'stable' | 'insufficient_data' {
  if (detections.length < 2) return 'insufficient_data';

  const scores = detections
    .slice(0, 5)
    .map(d => d.adjustedAccuracy || 0)
    .reverse();

  if (scores.length < 2) return 'insufficient_data';

  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

function generateReportRecommendations(
  brandName: string,
  positioning: any,
  detections: any[]
): string[] {
  const recommendations: string[] = [];

  if (!detections || detections.length === 0) {
    return ['Run your first alignment check to get recommendations'];
  }

  const latestScore = detections[0]?.adjustedAccuracy || 0;

  if (latestScore < 70) {
    recommendations.push(`Priority: Significantly improve LLM perception of ${brandName}'s positioning`);
    recommendations.push('Create authoritative content on Wikipedia, LinkedIn, and industry publications');
    recommendations.push('Issue press releases emphasizing your brand positioning');
  } else if (latestScore < 85) {
    recommendations.push('Focus on strengthening specific weak areas identified in detailed analysis');
    recommendations.push('Increase social media presence discussing your brand attributes');
  } else {
    recommendations.push('Maintain current positioning strategy');
    recommendations.push('Monitor for changes in LLM perception over time');
  }

  // Check LLM-specific scores
  const chatgptScore = detections[0]?.chatgptAccuracy || 0;
  const geminiScore = detections[0]?.geminiAccuracy || 0;
  const perplexityScore = detections[0]?.perplexityAccuracy || 0;
  const claudeScore = detections[0]?.claudeAccuracy || 0;

  const minScore = Math.min(chatgptScore, geminiScore, perplexityScore, claudeScore);
  const llmWithMin =
    minScore === chatgptScore ? 'ChatGPT' :
    minScore === geminiScore ? 'Gemini' :
    minScore === perplexityScore ? 'Perplexity' : 'Claude';

  if (minScore < latestScore - 15) {
    recommendations.push(`Focus on improving perception with ${llmWithMin} (lowest score: ${minScore}%)`);
  }

  return recommendations;
}

function generateHTMLReport(data: any): string {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - ${data.brandName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 28px; margin-bottom: 8px; color: #111827; }
    h2 { font-size: 20px; margin: 32px 0 16px; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
    h3 { font-size: 16px; margin: 16px 0 8px; color: #4b5563; }
    .header { margin-bottom: 32px; }
    .meta { color: #6b7280; font-size: 14px; }
    .score-card {
      display: inline-block;
      padding: 16px 24px;
      border-radius: 8px;
      text-align: center;
      margin-right: 16px;
      margin-bottom: 16px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }
    .score-value { font-size: 32px; font-weight: bold; }
    .score-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .positioning-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 16px 0;
    }
    .positioning-item { background: #f3f4f6; padding: 12px; border-radius: 6px; }
    .positioning-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    .positioning-value { font-weight: 500; }
    .llm-scores { display: flex; gap: 16px; margin: 16px 0; flex-wrap: wrap; }
    .llm-score {
      flex: 1;
      min-width: 120px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      text-align: center;
    }
    .llm-name { font-size: 12px; color: #6b7280; text-transform: uppercase; }
    .llm-value { font-size: 24px; font-weight: bold; margin-top: 4px; }
    .recommendation {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 8px 0;
      border-radius: 0 6px 6px 0;
    }
    .trend-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .trend-improving { background: #dcfce7; color: #166534; }
    .trend-declining { background: #fee2e2; color: #991b1b; }
    .trend-stable { background: #e5e7eb; color: #374151; }
    .scan-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .scan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .scan-date { font-size: 14px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    @media print {
      body { padding: 20px; }
      .score-card { break-inside: avoid; }
      .scan-item { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    <p class="meta">${data.brandName} | ${data.domain}</p>
    <p class="meta">Generated: ${formatDate(data.generatedAt)}</p>
  </div>

  <h2>Executive Summary</h2>
  <div>
    <div class="score-card">
      <div class="score-value" style="color: ${getScoreColor(data.summary.latestScore)}">${data.summary.latestScore}%</div>
      <div class="score-label">Latest Score</div>
    </div>
    <div class="score-card">
      <div class="score-value">${data.summary.averageScore}%</div>
      <div class="score-label">Average Score</div>
    </div>
    <div class="score-card">
      <div class="score-value">${data.summary.totalScans}</div>
      <div class="score-label">Total Scans</div>
    </div>
    <div class="score-card">
      <span class="trend-badge trend-${data.summary.trend === 'improving' ? 'improving' : data.summary.trend === 'declining' ? 'declining' : 'stable'}">
        ${data.summary.trend === 'improving' ? 'Improving' : data.summary.trend === 'declining' ? 'Declining' : 'Stable'}
      </span>
      <div class="score-label" style="margin-top: 8px;">Trend</div>
    </div>
  </div>

  <h2>Your Brand Positioning</h2>
  <div class="positioning-grid">
    <div class="positioning-item">
      <div class="positioning-label">Primary Positioning</div>
      <div class="positioning-value">${data.positioning.primary}</div>
    </div>
    <div class="positioning-item">
      <div class="positioning-label">Price Point</div>
      <div class="positioning-value">${data.positioning.pricePoint}</div>
    </div>
    <div class="positioning-item">
      <div class="positioning-label">Target Audience</div>
      <div class="positioning-value">${data.positioning.targetAudience}</div>
    </div>
    <div class="positioning-item">
      <div class="positioning-label">Brand Tone</div>
      <div class="positioning-value">${(data.positioning.tone || []).join(', ') || 'Not specified'}</div>
    </div>
  </div>
  ${data.positioning.secondary?.length > 0 ? `
  <div class="positioning-item" style="margin-top: 8px;">
    <div class="positioning-label">Secondary Attributes</div>
    <div class="positioning-value">${data.positioning.secondary.join(', ')}</div>
  </div>
  ` : ''}
  ${data.positioning.brandPromise ? `
  <div class="positioning-item" style="margin-top: 8px;">
    <div class="positioning-label">Brand Promise</div>
    <div class="positioning-value">${data.positioning.brandPromise}</div>
  </div>
  ` : ''}

  <h2>LLM Alignment Scores</h2>
  ${data.scans.length > 0 ? `
  <p style="color: #6b7280; margin-bottom: 16px;">Latest scan: ${formatDate(data.scans[0].scanDate)}</p>
  <div class="llm-scores">
    <div class="llm-score">
      <div class="llm-name">ChatGPT</div>
      <div class="llm-value" style="color: ${getScoreColor(data.scans[0].llmScores.chatgpt)}">${data.scans[0].llmScores.chatgpt}%</div>
    </div>
    <div class="llm-score">
      <div class="llm-name">Gemini</div>
      <div class="llm-value" style="color: ${getScoreColor(data.scans[0].llmScores.gemini)}">${data.scans[0].llmScores.gemini}%</div>
    </div>
    <div class="llm-score">
      <div class="llm-name">Perplexity</div>
      <div class="llm-value" style="color: ${getScoreColor(data.scans[0].llmScores.perplexity)}">${data.scans[0].llmScores.perplexity}%</div>
    </div>
    <div class="llm-score">
      <div class="llm-name">Claude</div>
      <div class="llm-value" style="color: ${getScoreColor(data.scans[0].llmScores.claude)}">${data.scans[0].llmScores.claude}%</div>
    </div>
  </div>
  ` : '<p>No scans available yet.</p>'}

  <h2>Recommendations</h2>
  ${data.recommendations.map((rec: string) => `
  <div class="recommendation">${rec}</div>
  `).join('')}

  <h2>Scan History</h2>
  ${data.scans.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Overall</th>
        <th>ChatGPT</th>
        <th>Gemini</th>
        <th>Perplexity</th>
        <th>Claude</th>
      </tr>
    </thead>
    <tbody>
      ${data.scans.map((scan: any) => `
      <tr>
        <td>${formatDate(scan.scanDate)}</td>
        <td style="color: ${getScoreColor(scan.alignmentScore)}; font-weight: 600;">${scan.alignmentScore}%</td>
        <td>${scan.llmScores.chatgpt}%</td>
        <td>${scan.llmScores.gemini}%</td>
        <td>${scan.llmScores.perplexity}%</td>
        <td>${scan.llmScores.claude}%</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>No scan history available.</p>'}

  <div class="footer">
    <p>This report was generated by the Brand Positioning Alignment Tool.</p>
    <p>For questions or support, contact your account manager.</p>
  </div>
</body>
</html>`;
}
