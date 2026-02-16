# Velaris — AI Visibility Analysis Platform

Velaris is an AI visibility analysis tool that measures how well your brand appears in AI-generated responses from ChatGPT, Gemini, and Perplexity. In the emerging era of AI-powered search, traditional SEO metrics don't capture whether AI assistants recommend your brand. Velaris fills this gap.

## The Problem We Solve

When users ask ChatGPT "What's the best running shoe for beginners?" or Perplexity "Which CRM should I use?", AI models generate recommendations based on their training data and real-time sources. **Your brand may or may not appear in these responses** — and unlike traditional search where you can track rankings, there's been no way to measure AI visibility.

Velaris answers:
- Is your brand mentioned when users ask AI about your category?
- What position does your brand appear in (1st recommendation vs 5th)?
- Is the sentiment positive, neutral, or negative?
- How do you compare to competitors?
- What can you do to improve?

## How It Works

### 1. Question Discovery

Velaris discovers the questions users actually ask about your brand and category:

**Real Search Data (via DataForSEO)**
- Fetches actual "People Also Ask" questions from Google
- Returns questions with real monthly search volumes
- Examples: "is Nike good for running?" (12K/mo), "Nike vs Adidas for gym" (8.2K/mo)

**AI-Generated Strategic Questions (via OpenAI)**
- Generates brand-specific questions using GPT-4o-mini
- Informed by brand context (industry, positioning, competitors)
- Covers all funnel stages: Awareness → Consideration → Decision

**Brand Context Enrichment**
- Scrapes your website for meta descriptions and product info
- Fetches Wikipedia data for known brands
- Disambiguates short/acronym brands (e.g., "QS" → "QS fashion brand")

### 2. Multi-Platform AI Testing

For each selected question, Velaris queries real AI platforms:

| Platform | API | What We Measure |
|----------|-----|-----------------|
| ChatGPT | OpenAI GPT-4o | Brand mention, position, sentiment |
| Gemini | Google Gemini Pro | Brand mention, position, sentiment |
| Perplexity | Perplexity API | Brand mention, position, sentiment, sources |

Each question is tested multiple times per platform (configurable) to account for AI response variability.

### 3. Response Analysis

For every AI response, Velaris extracts:
- **Brand Mentioned**: Yes/No — does the response include your brand?
- **Position**: If mentioned, where? (1st = best, 5th+ = buried)
- **Sentiment**: Positive/Neutral/Negative — how is the brand portrayed?
- **Context Extract**: The exact sentence where your brand appears
- **Competitors Mentioned**: Which competitors appear alongside you?
- **Cited Sources**: URLs the AI referenced (especially for Perplexity)

### 4. Funnel Stage Scoring

Questions are categorized into three buyer journey stages:

| Stage | Weight | Example Questions |
|-------|--------|-------------------|
| **Awareness** | 20% | "What is [brand]?", "Is [brand] legit?" |
| **Consideration** | 35% | "[Brand] vs [competitor]", "Best [category] brands" |
| **Decision** | 45% | "Should I buy [brand]?", "Where to buy [brand]?" |

Each stage gets a visibility score (0-100) based on:
- **Mention Rate (50%)**: % of responses that mention your brand
- **Position Score (30%)**: Average ranking (1st = 100pts, 5th = 20pts)
- **Sentiment Score (20%)**: Net positive sentiment

The **Overall Visibility Score** is a weighted average across stages, emphasizing Decision (where purchases happen).

### 5. Research-Backed Recommendations

Recommendations are powered by peer-reviewed GEO (Generative Engine Optimization) research:

**Key findings embedded in Velaris:**
- Expert quotations: +40.9% visibility lift (KDD 2024, Princeton/IIT Delhi)
- Statistics inclusion: +30.6% visibility lift
- Source citations: +27.5% visibility lift
- Keyword stuffing: -8.3% visibility (harmful)

Platform-specific insights:
- **ChatGPT**: 47.9% of citations from Wikipedia; Bing-indexed sources preferred
- **Perplexity**: 46.7% from Reddit/forums; 2-3 day freshness decay
- **Gemini**: 76% from top-10 organic results; Knowledge Graph = +60% visibility

## Architecture

### Tech Stack

```
Frontend:    Next.js 14 + React + TypeScript + Tailwind CSS
Backend:     Next.js API Routes (serverless functions)
Database:    PostgreSQL + Prisma ORM
AI APIs:     OpenAI (GPT-4o, GPT-4o-mini), Google Gemini, Perplexity
Search Data: DataForSEO (keyword volumes, PAA questions)
Hosting:     Vercel (recommended)
```

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SETUP                    2. QUESTIONS                        │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │ Brand: Nike      │   →    │ Select questions │               │
│  │ Category: Shoes  │        │ from 3 stages    │               │
│  │ Competitors: ... │        │ (Real + AI-gen)  │               │
│  └──────────────────┘        └──────────────────┘               │
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │ /api/analysis/   │        │ /api/analysis/   │               │
│  │ discover         │        │ run-selected     │               │
│  └──────────────────┘        └──────────────────┘               │
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │ DataForSEO API   │        │ OpenAI API       │               │
│  │ (real questions) │        │ Gemini API       │               │
│  │       +          │        │ Perplexity API   │               │
│  │ OpenAI API       │        └──────────────────┘               │
│  │ (AI questions)   │                 │                          │
│  └──────────────────┘                 ▼                          │
│                              ┌──────────────────┐               │
│  3. RESULTS                  │ Response Analysis│               │
│  ┌──────────────────┐        │ • Brand detection│               │
│  │ Visibility Score │   ←    │ • Position calc  │               │
│  │ Funnel Breakdown │        │ • Sentiment      │               │
│  │ Recommendations  │        │ • Competitors    │               │
│  └──────────────────┘        └──────────────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Services

| Service | File | Purpose |
|---------|------|---------|
| DataForSEO Service | `lib/services/dataforseo-service.ts` | Fetches real search questions with volumes |
| AI Testing Service | `lib/services/multi-platform-ai-service.ts` | Queries ChatGPT/Gemini/Perplexity |
| Brand Data Fetcher | `lib/services/brand-data-fetcher.ts` | Enriches brand context from web/Wikipedia |
| Analysis Insights Engine | `lib/services/analysis-insights-engine.ts` | Generates research-backed insights |
| GEO Knowledge Base | `lib/knowledge/geo-research.ts` | Peer-reviewed research findings |

### Database Schema (Prisma)

```prisma
model Analysis {
  id                  String               @id
  userId              String
  brandOrKeyword      String
  domain              String?
  competitors         String[]
  status              AnalysisStatus       // pending → running → completed
  progress            Int                  // 0-100
  aiInsights          AIInsight[]          // Journey stage data + recommendations
  aiTestResults       AITestResult[]       // Individual AI responses
  discoveredQuestions DiscoveredQuestion[] // Questions tested
}

model AITestResult {
  id               String   @id
  analysisId       String
  question         String
  platform         String   // ChatGPT, Gemini, Perplexity
  brandMentioned   Boolean
  brandPosition    Int?
  sentiment        String   // positive, neutral, negative
  fullResponse     String
  competitorsMentioned String[]
}

model AIInsight {
  id             String   @id
  analysisId     String
  category       String   // journey_stage, website_audit
  title          String
  finding        String
  actions        String[]
  expectedImpact Json     // Contains stage data, recommendations
}
```

## Project Structure

```
ai-seo-analysis-platform/
├── app/
│   ├── analyze/                 # Analysis setup + question selection
│   │   └── page.tsx             # 3-step wizard: Setup → Questions → Results
│   ├── results/[id]/            # Results dashboard
│   │   └── page.tsx             # Visibility scores, funnel breakdown, insights
│   ├── api/analysis/
│   │   ├── discover/route.ts    # Question discovery endpoint
│   │   ├── run-selected/route.ts# Run analysis on selected questions
│   │   └── [id]/route.ts        # Fetch analysis results
│   ├── features/                # Marketing: Features page
│   ├── pricing/                 # Marketing: Pricing page
│   └── page.tsx                 # Marketing: Home page
│
├── components/
│   ├── journey-stage-report.tsx # Funnel stage visualization
│   ├── tier-*.tsx               # Pricing tier components
│   └── ui/                      # Shared UI components
│
├── lib/
│   ├── services/
│   │   ├── dataforseo-service.ts      # DataForSEO API client
│   │   ├── multi-platform-ai-service.ts # AI platform testing
│   │   ├── brand-data-fetcher.ts      # Brand context enrichment
│   │   ├── analysis-insights-engine.ts # Insight generation
│   │   └── comprehensive-analysis-service.ts # Full analysis orchestration
│   ├── knowledge/
│   │   └── geo-research.ts            # GEO research knowledge base
│   ├── hooks/                         # React hooks (useTier, useI18n)
│   └── utils/                         # Utility functions
│
├── prisma/
│   └── schema.prisma            # Database schema
│
└── public/                      # Static assets
```

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- API Keys:
  - OpenAI (required) — for ChatGPT testing + AI question generation
  - DataForSEO (optional) — for real search volume data
  - Google Gemini (optional) — for Gemini platform testing
  - Perplexity (optional) — for Perplexity platform testing

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/velaris.git
cd velaris

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys (see below)

# Initialize database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### Environment Variables

```bash
# Database (required)
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/velaris"

# OpenAI (required)
OPENAI_API_KEY="sk-..."

# DataForSEO (optional — enables real search questions)
DATAFORSEO_LOGIN="your-login"
DATAFORSEO_PASSWORD="your-password"

# Google Gemini (optional — enables Gemini testing)
GEMINI_API_KEY="your-gemini-key"

# Perplexity (optional — enables Perplexity testing)
PERPLEXITY_API_KEY="pplx-..."
```

### Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## Usage

### Running an Analysis

1. **Navigate to `/analyze`**

2. **Setup (Step 1)**
   - Enter brand name (e.g., "Nike")
   - Select category (e.g., "Running Shoes")
   - Optionally add domain, competitors, brand description

3. **Question Selection (Step 2)**
   - View discovered questions organized by funnel stage
   - "Real Search Data" = actual questions from DataForSEO with search volumes
   - "AI-Generated" = strategic questions from OpenAI
   - Select at least 3 questions total

4. **Analysis (Step 3)**
   - Selected questions are tested on all AI platforms
   - Progress shows real-time status
   - Takes ~2-5 minutes depending on question count

5. **Results**
   - Overall Visibility Score (0-100)
   - Funnel stage breakdown with per-stage scores
   - AI answer examples showing how your brand is portrayed
   - Competitor comparison
   - Research-backed recommendations

### API Endpoints

**POST `/api/analysis/discover`**
```json
{
  "brandName": "Nike",
  "category": "running shoes",
  "domain": "nike.com",
  "competitors": ["Adidas", "New Balance"],
  "buyerPersona": "fitness_enthusiast"
}
```

**POST `/api/analysis/run-selected`**
```json
{
  "brandName": "Nike",
  "category": "running shoes",
  "selectedQuestions": [
    { "question": "Best running shoes 2024?", "category": "consideration", "type": "category" }
  ],
  "selectedPlatforms": ["ChatGPT", "Gemini", "Perplexity"],
  "testsPerPlatform": 2
}
```

**GET `/api/analysis/[id]`**
Returns full analysis results including insights, test results, and scores.

## Scoring Methodology

### Visibility Score Formula

```
Visibility Score = (Mention Rate × 0.50) + (Position Score × 0.30) + (Sentiment Score × 0.20)
```

**Mention Rate (50% weight)**
- Percentage of AI responses that mention your brand
- 100% = mentioned in every response
- 0% = never mentioned

**Position Score (30% weight)**
- Where your brand appears in AI recommendations
- 1st position = 100 points
- 2nd position = 80 points
- 3rd position = 60 points
- 4th position = 40 points
- 5th+ position = 20 points

**Sentiment Score (20% weight)**
- How positively your brand is portrayed
- Calculated as: `(Positive% - Negative% + 100) / 2`
- 100 = purely positive, 0 = purely negative, 50 = neutral

### Stage Weights

| Stage | Weight | Rationale |
|-------|--------|-----------|
| Awareness | 20% | Early funnel, low purchase intent |
| Consideration | 35% | Active evaluation, moderate intent |
| Decision | 45% | High purchase intent, most valuable |

## Research Foundation

Velaris recommendations are based on peer-reviewed research:

### GEO Study (KDD 2024)
*"GEO: Generative Engine Optimization"* — Princeton & IIT Delhi

**Key findings:**
- Fluency optimization: +15.8% visibility
- Unique words: +15.2% visibility
- Authoritative tone: +11.2% visibility
- Expert quotations: +40.9% visibility
- Statistics inclusion: +30.6% visibility
- Source citations: +27.5% visibility
- Keyword stuffing: **-8.3% visibility** (harmful)

### Platform-Specific Research

**ChatGPT (Bing-indexed)**
- 47.9% of citations from Wikipedia
- Prefers established, frequently-cited sources
- Knowledge cutoff affects recent brand data

**Perplexity (Real-time search)**
- 46.7% from Reddit and forums
- 2-3 day freshness decay
- UGC-heavy source prioritization

**Gemini (Google index)**
- 76% from top-10 organic results
- Knowledge Graph presence = +60% visibility
- Strong E-E-A-T signal correlation

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with care by the Velaris team.
