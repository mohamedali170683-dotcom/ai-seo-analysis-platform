# Velaris — AI Visibility Analysis Platform

A web application that analyzes how AI platforms (ChatGPT, Gemini, Perplexity) mention and recommend your brand across the user journey, providing actionable insights to improve AI visibility.

## Features

### AI Visibility Analysis
- **Multi-Platform Testing**: Queries across ChatGPT, Gemini, and Perplexity
- **Funnel Stage Analysis**: Brand presence across Awareness, Consideration, and Decision stages
- **Visibility Scoring**: Score (0–100) based on mention rate, position, and sentiment
- **Competitive Intelligence**: Compare visibility against competitors
- **Strategic Recommendations**: AI-generated insights to improve visibility

### Smart Question Discovery
- **DataForSEO Integration**: Real "People Also Ask" questions from search data
- **AI-Powered Question Generation**: OpenAI generates brand-specific funnel questions using full brand context
- **Brand Disambiguation**: Short/acronym brand names are automatically qualified with industry context to avoid irrelevant results (e.g., "QS" → "QS fashion")
- **Brand Context Enrichment**: Fetches brand data from website metadata and Wikipedia to inform question generation
- **Optional Brand Description**: Users can provide a free-text description for lesser-known or ambiguous brands
- **Template Fallback**: If AI generation fails, enhanced template-based questions are used

### Analysis Form
- Brand name, domain, category, target country, and language
- Optional brand description for disambiguation
- Competitor input (tier-dependent limits)
- AI-suggested buyer personas

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Design System**: Stratum UI (Work Sans + Rubik fonts, petrol/orange/blue palette)
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **AI APIs**: OpenAI (GPT-4o, GPT-4o-mini), Google Gemini
- **Search Data**: DataForSEO (People Also Ask, keyword data)
- **Brand Data**: Wikipedia API, website metadata scraping

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- API Keys: OpenAI (required), DataForSEO (optional), Google Gemini (optional)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd ai-seo-analysis-platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables

Required in `.env`:

```bash
# Database
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/seo_analysis"

# OpenAI (required)
OPENAI_API_KEY="your-openai-api-key"

# DataForSEO (optional — enables real search questions)
DATAFORSEO_LOGIN="your-login"
DATAFORSEO_PASSWORD="your-password"

# Google Gemini (optional — enables Gemini platform testing)
GEMINI_API_KEY="your-gemini-key"
```

### Usage

1. Navigate to `/analyze`
2. Enter brand name, category, and optionally domain + brand description
3. Click **Discover Questions** — the system fetches real search questions and generates AI-powered funnel questions
4. Select questions to analyze
5. Run analysis — AI platforms are queried and results are scored
6. View the report with visibility scores, funnel breakdown, and recommendations

## Project Structure

```
ai-seo-analysis-platform/
├── app/
│   ├── analyze/           # Analysis form (question discovery + run)
│   ├── results/           # Analysis results page
│   ├── api/
│   │   └── analysis/
│   │       ├── discover/  # Question discovery endpoint
│   │       ├── run-selected/  # Run analysis on selected questions
│   │       └── [id]/      # Fetch analysis results
│   ├── features/          # Features page
│   ├── pricing/           # Pricing page
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/
│   ├── services/
│   │   ├── dataforseo-service.ts    # DataForSEO API integration
│   │   ├── brand-data-fetcher.ts    # Wikipedia + website brand data
│   │   ├── ai-testing-service.ts    # AI platform query service
│   │   ├── persona-query-engine.ts  # Buyer persona query mapping
│   │   └── website-audit-service.ts # Website technical audit
│   ├── db/                # Database utilities
│   └── types/             # TypeScript types
├── prisma/                # Database schema
└── public/                # Static assets
```

## Recent Changes

### Brand Disambiguation (Jan 2025)
Fixed an issue where short or acronym brand names (e.g., "QS") returned irrelevant questions from unrelated domains (finance instead of fashion). Three layers were added:

1. **Brand context enrichment** — fetches industry, positioning, and product data from domain/Wikipedia before question generation
2. **AI-powered question generation** — sends full brand context to OpenAI for tailored funnel questions, with template fallback
3. **DataForSEO query qualification** — short names (≤3 chars) and acronyms (≤5 chars) are appended with industry/category

### Stratum UI Design System (Jan 2025)
Applied custom design system across all components: Work Sans + Rubik typography, petrol/orange/blue color palette, light-mode only.

## License

MIT
