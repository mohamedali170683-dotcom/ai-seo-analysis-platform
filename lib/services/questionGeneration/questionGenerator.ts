/**
 * Question Generation Service
 *
 * Generates persona-informed questions for each funnel stage without
 * including persona names literally in the questions.
 */

import { personaQueryMapping, pricePoints, getCurrentYear, type PersonaConfig } from "@/lib/config/personaQueryMapping";
import { funnelStageConfig, useCaseModifiers, alternativeCategories } from "@/lib/config/funnelStageQuestions";

export interface QuestionGenerationConfig {
  brand: string;
  subcategory: string;
  competitors?: string[];
  personas?: string[];
  funnelStages?: ("awareness" | "consideration" | "decision")[];
  questionsPerStage?: number;
}

export interface GeneratedQuestion {
  id: string;
  text: string;
  stage: "awareness" | "consideration" | "decision";
  persona: string | null;
  personaInfluence: "LOW" | "MEDIUM" | "HIGH";
  source: "ai_generated";
  metadata: {
    pattern: string;
    modifiers?: string[];
  };
}

/**
 * Main question generation function
 */
export async function generateQuestions(
  config: QuestionGenerationConfig
): Promise<GeneratedQuestion[]> {
  const {
    brand,
    subcategory,
    competitors = [],
    personas = Object.keys(personaQueryMapping),
    funnelStages = ["awareness", "consideration", "decision"],
    questionsPerStage = 10
  } = config;

  const allQuestions: GeneratedQuestion[] = [];
  const year = getCurrentYear();

  // Generate questions for each funnel stage
  for (const stage of funnelStages) {
    const stageConfig = funnelStageConfig[stage];
    const questionCount = questionsPerStage;

    if (stage === "awareness") {
      // Awareness: Educational, no persona influence
      const awarenessQuestions = generateAwarenessQuestions(
        subcategory,
        stageConfig.patterns,
        questionCount
      );
      allQuestions.push(...awarenessQuestions);
    } else if (stage === "consideration") {
      // Consideration: Comparison queries with moderate persona influence
      const considerationQuestions = generateConsiderationQuestions(
        subcategory,
        personas,
        stageConfig.patterns,
        year,
        questionCount
      );
      allQuestions.push(...considerationQuestions);
    } else if (stage === "decision") {
      // Decision: Brand-specific queries with high persona influence
      const decisionQuestions = generateDecisionQuestions(
        brand,
        subcategory,
        competitors,
        personas,
        stageConfig.patterns,
        questionCount
      );
      allQuestions.push(...decisionQuestions);
    }
  }

  return allQuestions;
}

/**
 * Generate awareness stage questions (educational)
 */
function generateAwarenessQuestions(
  subcategory: string,
  patterns: string[],
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const lowercaseSubcategory = subcategory.toLowerCase();

  // Use a mix of patterns
  const selectedPatterns = selectRandomItems(patterns, Math.min(count, patterns.length));

  for (let i = 0; i < selectedPatterns.length; i++) {
    const pattern = selectedPatterns[i];
    let questionText = pattern.replace(/{subcategory}/g, lowercaseSubcategory);

    // Add alternative category for comparison questions
    if (questionText.includes("{alternative_category}")) {
      const alternatives = alternativeCategories[lowercaseSubcategory] || ["alternatives"];
      const alternative = selectRandomItem(alternatives);
      questionText = questionText.replace(/{alternative_category}/g, alternative);
    }

    questions.push({
      id: generateQuestionId("awareness", i),
      text: capitalizeFirst(questionText),
      stage: "awareness",
      persona: null, // No persona for awareness
      personaInfluence: "LOW",
      source: "ai_generated",
      metadata: {
        pattern
      }
    });
  }

  return questions;
}

/**
 * Generate consideration stage questions (comparison)
 */
function generateConsiderationQuestions(
  subcategory: string,
  personas: string[],
  patterns: string[],
  year: string,
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const lowercaseSubcategory = subcategory.toLowerCase();

  // Distribute questions across personas
  const questionsPerPersona = Math.ceil(count / personas.length);

  for (const persona of personas) {
    const personaConfig = personaQueryMapping[persona];
    if (!personaConfig) continue;

    // Select patterns and modifiers
    const selectedPatterns = selectRandomItems(patterns, Math.min(questionsPerPersona, 3));

    for (let i = 0; i < selectedPatterns.length; i++) {
      const pattern = selectedPatterns[i];
      let questionText = pattern
        .replace(/{subcategory}/g, lowercaseSubcategory)
        .replace(/{year}/g, year);

      // Add use case modifiers
      if (questionText.includes("{use_case}")) {
        const useCase = selectRandomItem(useCaseModifiers);
        questionText = questionText.replace(/{use_case}/g, useCase);
      }

      // Apply persona modifiers (without mentioning persona name)
      const modifier = selectRandomItem(personaConfig.queryModifiers);
      if (personaConfig.intentType !== "immediate_purchase") {
        // Add modifier naturally into the question
        questionText = applyModifier(questionText, modifier, subcategory);
      }

      questions.push({
        id: generateQuestionId("consideration", questions.length),
        text: capitalizeFirst(questionText),
        stage: "consideration",
        persona,
        personaInfluence: "MEDIUM",
        source: "ai_generated",
        metadata: {
          pattern,
          modifiers: [modifier]
        }
      });
    }
  }

  return questions.slice(0, count);
}

/**
 * Generate decision stage questions (purchase intent)
 */
function generateDecisionQuestions(
  brand: string,
  subcategory: string,
  competitors: string[],
  personas: string[],
  patterns: string[],
  count: number
): GeneratedQuestion[] {
  const questions: GeneratedQuestion[] = [];
  const lowercaseSubcategory = subcategory.toLowerCase();

  // Distribute questions across personas
  const questionsPerPersona = Math.ceil(count / Math.max(personas.length, 1));

  for (const persona of personas) {
    const personaConfig = personaQueryMapping[persona];
    if (!personaConfig) continue;

    // Select patterns for this persona
    const selectedPatterns = selectRandomItems(patterns, Math.min(questionsPerPersona, 4));

    for (let i = 0; i < selectedPatterns.length; i++) {
      const pattern = selectedPatterns[i];
      let questionText = pattern
        .replace(/{brand}/g, brand)
        .replace(/{subcategory}/g, lowercaseSubcategory);

      // Add competitor for comparison questions
      if (questionText.includes("{competitor}") && competitors.length > 0) {
        const competitor = selectRandomItem(competitors);
        questionText = questionText.replace(/{competitor}/g, competitor);
      }

      // Apply persona-specific framing
      const modifier = selectRandomItem(personaConfig.queryModifiers);
      questionText = applyDecisionModifier(questionText, modifier, personaConfig.intentType);

      questions.push({
        id: generateQuestionId("decision", questions.length),
        text: capitalizeFirst(questionText),
        stage: "decision",
        persona,
        personaInfluence: "HIGH",
        source: "ai_generated",
        metadata: {
          pattern,
          modifiers: [modifier]
        }
      });
    }
  }

  return questions.slice(0, count);
}

/**
 * Apply modifier to consideration question
 */
function applyModifier(questionText: string, modifier: string, subcategory: string): string {
  // If question starts with "best", add modifier
  if (questionText.toLowerCase().startsWith("best")) {
    return questionText.replace(/^best/i, `best ${modifier}`);
  }

  // If question contains subcategory, add modifier before it
  const subcatRegex = new RegExp(`\\b${subcategory}\\b`, "i");
  if (subcatRegex.test(questionText)) {
    return questionText.replace(subcatRegex, `${modifier} ${subcategory}`);
  }

  return questionText;
}

/**
 * Apply modifier to decision question
 */
function applyDecisionModifier(questionText: string, modifier: string, intentType: string): string {
  // For price-sensitive personas
  if (intentType === "price_sensitive") {
    if (questionText.includes("worth it")) {
      return questionText.replace("worth it", "worth the price");
    }
  }

  // For immediate purchase personas
  if (intentType === "immediate_purchase") {
    if (questionText.includes("where to buy")) {
      return questionText.replace("where to buy", "where to buy today");
    }
  }

  return questionText;
}

/**
 * Helper: Select random items from array
 */
function selectRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Helper: Select random item from array
 */
function selectRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper: Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper: Generate unique question ID
 */
function generateQuestionId(stage: string, index: number): string {
  return `${stage}-${Date.now()}-${index}`;
}
