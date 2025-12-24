/**
 * Conversation Session Manager
 *
 * Manages multi-turn conversations with AI platforms to track brand persistence.
 */

import type { ConversationSession, ConversationTurn, SessionMetrics } from "@/lib/types/features";
import { generateFollowUp } from "./followUpGenerator";
import { calculateFinalMetrics } from "./stickinessMetrics";

export interface ConversationConfig {
  brand: string;
  subcategory: string;
  persona: string;
  llm: "chatgpt" | "gemini" | "copilot" | "perplexity";
  competitors: string[];
  initialQuery: string;
  maxTurns?: number;
}

/**
 * Journey templates define conversation length by persona
 */
const journeyTemplates: Record<string, { maxTurns: number; description: string }> = {
  "Impulse Buyer": {
    maxTurns: 4,
    description: "Quick decision journey - trigger, research, validation, purchase"
  },
  "Skintellectual 2.0": {
    maxTurns: 8,
    description: "Deep research journey - multiple rounds of investigation"
  },
  "Circular Economist": {
    maxTurns: 6,
    description: "Values-driven journey - sustainability validation"
  },
  "Value-Conscious Budgeteer": {
    maxTurns: 5,
    description: "Price-focused journey - comparison and validation"
  },
  "Performance Optimizer": {
    maxTurns: 7,
    description: "Feature-focused journey - detailed comparison"
  },
  "Health Conscious": {
    maxTurns: 6,
    description: "Safety-focused journey - ingredient research"
  },
  "Style Seeker": {
    maxTurns: 5,
    description: "Trend-focused journey - style validation"
  },
  "Convenience Seeker": {
    maxTurns: 4,
    description: "Ease-focused journey - quick decision"
  }
};

/**
 * Run a complete conversation session
 */
export async function runConversation(
  config: ConversationConfig,
  queryLLM: (llm: string, query: string, history?: any[]) => Promise<any>
): Promise<ConversationSession> {
  const maxTurns = config.maxTurns || getMaxTurns(config.persona);

  const session: ConversationSession = {
    id: generateSessionId(),
    brand: config.brand,
    subcategory: config.subcategory,
    persona: config.persona,
    llm: config.llm,
    turns: [],
    metrics: initializeMetrics()
  };

  console.log(`[Conversation] Starting session for ${config.brand} with ${config.llm}`);
  console.log(`[Conversation] Persona: ${config.persona}, Max turns: ${maxTurns}`);

  // Run conversation turns
  for (let i = 0; i < maxTurns; i++) {
    const turnNumber = i + 1;

    // Generate query (initial or follow-up)
    const query = i === 0
      ? config.initialQuery
      : await generateFollowUp(
          session.turns[i - 1].response,
          session,
          config.competitors
        );

    console.log(`[Conversation] Turn ${turnNumber}/${maxTurns}: ${query}`);

    // Query LLM with conversation history
    const response = await queryLLM(config.llm, query, session.turns);

    // Analyze response for brand/competitor presence
    const analysis = analyzeResponse(
      response,
      config.brand,
      config.competitors
    );

    // Record turn
    const turn: ConversationTurn = {
      turnNumber,
      query,
      response,
      analysis,
      brandPresent: analysis.brandMentioned,
      competitorsPresent: analysis.competitorsMentioned
    };

    session.turns.push(turn);

    // Update running metrics
    updateMetrics(session.metrics, analysis);

    console.log(`[Conversation] Turn ${turnNumber} - Brand: ${analysis.brandMentioned ? 'YES' : 'NO'}, Competitors: ${analysis.competitorsMentioned.join(', ') || 'NONE'}`);

    // Early exit if conversation naturally ends
    if (shouldEndConversation(turn, config)) {
      console.log(`[Conversation] Natural end detected at turn ${turnNumber}`);
      break;
    }
  }

  // Calculate final metrics
  session.metrics.final = calculateFinalMetrics(session);

  console.log(`[Conversation] Session complete - ${session.turns.length} turns`);
  console.log(`[Conversation] Persistence: ${session.metrics.final.stickiness.persistence}%`);

  return session;
}

/**
 * Get maximum turns for a persona
 */
function getMaxTurns(persona: string): number {
  return journeyTemplates[persona]?.maxTurns || 5;
}

/**
 * Initialize session metrics
 */
function initializeMetrics(): SessionMetrics {
  return {
    persistence: 0,
    recovery: 0
  };
}

/**
 * Analyze response for brand and competitor presence
 */
function analyzeResponse(
  response: any,
  brand: string,
  competitors: string[]
): {
  brandMentioned: boolean;
  brandPosition?: number;
  competitorsMentioned: string[];
  sentiment?: "positive" | "neutral" | "negative";
} {
  const content = (response.content || response.fullResponse || "").toLowerCase();
  const brandLower = brand.toLowerCase();

  // Check brand mention
  const brandMentioned = content.includes(brandLower);

  // Check brand position (if mentioned)
  let brandPosition: number | undefined;
  if (brandMentioned) {
    const brandIndex = content.indexOf(brandLower);
    // Count how many competitor mentions appear before brand
    let competitorsBeforeBrand = 0;
    for (const competitor of competitors) {
      const compIndex = content.indexOf(competitor.toLowerCase());
      if (compIndex !== -1 && compIndex < brandIndex) {
        competitorsBeforeBrand++;
      }
    }
    brandPosition = competitorsBeforeBrand + 1;
  }

  // Check competitor mentions
  const competitorsMentioned = competitors.filter(competitor =>
    content.includes(competitor.toLowerCase())
  );

  // Analyze sentiment (simple heuristic)
  const sentiment = analyzeSentiment(content, brandLower);

  return {
    brandMentioned,
    brandPosition,
    competitorsMentioned,
    sentiment
  };
}

/**
 * Analyze sentiment of brand mentions
 */
function analyzeSentiment(
  content: string,
  brand: string
): "positive" | "neutral" | "negative" {
  // Find brand mentions and check surrounding context
  const brandIndex = content.indexOf(brand);
  if (brandIndex === -1) return "neutral";

  // Get context around brand mention (50 chars before and after)
  const contextStart = Math.max(0, brandIndex - 50);
  const contextEnd = Math.min(content.length, brandIndex + brand.length + 50);
  const context = content.substring(contextStart, contextEnd);

  // Positive indicators
  const positiveWords = [
    "recommend", "excellent", "best", "great", "love", "trusted",
    "top", "leading", "superior", "outstanding", "quality", "worth"
  ];

  // Negative indicators
  const negativeWords = [
    "avoid", "not recommend", "concerns", "issues", "problems",
    "disappointing", "poor", "inferior", "worse", "lacking"
  ];

  const positiveCount = positiveWords.filter(word => context.includes(word)).length;
  const negativeCount = negativeWords.filter(word => context.includes(word)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Update running metrics during conversation
 */
function updateMetrics(metrics: SessionMetrics, analysis: any): void {
  // Metrics will be calculated at the end
  // This is a placeholder for real-time tracking if needed
}

/**
 * Determine if conversation should end early
 */
function shouldEndConversation(turn: ConversationTurn, config: ConversationConfig): boolean {
  const content = (turn.response.content || turn.response.fullResponse || "").toLowerCase();

  // End if AI explicitly suggests ending conversation
  const endSignals = [
    "let me know if you have any other questions",
    "is there anything else",
    "hope this helps",
    "feel free to ask if you need",
    "that covers"
  ];

  return endSignals.some(signal => content.includes(signal));
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Run multiple conversation sessions (batch)
 */
export async function runConversationBatch(
  configs: ConversationConfig[],
  queryLLM: (llm: string, query: string, history?: any[]) => Promise<any>
): Promise<ConversationSession[]> {
  const sessions: ConversationSession[] = [];

  for (const config of configs) {
    const session = await runConversation(config, queryLLM);
    sessions.push(session);

    // Add delay between sessions to avoid rate limits
    await delay(2000);
  }

  return sessions;
}

/**
 * Helper: Delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
