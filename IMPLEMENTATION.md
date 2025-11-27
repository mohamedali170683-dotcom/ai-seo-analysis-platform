# AI Visibility Analysis - Implementation Guide

## Overview

This document explains the implementation of the journey-based AI visibility analysis system. The system analyzes how brands are portrayed across AI platforms (ChatGPT, Gemini) throughout the user journey (Awareness, Consideration, Decision).

## What Was Implemented

### 1. Enhanced AI Analysis Engine (`lib/services/ai-analysis-engine-journey.ts`)

**Key Features:**
- Journey stage-based analysis (Awareness, Consideration, Decision)
- Rich data structure matching the demo report format
- Scoring methodology: Mention Rate (50%) + Position (30%) + Sentiment (20%)
- Detailed AI response examples with platform, question, excerpt, position, and sentiment
- Competitor comparison with mention rates and average positions

**Main Methods:**
- `analyzeByJourneyStage()` - Main entry point that groups questions by stage
- `analyzeStage()` - Analyzes a single journey stage with full metrics
- `getAIAnswerExamples()` - Extracts up to 5 real AI response examples per stage
- `generateCompetitorComparison()` - Creates competitive landscape data
- `generateStageRecommendation()` - Uses GPT-4o-mini to generate strategic recommendations

**Scoring Formula:**
```
Visibility Score = (Mention Rate × 0.50) + (Position Score × 0.30) + (Sentiment Score × 0.20)

Where:
- Mention Rate: (Brand Mentions ÷ Total Tests) × 100
- Position Score: 100 - ((Avg Position - 1) × 20)
- Sentiment Score: Normalized from -100 to +100 based on positive vs negative sentiment
```

### 2. Shared Journey Report Component (`components/journey-stage-report.tsx`)

**Key Features:**
- Fully reusable React component for displaying journey analysis
- Matches the beautiful demo page design
- Shows:
  - Analysis effort banner (total tests, questions, stages)
  - Overall visibility score with methodology breakdown
  - Interactive journey stage selector
  - Sentiment definition guide
  - Detailed stage cards with:
    - Questions analyzed with search volumes
    - Mention rate and average position
    - Sentiment breakdown with visual indicators
    - Real AI response examples
    - Competitive comparison with bar charts
    - Recommendations (common patterns, content types, focused actions)

**Props:**
- `brandName` - The brand being analyzed
- `domain` - Brand's website domain
- `overallScore` - Overall visibility score (0-100)
- `totalTests` - Total AI queries performed
- `totalQuestions` - Total questions tested
- `journeyStages` - Array of journey stage data
- `scoringMethodology` - Optional methodology details
- `sentimentDefinitions` - Optional sentiment definitions
- `showHeader` - Whether to show the page header
- `backLink` - URL for the back button

### 3. Updated Analysis Results Page (`app/analysis/[id]/page.tsx`)

**Changes:**
- Now uses the shared `JourneyStageReport` component
- Simplified from 400+ lines to ~150 lines
- Automatically shows rich data from the API
- Removed duplicate code (moved to shared component)

### 4. Analysis Pipeline (`lib/services/analysis-pipeline.ts`)

**Already Implements:**
- Question discovery using DataForSEO (with fallback to mock questions)
- Batch AI testing with ChatGPT and Gemini
- Journey stage analysis with recommendations
- Saves results to database with proper structure

**Data Flow:**
1. User submits analysis request → Creates Analysis record
2. Pipeline discovers relevant questions → Saves to DiscoveredQuestions
3. Pipeline tests questions with AI platforms → Saves to AITestResults
4. Pipeline runs journey stage analysis → Saves to AIInsights
5. API retrieves data and formats for display → Analysis results page shows rich report

### 5. Batch AI Testing Service (`lib/services/batch-ai-testing-service.ts`)

**Capabilities:**
- Tests each question 5 times per platform (configurable)
- Analyzes brand mentions, position, sentiment
- Extracts full responses for example display
- Platform mapping (chatgpt → ChatGPT, gemini → Gemini)

## Data Structure

### Journey Stage Analysis Interface
```typescript
interface JourneyStageAnalysis {
  stage: "awareness" | "consideration" | "decision";
  stageLabel: string;
  stageDescription: string;
  icon: string; // "Brain", "Users", or "ShoppingCart"
  color: string; // Tailwind gradient classes
  
  questions: {
    question: string;
    searchVolume: number;
    answersAnalyzed: number;
  }[];
  
  portrayal: {
    mentionRate: number; // Percentage (0-100)
    totalQuestions: number;
    totalTests: number;
    totalAnswersAnalyzed: number;
    visibilityScore: number; // 0-100
    averagePosition: number; // Average position when mentioned
    
    sentiment: {
      positive: number; // Percentage
      negative: number; // Percentage
      neutral: number; // Percentage
      dominant: "positive" | "negative" | "neutral";
    };
    
    aiAnswerExamples: {
      platform: string; // "ChatGPT", "Gemini", "Copilot"
      question: string;
      excerpt: string; // ~300 char excerpt with brand mention
      brandPosition: number;
      sentiment: "positive" | "negative" | "neutral";
    }[];
    
    competitorComparison: {
      competitorName: string;
      mentionRate: number;
      avgPosition: number;
      sentiment: "positive" | "negative" | "neutral";
    }[];
  };
  
  recommendation: {
    commonPattern: string; // AI-identified pattern
    contentType: string; // Type of content needed
    focusedAction: string; // Specific recommended action
  };
}
```

## How to Use

### Running an Analysis

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Set up environment variables:**
   ```bash
   POSTGRES_PRISMA_URL="your-database-url"
   OPENAI_API_KEY="your-openai-key"
   GEMINI_API_KEY="your-gemini-key" # Optional
   DATAFORSEO_LOGIN="your-dataforseo-login"
   DATAFORSEO_PASSWORD="your-dataforseo-password"
   ```

3. **Navigate to http://localhost:3000**

4. **Fill in the form:**
   - Brand or Keyword (e.g., "Nike", "Shopify")
   - Domain (e.g., "nike.com")
   - Competitors (optional, comma-separated)

5. **Click "Check AI Visibility"**

6. **Wait 5-10 minutes** for analysis to complete

7. **View your detailed report** with all the features shown in the demo

### Viewing the Demo

Navigate to http://localhost:3000/demo to see a sample report with mock data (Purina analysis).

## API Endpoints

### POST `/api/analysis/start`
Starts a new analysis.

**Request Body:**
```json
{
  "brandOrKeyword": "Nike",
  "domain": "nike.com",
  "competitors": ["Adidas", "Puma"]
}
```

**Response:**
```json
{
  "success": true,
  "analysisId": "clx1234567890",
  "message": "Analysis started successfully"
}
```

### GET `/api/analysis/[id]`
Retrieves analysis results.

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "clx1234567890",
    "brandOrKeyword": "Nike",
    "status": "completed",
    "stats": {
      "visibilityScore": 67,
      "overallMentionRate": 65.5,
      "totalQuestions": 12,
      "totalTests": 180
    },
    "journeyStages": [/* JourneyStageAnalysis[] */]
  }
}
```

## Database Schema

The system uses the following Prisma models:

- **Analysis** - Main analysis record with status and progress
- **DiscoveredQuestion** - Questions found for analysis (with category: awareness/consideration/decision)
- **AITestResult** - Individual AI query results with platform, response, sentiment
- **DetectedCompetitor** - Competitors found during analysis
- **AIInsight** - Journey stage analyses and recommendations

## Testing

To test the system with real data:

1. Ensure you have valid API keys (OpenAI, DataForSEO)
2. Run the database migrations: `npx prisma migrate dev`
3. Start an analysis from the home page
4. Monitor the analysis progress page
5. Verify the results match the demo format

## Key Differences from Demo

The real implementation:
- ✅ Uses actual AI queries (ChatGPT, Gemini)
- ✅ Discovers real questions using DataForSEO
- ✅ Calculates real metrics from test results
- ✅ Generates AI-powered recommendations
- ✅ Shows real competitor comparisons
- ✅ Displays actual AI response examples
- ⚠️ May have fewer examples if testing budget is limited (uses 5 tests per question by default vs 15 in demo)

## Performance Considerations

- Each question is tested 5 times per platform (10 total queries)
- A typical analysis tests 12 questions = 120 AI queries
- Expected time: 5-10 minutes (with 1 second delay between queries)
- OpenAI costs: ~$0.50-1.00 per full analysis (using gpt-4o-mini)

## Future Enhancements

Potential improvements:
1. Add Microsoft Copilot testing
2. Real-time streaming progress updates
3. Historical tracking (compare analyses over time)
4. PDF report export
5. More sophisticated competitor detection
6. A/B testing recommendations
7. Integration with analytics platforms

## Support

For issues or questions:
1. Check the logs in the browser console and terminal
2. Verify all environment variables are set
3. Ensure the database is migrated and accessible
4. Check API rate limits (OpenAI, DataForSEO)
