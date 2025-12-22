/**
 * Analysis Insights Engine
 * 
 * Generates executive summaries, detects patterns, and creates actionable insights
 * from AI visibility analysis results.
 */

import { AIResponse } from "./multi-platform-ai-service";

export interface PatternAnalysis {
  consistentMentions: string[];
  llmSpecificBias: { llm: string; bias: string; severity: 'low' | 'medium' | 'high' }[];
  strongQueryTypes: string[];
  weakQueryTypes: string[];
  competitorPreferences: { competitor: string; frequency: number }[];
  sentimentTrends: { trend: string; description: string }[];
}

export interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  expectedImpact: string;
  timeline: string;
}

export interface ExecutiveSummary {
  headline: string;
  overallScore: number;
  keyFinding: string;
  stageBreakdown: {
    awareness: { score: number; insight: string };
    consideration: { score: number; insight: string };
    decision: { score: number; insight: string };
  };
  topActions: ActionItem[];
  llmPatterns: string[];
  competitorInsights: string[];
}

/**
 * Pattern Detection Engine
 * Analyzes AI responses to find patterns and trends
 */
export function detectPatterns(
  responses: AIResponse[],
  brandName: string,
  competitors: string[]
): PatternAnalysis {
  const patterns: PatternAnalysis = {
    consistentMentions: [],
    llmSpecificBias: [],
    strongQueryTypes: [],
    weakQueryTypes: [],
    competitorPreferences: [],
    sentimentTrends: [],
  };

  // Group responses by platform
  const byPlatform: Record<string, AIResponse[]> = {};
  for (const r of responses) {
    if (!byPlatform[r.platform]) byPlatform[r.platform] = [];
    byPlatform[r.platform].push(r);
  }

  // 1. Detect consistent mentions (brand mentioned across all platforms)
  const questionMentions: Record<string, Set<string>> = {};
  for (const r of responses) {
    if (!questionMentions[r.question]) questionMentions[r.question] = new Set();
    if (r.brandMentioned) {
      questionMentions[r.question].add(r.platform);
    }
  }
  
  const platformCount = Object.keys(byPlatform).length;
  for (const [question, platforms] of Object.entries(questionMentions)) {
    if (platforms.size >= platformCount) {
      patterns.consistentMentions.push(question.substring(0, 60) + '...');
    }
  }

  // 2. Detect LLM-specific biases
  for (const [platform, platformResponses] of Object.entries(byPlatform)) {
    const mentionRate = platformResponses.filter(r => r.brandMentioned).length / platformResponses.length;
    const avgSentiment = calculateAvgSentiment(platformResponses);
    
    if (mentionRate < 0.3 && platformResponses.length >= 3) {
      patterns.llmSpecificBias.push({
        llm: platform,
        bias: `Low mention rate (${Math.round(mentionRate * 100)}%)`,
        severity: mentionRate < 0.1 ? 'high' : 'medium',
      });
    }
    
    if (avgSentiment < -0.3) {
      patterns.llmSpecificBias.push({
        llm: platform,
        bias: 'Negative sentiment tendency',
        severity: avgSentiment < -0.5 ? 'high' : 'medium',
      });
    }
  }

  // 3. Identify strong and weak query types
  const queryTypePerformance: Record<string, { mentions: number; total: number }> = {
    brand: { mentions: 0, total: 0 },
    category: { mentions: 0, total: 0 },
    comparison: { mentions: 0, total: 0 },
    purchase: { mentions: 0, total: 0 },
  };

  for (const r of responses) {
    const queryType = classifyQueryType(r.question, brandName);
    queryTypePerformance[queryType].total++;
    if (r.brandMentioned) {
      queryTypePerformance[queryType].mentions++;
    }
  }

  for (const [type, perf] of Object.entries(queryTypePerformance)) {
    if (perf.total > 0) {
      const rate = perf.mentions / perf.total;
      if (rate >= 0.7) patterns.strongQueryTypes.push(type);
      if (rate <= 0.3) patterns.weakQueryTypes.push(type);
    }
  }

  // 4. Detect competitor preferences
  const competitorMentions: Record<string, number> = {};
  for (const r of responses) {
    if (!r.brandMentioned) {
      for (const competitor of r.competitorsMentioned || []) {
        competitorMentions[competitor] = (competitorMentions[competitor] || 0) + 1;
      }
    }
  }

  patterns.competitorPreferences = Object.entries(competitorMentions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([competitor, frequency]) => ({ competitor, frequency }));

  // 5. Detect sentiment trends
  const positivePct = responses.filter(r => r.sentiment === 'positive').length / responses.length;
  const negativePct = responses.filter(r => r.sentiment === 'negative').length / responses.length;
  
  if (positivePct > 0.6) {
    patterns.sentimentTrends.push({
      trend: 'positive_dominant',
      description: `${Math.round(positivePct * 100)}% positive sentiment - strong brand perception`,
    });
  } else if (negativePct > 0.3) {
    patterns.sentimentTrends.push({
      trend: 'negative_concern',
      description: `${Math.round(negativePct * 100)}% negative sentiment - reputation risk`,
    });
  } else {
    patterns.sentimentTrends.push({
      trend: 'neutral_opportunity',
      description: 'Mostly neutral sentiment - opportunity for differentiation',
    });
  }

  return patterns;
}

/**
 * Generate Executive Summary
 */
export function generateExecutiveSummary(
  brandName: string,
  overallScore: number,
  stageScores: { awareness: number; consideration: number; decision: number },
  patterns: PatternAnalysis,
  responses: AIResponse[]
): ExecutiveSummary {
  // Generate key finding
  const keyFinding = generateKeyFinding(brandName, overallScore, stageScores, patterns);

  // Generate stage insights
  const stageBreakdown = {
    awareness: {
      score: stageScores.awareness,
      insight: getAwarenessInsight(stageScores.awareness, responses),
    },
    consideration: {
      score: stageScores.consideration,
      insight: getConsiderationInsight(stageScores.consideration, responses),
    },
    decision: {
      score: stageScores.decision,
      insight: getDecisionInsight(stageScores.decision, responses),
    },
  };

  // Generate action items
  const topActions = generateActionItems(brandName, stageScores, patterns);

  // Generate LLM patterns
  const llmPatterns = patterns.llmSpecificBias.map(b => 
    `${b.llm}: ${b.bias} (${b.severity} priority)`
  );

  // Generate competitor insights
  const competitorInsights = patterns.competitorPreferences.map(cp =>
    `${cp.competitor} mentioned ${cp.frequency} times when ${brandName} was not`
  );

  // Create headline
  const headline = overallScore >= 70 
    ? `${brandName} shows strong AI visibility`
    : overallScore >= 40
    ? `${brandName} has moderate AI visibility with growth opportunities`
    : `${brandName} needs significant AI visibility improvements`;

  return {
    headline,
    overallScore,
    keyFinding,
    stageBreakdown,
    topActions,
    llmPatterns,
    competitorInsights,
  };
}

/**
 * Generate key finding based on analysis
 */
function generateKeyFinding(
  brandName: string,
  overallScore: number,
  stageScores: { awareness: number; consideration: number; decision: number },
  patterns: PatternAnalysis
): string {
  // Find the weakest stage
  const stages = [
    { name: 'awareness', score: stageScores.awareness },
    { name: 'consideration', score: stageScores.consideration },
    { name: 'decision', score: stageScores.decision },
  ];
  const weakestStage = stages.sort((a, b) => a.score - b.score)[0];
  const strongestStage = stages.sort((a, b) => b.score - a.score)[0];

  // Check for competitor preference
  if (patterns.competitorPreferences.length > 0) {
    const topCompetitor = patterns.competitorPreferences[0];
    if (topCompetitor.frequency >= 3) {
      return `AI platforms frequently recommend ${topCompetitor.competitor} over ${brandName} in purchase-intent queries. Focus on competitive positioning content.`;
    }
  }

  // Check for LLM-specific issues
  if (patterns.llmSpecificBias.length > 0) {
    const highSeverity = patterns.llmSpecificBias.find(b => b.severity === 'high');
    if (highSeverity) {
      return `${highSeverity.llm} shows ${highSeverity.bias}. Consider platform-specific content optimization.`;
    }
  }

  // Stage-based findings
  if (weakestStage.score < 30) {
    return `${brandName} struggles in the ${weakestStage.name} stage (${weakestStage.score}%). This is a critical gap requiring immediate attention.`;
  }

  if (strongestStage.score > 70) {
    return `${brandName} performs well in ${strongestStage.name} queries (${strongestStage.score}%) but has room to improve in ${weakestStage.name}.`;
  }

  return `${brandName} has an overall AI visibility score of ${overallScore}% with the strongest performance in ${strongestStage.name} stage.`;
}

/**
 * Generate stage-specific insights
 */
function getAwarenessInsight(score: number, responses: AIResponse[]): string {
  const awarenessResponses = responses.filter(r => 
    r.question.toLowerCase().includes('what is') || 
    r.question.toLowerCase().includes('how does') ||
    r.question.toLowerCase().includes('types of') ||
    r.question.toLowerCase().includes('guide')
  );
  
  const citedCount = awarenessResponses.filter(r => r.hasGrounding || r.sources.length > 0).length;
  
  if (score >= 70) {
    return 'Brand content is frequently cited as authoritative source in educational queries.';
  } else if (score >= 40) {
    return 'Moderate content citation. Opportunity to create more authoritative, linkable content.';
  } else {
    return 'Brand content rarely cited. Priority: Create definitive guides and research content that LLMs can reference.';
  }
}

function getConsiderationInsight(score: number, responses: AIResponse[]): string {
  const comparisonResponses = responses.filter(r => 
    r.question.toLowerCase().includes('best') || 
    r.question.toLowerCase().includes('vs') ||
    r.question.toLowerCase().includes('comparison')
  );
  
  const mentioned = comparisonResponses.filter(r => r.brandMentioned).length;
  const total = comparisonResponses.length;
  
  if (score >= 70) {
    return `Brand appears in ${Math.round((mentioned/total) * 100)}% of comparison queries. Strong competitive positioning.`;
  } else if (score >= 40) {
    return 'Brand included in some comparisons but not consistently. Focus on differentiating content.';
  } else {
    return 'Brand missing from most comparison queries. Priority: Create comparison content and boost review signals.';
  }
}

function getDecisionInsight(score: number, responses: AIResponse[]): string {
  const decisionResponses = responses.filter(r => 
    r.question.toLowerCase().includes('should i buy') || 
    r.question.toLowerCase().includes('worth it') ||
    r.question.toLowerCase().includes('recommend')
  );
  
  const positive = decisionResponses.filter(r => r.sentiment === 'positive').length;
  const total = decisionResponses.length;
  
  if (score >= 70) {
    return `${Math.round((positive/Math.max(total, 1)) * 100)}% positive sentiment in purchase queries. Strong recommendation signals.`;
  } else if (score >= 40) {
    return 'Mixed recommendations in purchase queries. Focus on building stronger social proof.';
  } else {
    return 'Weak recommendation signals. Priority: Address negative reviews and build expert endorsements.';
  }
}

/**
 * Generate action items based on analysis
 */
function generateActionItems(
  brandName: string,
  stageScores: { awareness: number; consideration: number; decision: number },
  patterns: PatternAnalysis
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Priority 1: Address weakest stage
  if (stageScores.awareness < 40) {
    actions.push({
      priority: 'high',
      action: 'Create authoritative educational content',
      rationale: `Awareness stage score is ${stageScores.awareness}%. LLMs are not citing your content as a source.`,
      expectedImpact: 'Increase content citations by 50%+ in 90 days',
      timeline: '30-60 days for content creation',
    });
  }

  if (stageScores.consideration < 40) {
    actions.push({
      priority: 'high',
      action: 'Build comparison and review content',
      rationale: `Consideration stage score is ${stageScores.consideration}%. Brand missing from "best of" queries.`,
      expectedImpact: 'Appear in 50%+ of comparison queries',
      timeline: '60-90 days',
    });
  }

  if (stageScores.decision < 40) {
    actions.push({
      priority: 'high',
      action: 'Address reputation and boost social proof',
      rationale: `Decision stage score is ${stageScores.decision}%. Weak recommendation signals.`,
      expectedImpact: 'Improve positive sentiment to 60%+',
      timeline: '90-120 days',
    });
  }

  // Address competitor preference
  if (patterns.competitorPreferences.length > 0) {
    const topCompetitor = patterns.competitorPreferences[0];
    actions.push({
      priority: 'medium',
      action: `Create competitive positioning content vs ${topCompetitor.competitor}`,
      rationale: `${topCompetitor.competitor} recommended ${topCompetitor.frequency} times when ${brandName} was not.`,
      expectedImpact: 'Reduce competitor preference by 30%',
      timeline: '45-60 days',
    });
  }

  // Address LLM-specific issues
  for (const bias of patterns.llmSpecificBias) {
    if (bias.severity === 'high') {
      actions.push({
        priority: 'medium',
        action: `Optimize content for ${bias.llm}`,
        rationale: `${bias.llm} shows ${bias.bias}.`,
        expectedImpact: `Improve ${bias.llm} mention rate by 40%`,
        timeline: '30-45 days',
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return actions.slice(0, 5); // Top 5 actions
}

/**
 * Helper functions
 */
function calculateAvgSentiment(responses: AIResponse[]): number {
  if (responses.length === 0) return 0;
  
  let total = 0;
  for (const r of responses) {
    if (r.sentiment === 'positive') total += 1;
    else if (r.sentiment === 'negative') total -= 1;
  }
  return total / responses.length;
}

function classifyQueryType(question: string, brandName: string): string {
  const q = question.toLowerCase();
  const brand = brandName.toLowerCase();
  
  if (q.includes(brand) && (q.includes('vs') || q.includes('or'))) return 'comparison';
  if (q.includes('buy') || q.includes('purchase') || q.includes('worth it')) return 'purchase';
  if (q.includes(brand)) return 'brand';
  return 'category';
}

/**
 * Generate markdown executive summary
 */
export function generateMarkdownSummary(summary: ExecutiveSummary, brandName: string): string {
  return `# AI Visibility Analysis: ${brandName}

## ${summary.headline}

**Overall Score:** ${summary.overallScore}/100

### Key Finding
${summary.keyFinding}

---

## Performance by Buyer Journey Stage

### 🔍 Awareness Stage (Content Authority)
**Score:** ${summary.stageBreakdown.awareness.score}/100

${summary.stageBreakdown.awareness.insight}

### ⚖️ Consideration Stage (Competitive Presence)
**Score:** ${summary.stageBreakdown.consideration.score}/100

${summary.stageBreakdown.consideration.insight}

### 🛒 Decision Stage (Purchase Influence)
**Score:** ${summary.stageBreakdown.decision.score}/100

${summary.stageBreakdown.decision.insight}

---

## Top Priority Actions

${summary.topActions.map((action, i) => `
### ${i + 1}. ${action.action}
- **Priority:** ${action.priority.toUpperCase()}
- **Rationale:** ${action.rationale}
- **Expected Impact:** ${action.expectedImpact}
- **Timeline:** ${action.timeline}
`).join('\n')}

---

## LLM-Specific Patterns
${summary.llmPatterns.length > 0 ? summary.llmPatterns.map(p => `- ${p}`).join('\n') : '- No significant platform-specific biases detected'}

## Competitor Insights
${summary.competitorInsights.length > 0 ? summary.competitorInsights.map(c => `- ${c}`).join('\n') : '- No significant competitor preferences detected'}
`;
}
