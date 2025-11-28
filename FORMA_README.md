# Forma & Attention - Behavioral Science Optimization Platform

![Forma & Attention](https://img.shields.io/badge/BSOS-0--100-purple) ![Next.js](https://img.shields.io/badge/Next.js-16.0-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Prisma](https://img.shields.io/badge/Prisma-6.19-teal)

## 🧠 Overview

**Forma & Attention** is a behavioral science-based conversion optimization platform that systematically measures and improves how brands capture, maintain, and convert attention into measurable business results.

### Core Value Proposition

> **Want to improve conversions without doubling your ad spend?**  
> We engineer persuasion, using proven behavioral science.

## 🎯 Key Features

### 1. Behavioral Science Optimization Score (BSOS)

A comprehensive 0-100 scoring system that quantifies behavioral science application across three channels:

- **Website/Blog (0-33 points)**
  - Bias Implementation (0-12): Social proof, authority, scarcity, reciprocity
  - Choice Architecture (0-12): Option presentation, defaults, CTA design, pricing
  - Journey Optimization (0-9): Navigation flow, friction reduction, decision staging

- **Social Media (0-33 points)**
  - Content Engagement (0-12): Emotional triggers, storytelling, social proof
  - Behavioral Triggers (0-12): Scarcity, urgency, reciprocity, commitment
  - Visual Psychology (0-9): Color psychology, attention direction, hierarchy

- **Paid Advertising (0-34 points)**
  - Creative Effectiveness (0-12): Headlines, visual hierarchy, attention capture
  - Persuasion Architecture (0-12): Bias application, loss aversion, social proof
  - Landing Page Alignment (0-10): Message consistency, conversion path

### 2. Interactive Assessment

Step-by-step evaluation form with:
- 33 individual behavioral science metrics
- Slider-based rating system (0-3 or 0-4 points each)
- Real-time progress tracking
- Contextual descriptions for each metric

### 3. Comprehensive Results Dashboard

- Overall BSOS score with visual gauge
- Component breakdown (Website, Social, Ads)
- Sub-component analysis with progress bars
- Color-coded scoring (Green: 75-100, Blue: 50-74, Yellow: 25-49, Red: 0-24)

### 4. Personalized Recommendations

Priority-based optimization suggestions:
- **High Priority**: Critical improvements with 20-60% impact potential
- **Medium Priority**: Significant opportunities with 10-30% impact
- **Low Priority**: Incremental improvements

Each recommendation includes:
- Detailed description
- Expected impact (conversion lift %)
- Effort level (low, medium, high)
- Implementation timeline (1-8 weeks)

## 🏗️ Technical Architecture

### Tech Stack

- **Framework**: Next.js 16.0 (App Router)
- **Language**: TypeScript 5.9
- **Database**: PostgreSQL with Prisma ORM 6.19
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI + Lucide Icons
- **Deployment**: Vercel (recommended)

### Project Structure

```
/workspace
├── app/
│   ├── forma/                    # Forma feature pages
│   │   ├── page.tsx             # Landing page
│   │   ├── assessment/
│   │   │   └── page.tsx         # Assessment form
│   │   └── results/
│   │       └── [id]/
│   │           └── page.tsx     # Results dashboard
│   └── api/
│       └── forma/
│           └── assessment/
│               └── route.ts     # API endpoints
├── lib/
│   ├── services/
│   │   └── bsos-calculator.ts  # BSOS calculation engine
│   └── db/
│       └── prisma.ts           # Prisma client
├── prisma/
│   └── schema.prisma           # Database schema
└── components/
    └── ui/                     # Reusable UI components
```

## 🚀 Deployment Guide

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use Vercel Postgres)
- GitHub account
- Vercel account

### Option 1: Deploy to Vercel (Recommended)

#### Step 1: Push to GitHub

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: Forma & Attention platform"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/forma-attention.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

#### Step 3: Add Database

Choose one of these options:

**Option A: Vercel Postgres (Easiest)**

1. In your Vercel project dashboard, go to "Storage"
2. Click "Create Database" → "Postgres"
3. Follow the prompts to create a database
4. Vercel will automatically add `POSTGRES_PRISMA_URL` to your environment variables

**Option B: External PostgreSQL**

1. Go to your Vercel project → "Settings" → "Environment Variables"
2. Add the following variable:
   ```
   POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/database
   ```
3. Click "Save"

#### Step 4: Run Database Migrations

After deployment, Vercel will automatically run:
```bash
prisma generate
prisma migrate deploy
```

If you need to run migrations manually:
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
```

#### Step 5: Access Your Deployed App

Your app will be live at: `https://your-project-name.vercel.app`

Visit `/forma` to see the landing page and start using the platform!

### Option 2: Local Development

#### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/forma-attention.git
cd forma-attention

# Install dependencies
npm install
```

#### Step 2: Configure Database

```bash
# Copy environment variables
cp .env.example .env

# Edit .env and add your database URL
# POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/forma"
```

#### Step 3: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

#### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/forma](http://localhost:3000/forma) in your browser.

## 📊 Database Schema

### Core Models

**Project** - Brand/company being assessed
- `brandName`: Company name
- `websiteUrl`: Website URL (optional)
- `industry`: Industry category (optional)

**Assessment** - BSOS evaluation results
- `bsosScore`: Overall score (0-100)
- `websiteScore`, `socialScore`, `adScore`: Component scores
- `websiteData`, `socialData`, `adData`: Raw assessment data (JSON)
- `recommendations`: Generated recommendations (JSON)
- `status`: Assessment status (draft, completed)

### Migrations

To create a new migration after schema changes:

```bash
npx prisma migrate dev --name description_of_change
```

## 🎨 Customization

### Adjusting Scoring Algorithms

Edit `/lib/services/bsos-calculator.ts`:

```typescript
// Modify max values for each metric
static calculateWebsiteScore(assessment: WebsiteAssessment): number {
  // Customize scoring logic here
}

// Adjust recommendation thresholds
private static generateRecommendations(...) {
  if (website.websiteBias < 8) {
    // Customize recommendation triggers
  }
}
```

### Styling and Branding

All UI uses Tailwind CSS. Main brand colors:

```css
/* Primary: Purple */
bg-purple-600
text-purple-400
border-purple-500

/* Accent: Pink */
bg-pink-600
from-purple-600 to-pink-600

/* Background: Dark gradients */
from-slate-900 via-purple-900 to-slate-900
```

### Adding New Metrics

1. Update the assessment interface in `bsos-calculator.ts`
2. Add slider inputs in `app/forma/assessment/page.tsx`
3. Update calculation logic in `BSOSCalculator.calculateBSOS()`
4. Adjust max score values if needed

## 📈 Usage Flow

### User Journey

1. **Landing Page** (`/forma`)
   - View product positioning
   - Understand BSOS framework
   - Click "Start Assessment"

2. **Assessment** (`/forma/assessment`)
   - Step 1: Enter project information
   - Step 2: Rate website/blog (11 metrics)
   - Step 3: Rate social media (11 metrics)
   - Step 4: Rate paid advertising (11 metrics)
   - Submit for calculation

3. **Results** (`/forma/results/[id]`)
   - View overall BSOS score
   - Analyze component breakdowns
   - Review personalized recommendations
   - Download or share results

### API Endpoints

**POST** `/api/forma/assessment`
- Creates new assessment
- Calculates BSOS score
- Returns assessment ID

```typescript
// Request body
{
  brandName: string;
  websiteUrl?: string;
  industry?: string;
  website: WebsiteAssessment;
  social: SocialMediaAssessment;
  ads: PaidAdvertisingAssessment;
}

// Response
{
  success: true;
  assessmentId: string;
  bsosScore: number;
  interpretation: string;
}
```

**GET** `/api/forma/assessment`
- Returns recent assessments (last 10)

## 🧪 Testing the Platform

### Quick Test Flow

1. Navigate to `/forma`
2. Click "Calculate Your BSOS Score"
3. Fill out the form with sample data:
   - Brand Name: "Test Company"
   - Rate all sliders at midpoint (1-2)
4. Complete all 4 steps
5. View results dashboard

### Sample Scenarios

**High Performer** (Score: 80+)
- Set most sliders to 3 (max)
- Expected: Green score, few recommendations

**Moderate Performer** (Score: 50-74)
- Set sliders to mix of 1-2
- Expected: Blue score, several recommendations

**Needs Improvement** (Score: <50)
- Set most sliders to 0-1
- Expected: Yellow/Red score, many recommendations

## 🔒 Security Considerations

For production deployment:

1. **Authentication**: Add user authentication (NextAuth.js recommended)
2. **Rate Limiting**: Implement API rate limits
3. **Input Validation**: Add Zod schemas for all inputs
4. **CORS**: Configure appropriate CORS policies
5. **Environment Variables**: Never commit `.env` files

## 🤝 Contributing

This is a prototype for demonstration purposes. Key areas for expansion:

- [ ] User authentication and multi-tenancy
- [ ] Historical comparison (track score improvements)
- [ ] PDF export of results
- [ ] AI-powered analysis of actual websites
- [ ] Integration with analytics platforms
- [ ] A/B testing framework integration
- [ ] Competitor benchmarking

## 📝 License

MIT License - See LICENSE file for details

## 🙋 Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include error messages and screenshots

## 🎓 Behavioral Science Resources

Learn more about the principles behind Forma:

- **Social Proof**: Cialdini, R. (2006). Influence: The Psychology of Persuasion
- **Choice Architecture**: Thaler, R. & Sunstein, C. (2008). Nudge
- **Visual Psychology**: Kahneman, D. (2011). Thinking, Fast and Slow
- **Loss Aversion**: Tversky, A. & Kahneman, D. (1979). Prospect Theory

---

**Built with ❤️ using behavioral science and modern web technologies**

For the live demo, visit: [Your Vercel URL]
