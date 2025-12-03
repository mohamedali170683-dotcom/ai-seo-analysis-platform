# 🎯 Forma & Attention - Extraction Guide

## 📦 Complete File List for Forma Project

### Core Application Files

**Frontend Pages:**
```
app/forma/page.tsx                    - Landing page
app/forma/assessment/page.tsx         - BSOS calculator
app/forma/results/[id]/page.tsx      - Results display
```

**API Routes:**
```
app/api/forma/assessment/route.ts    - Assessment API
```

**Business Logic:**
```
lib/services/bsos-calculator.ts      - BSOS calculation engine
```

### Documentation Files

```
FORMA_README.md                       - Main documentation
FORMA_QUICKSTART.md                   - Quick start guide
FORMA_COMPLETE.md                     - Complete feature list
FORMA_DELIVERABLES.md                 - Deliverables documentation
FORMA_PROJECT_SUMMARY.md              - Project summary
```

---

## 🚀 How to Create Separate Forma Project

### Step 1: Create New GitHub Repository

1. Go to: https://github.com/new
2. Name: `forma-bsos-calculator` (or your choice)
3. Description: "Behavioral Science Optimization Score Calculator"
4. Make it Public or Private
5. **Don't** initialize with README (we have files)
6. Click "Create repository"

### Step 2: Clone This Repository Locally

```bash
# Clone the current repo
git clone https://github.com/mohamedali170683-dotcom/ai-seo-analysis-platform.git forma-project
cd forma-project

# Remove the origin
git remote remove origin

# Add new repository as origin
git remote add origin https://github.com/YOUR-USERNAME/forma-bsos-calculator.git
```

### Step 3: Remove AI Visibility Files (Keep Only Forma)

```bash
# Remove AI visibility specific files
rm -rf app/analysis
rm -rf app/results
rm -rf app/demoui
rm -rf app/demo
rm app/dashboard/page.tsx

# Remove AI visibility API routes
rm -rf app/api/analysis

# Remove AI visibility services
rm lib/services/ai-analysis-engine-journey.ts
rm lib/services/analysis-pipeline.ts
rm lib/services/batch-ai-testing-service.ts
rm lib/services/ahrefs-question-service.ts
rm lib/services/question-discovery-service.ts
rm lib/utils/demo-template-generator.ts

# Remove AI visibility documentation
rm JOURNEY_ANALYSIS_GUIDE.md
rm TRANSFORMATION_SUMMARY.md
rm DEMO_TO_PRODUCTION_COMPLETE.md
rm INTERACTIVE_DEMO_GUIDE.md
rm QUICK_START.md
rm AHREFS_SETUP.md
rm BUG_FIX_STUCK_AT_5_PERCENT.md
rm INSTANT_MODE.md
rm INSTANT_MODE_SUMMARY.md
rm IMPLEMENTATION.md
rm IMPLEMENTATION_SUMMARY.md
rm SPEED_OPTIMIZATIONS.md
rm ULTRA_FAST_MODE.md
rm FIX_SUMMARY.md

# Remove AI visibility components
rm components/journey-stage-report.tsx

# Keep only Forma files!
```

### Step 4: Update package.json

Edit `package.json`:
```json
{
  "name": "forma-bsos-calculator",
  "version": "1.0.0",
  "description": "Behavioral Science Optimization Score Calculator",
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && prisma db push && next build",
    "start": "next start"
  }
}
```

### Step 5: Update README.md

Create a new README focused on Forma:
```markdown
# Forma & Attention - BSOS Calculator

Behavioral Science Optimization Score calculator for conversion optimization.

## Features
- BSOS scoring (0-100)
- 33-metric assessment
- Website, Social Media, and Paid Ads analysis

## Quick Start
See FORMA_QUICKSTART.md
```

### Step 6: Update Home Page

Edit `app/page.tsx`:
```typescript
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/forma');
}
```

### Step 7: Commit and Push

```bash
git add .
git commit -m "Initial Forma & Attention project"
git push -u origin main
```

### Step 8: Deploy to Vercel

1. Go to: https://vercel.com/new
2. Import your new repository: `forma-bsos-calculator`
3. Configure:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Environment Variables:
     ```
     POSTGRES_PRISMA_URL=your_database_url
     OPENAI_API_KEY=your_openai_key
     ```
4. Click "Deploy"

---

## 🎨 Forma Project Structure

```
forma-bsos-calculator/
├── app/
│   ├── forma/
│   │   ├── page.tsx                 # Landing page
│   │   ├── assessment/page.tsx      # Calculator
│   │   └── results/[id]/page.tsx    # Results
│   ├── api/
│   │   └── forma/
│   │       └── assessment/route.ts  # API
│   └── page.tsx                     # Home redirect
├── lib/
│   └── services/
│       └── bsos-calculator.ts       # Core logic
├── prisma/
│   └── schema.prisma               # Database schema
├── FORMA_README.md                 # Main docs
├── FORMA_QUICKSTART.md             # Quick start
└── package.json
```

---

## 🔗 URLs After Deployment

**Production:**
```
https://forma-bsos-calculator.vercel.app/
https://forma-bsos-calculator.vercel.app/forma
https://forma-bsos-calculator.vercel.app/forma/assessment
```

**Dashboard:**
```
https://vercel.com/your-username/forma-bsos-calculator
```

---

## 📊 Prisma Schema (Forma Tables)

The Forma project uses these Prisma models:

```prisma
model Project {
  id          String   @id @default(cuid())
  userId      String
  brandName   String
  websiteUrl  String?
  assessments Assessment[]
}

model Assessment {
  id                    String   @id @default(cuid())
  projectId             String
  bsosScore             Float
  websiteScore          Float
  socialScore           Float
  adScore               Float
  recommendations       Json?
  status                String
  completedAt           DateTime?
}
```

You'll need a PostgreSQL database for Forma.

---

## 🎯 What This Project Does

**Forma & Attention** is a behavioral science-based conversion optimization platform that:

1. **Calculates BSOS Score (0-100)**
   - Website/Blog component (0-33)
   - Social Media component (0-33)
   - Paid Advertising component (0-34)

2. **Provides Recommendations**
   - Prioritized action items
   - Impact estimates
   - Timeline suggestions

3. **Beautiful Results Dashboard**
   - Score breakdown
   - Component analysis
   - Visual charts

---

## ✅ Verification Checklist

After extraction, verify:

- [ ] Forma landing page works (`/forma`)
- [ ] Assessment form works (`/forma/assessment`)
- [ ] BSOS calculation generates scores
- [ ] Results page displays correctly (`/forma/results/[id]`)
- [ ] All Forma documentation accessible
- [ ] Database migrations work
- [ ] Vercel deployment successful
- [ ] No AI visibility code remains

---

## 🆘 Troubleshooting

**Build fails:**
- Check `POSTGRES_PRISMA_URL` is set
- Run `npx prisma generate`
- Check all imports are valid

**Page 404:**
- Verify file structure matches above
- Check `app/page.tsx` redirects to `/forma`
- Clear Vercel cache and rebuild

**Database errors:**
- Run `npx prisma db push`
- Verify connection string
- Check Prisma schema

---

## 📧 Support

For Forma-specific questions, refer to:
- `FORMA_README.md` - Complete documentation
- `FORMA_QUICKSTART.md` - Quick setup
- `FORMA_COMPLETE.md` - Feature list

---

**Created:** December 2024  
**Version:** 1.0.0  
**License:** MIT
