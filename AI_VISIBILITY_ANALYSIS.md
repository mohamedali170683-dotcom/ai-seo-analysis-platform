# AI Visibility Analysis - Implementation Guide

This document explains the core functionality that generates AI visibility analysis reports like the demo page at `/demo`.

## Overview

The AI Visibility Analysis tool tests how a brand appears across AI chatbots (ChatGPT, Gemini, Copilot) throughout the user journey (Awareness → Consideration → Decision) and generates comprehensive reports with actionable insights.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Analysis Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Question Discovery (EnhancedQuestionService)                │
│     ├── Try Ahrefs API (if configured)                         │
│     └── Generate smart brand-specific questions                 │
│         ├── 4 Awareness questions                               │
│         ├── 4 Consideration questions                           │
│         └── 4 Decision questions                                │
│                                                                 │
│  2. Multi-Platform AI Testing (MultiPlatformAIService)          │
│     ├── Test each question 5x on ChatGPT                       │
│     ├── Test each question 5x on Gemini                        │
│     └── Test each question 5x on Copilot                       │
│         = 180 total AI queries (12 questions × 15 tests)       │
│                                                                 │
│  3. Response Analysis                                           │
│     ├── Brand mention detection                                 │
│     ├── Brand position (1st, 2nd, 3rd mentioned)               │
│     ├── Sentiment analysis (positive/neutral/negative)          │
│     ├── Recommendation type (direct/conditional/listed)         │
│     └── Competitor mention tracking                             │
│                                                                 │
│  4. Journey Stage Aggregation (ComprehensiveAnalysisService)    │
│     ├── Group results by funnel stage                          │
│     ├── Calculate visibility scores                             │
│     ├── Generate competitor comparisons                         │
│     └── Create AI-powered recommendations                       │
│                                                                 │
│  5. Report Generation                                           │
│     ├── Overall visibility score (0-100)                       │
│     ├── Scoring methodology breakdown                           │
│     ├── Journey stage cards with detailed metrics               │
│     └── Actionable recommendations per stage                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Services

### 1. EnhancedQuestionService (`/lib/services/enhanced-question-service.ts`)

Discovers relevant questions for analysis:

```typescript
const questionService = new EnhancedQuestionService(ahrefsApiKey);
const questions = await questionService.discoverQuestions({
  brandName: "Nike",
  domain: "nike.com",
  competitors: ["Adidas", "Puma"],
  maxQuestionsPerStage: 4,
});
```

**Features:**
- Ahrefs API integration for real search volume data
- Smart fallback questions based on brand name
- Industry detection from domain
- Funnel stage categorization
- Search volume-based prioritization

### 2. MultiPlatformAIService (`/lib/services/multi-platform-ai-service.ts`)

Tests questions across AI platforms:

```typescript
const aiService = new MultiPlatformAIService(
  openaiApiKey,
  geminiApiKey,
  testsPerPlatform // default: 5
);

const analysis = await aiService.testQuestion(
  "What is Nike known for?",
  "Nike",
  ["Adidas", "Puma"]
);
```

**Features:**
- ChatGPT testing via OpenAI API
- Gemini testing (with OpenAI fallback)
- Copilot simulation
- Brand mention detection
- Position tracking
- Sentiment analysis
- Competitor tracking

### 3. ComprehensiveAnalysisService (`/lib/services/comprehensive-analysis-service.ts`)

Orchestrates the full analysis:

```typescript
const analysisService = new ComprehensiveAnalysisService({
  brandName: "Nike",
  domain: "nike.com",
  competitors: ["Adidas", "Puma"],
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  ahrefsApiKey: process.env.AHREFS_API_KEY,
  testsPerPlatform: 5,
  questionsPerStage: 4,
  onProgress: async (progress, step) => {
    console.log(`${progress}%: ${step}`);
  },
});

const result = await analysisService.runAnalysis();
```

**Output Structure:**
```typescript
{
  brandOrKeyword: string,
  domain: string,
  overallScore: number, // 0-100
  totalTests: number,   // 180
  totalQuestions: number, // 12
  scoringMethodology: {
    mentionRate: { weight: 50, yourScore: number },
    averagePosition: { weight: 30, yourScore: number },
    sentiment: { weight: 20, yourScore: number },
  },
  journeyStages: [
    {
      stage: "awareness" | "consideration" | "decision",
      stageLabel: string,
      questions: [...],
      portrayal: {
        mentionRate: number,
        visibilityScore: number,
        averagePosition: number,
        sentiment: { positive, neutral, negative, dominant },
        aiAnswerExamples: [...],
        competitorComparison: [...],
      },
      recommendation: {
        commonPattern: string,
        contentType: string,
        focusedAction: string,
      },
    },
    // ... 2 more stages
  ],
}
```

## API Endpoints

### Start Analysis
```
POST /api/analysis/run
{
  "brandOrKeyword": "Nike",
  "domain": "nike.com",
  "competitors": "Adidas, Puma",
  "testsPerPlatform": 5,
  "questionsPerStage": 4
}
```

Response:
```json
{
  "success": true,
  "analysisId": "abc123"
}
```

### Get Analysis Results
```
GET /api/analysis/[id]
```

### Test Service
```
POST /api/test/ai-service
{
  "brand": "Nike",
  "testType": "quick" | "questions" | "ai" | "full"
}
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...           # For ChatGPT testing and AI analysis

# Optional
GEMINI_API_KEY=...              # For real Gemini testing (falls back to simulation)
AHREFS_API_KEY=...              # For real search volume data

# Database
POSTGRES_PRISMA_URL=...         # PostgreSQL connection string
```

## Scoring Methodology

The overall visibility score (0-100) is calculated as:

```
Score = (Mention Rate × 0.50) + (Position Score × 0.30) + (Sentiment Score × 0.20)
```

Where:
- **Mention Rate (50%)**: Percentage of AI responses mentioning the brand
- **Position Score (30%)**: `100 - ((Avg Position - 1) × 20)` (1st = 100, 5th = 20)
- **Sentiment Score (20%)**: `(Positive% - Negative% + 100) / 2` normalized to 0-100

## User Interface

### Demo Mode (`/demoui` → `/demo`)
- Instant results with template data
- Brand name customization
- No API calls needed

### Real Analysis Mode (`/demoui` → `/results/[id]`)
- 180 actual AI queries
- Real sentiment and mention data
- Statistical significance

### Full Report (`/results/[id]`)
- Journey stage visualization
- Real AI response excerpts
- Competitor comparison charts
- Actionable recommendations

## Statistical Significance

With 5 tests per platform × 3 platforms = 15 tests per question:
- 95% confidence interval for mention rate
- Reliable sentiment distribution
- Valid position averaging

## Performance

Typical analysis time: 3-5 minutes
- Question discovery: ~2 seconds
- AI testing: ~3-4 minutes (180 queries with rate limiting)
- Analysis and report: ~5 seconds

## Future Enhancements

1. **Real Gemini API**: Full Google Gemini integration when available
2. **Copilot API**: Official Microsoft Copilot API integration
3. **Historical Tracking**: Compare visibility over time
4. **Competitor Deep Dive**: Full analysis of competitor brands
5. **Custom Questions**: User-defined questions for testing
