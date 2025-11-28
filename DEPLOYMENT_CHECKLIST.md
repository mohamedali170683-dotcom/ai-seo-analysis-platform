# Forma & Attention - Deployment Checklist

## ✅ Pre-Deployment Verification

### Files Created/Modified

#### Core Application Files
- ✅ `/app/forma/page.tsx` - Landing page with product positioning
- ✅ `/app/forma/assessment/page.tsx` - 4-step assessment form
- ✅ `/app/forma/results/[id]/page.tsx` - Results dashboard
- ✅ `/app/api/forma/assessment/route.ts` - API endpoint
- ✅ `/app/page.tsx` - Redirect to /forma
- ✅ `/lib/services/bsos-calculator.ts` - BSOS calculation engine

#### Database Files
- ✅ `/prisma/schema.prisma` - Updated with Project and Assessment models
- ✅ `/prisma/migrations/20250128000000_add_forma_models/migration.sql` - Migration file

#### Documentation Files
- ✅ `/FORMA_README.md` - Complete documentation
- ✅ `/FORMA_QUICKSTART.md` - 5-minute deployment guide
- ✅ `/README.md` - Updated with Forma section
- ✅ `/DEPLOYMENT_CHECKLIST.md` - This file

#### Configuration Files
- ✅ `/package.json` - Build script includes Prisma commands
- ✅ `/next.config.mjs` - Next.js configuration
- ✅ `/tailwind.config.ts` - Tailwind CSS setup
- ✅ `/tsconfig.json` - TypeScript configuration

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

#### Step 1: Repository Setup
```bash
# Ensure all changes are committed
git add .
git commit -m "Add Forma & Attention prototype"
git push origin main
```

#### Step 2: Vercel Deployment
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects Next.js
4. Click "Deploy"

#### Step 3: Add Database
1. In Vercel dashboard → "Storage" tab
2. Create new Postgres database
3. Environment variable `POSTGRES_PRISMA_URL` is added automatically
4. Trigger a redeploy

#### Step 4: Verify Deployment
- Visit `https://your-project.vercel.app/forma`
- Test the assessment flow
- Check database connections

### Option 2: Other Platforms

#### Railway
```bash
railway login
railway init
railway add postgresql
railway up
```

#### Render
1. Connect GitHub repository
2. Select "Web Service"
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

#### Netlify
- Not recommended (better suited for static sites)
- Use Vercel or Railway instead

## 🔧 Environment Variables Required

```bash
# Required for all deployments
POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/database"

# Optional (for future enhancements)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.com"
```

## 🧪 Testing Checklist

### Smoke Tests After Deployment

#### 1. Landing Page (`/forma`)
- [ ] Page loads without errors
- [ ] Hero section displays correctly
- [ ] All sections render (Executive Summary, BSOS Framework, etc.)
- [ ] "Start Assessment" button works
- [ ] Navigation is functional

#### 2. Assessment Form (`/forma/assessment`)
- [ ] Step 1: Project info form appears
- [ ] Can enter brand name and proceed
- [ ] Step 2: Website sliders work (11 metrics)
- [ ] Step 3: Social Media sliders work (11 metrics)
- [ ] Step 4: Paid Ads sliders work (11 metrics)
- [ ] Back button navigates correctly
- [ ] Submit button triggers calculation

#### 3. Results Dashboard (`/forma/results/[id]`)
- [ ] Results page loads after submission
- [ ] BSOS score displays correctly
- [ ] Score interpretation shows
- [ ] Three component cards render (Website, Social, Ads)
- [ ] Sub-scores display for each component
- [ ] Recommendations section populates
- [ ] Color coding matches score ranges
- [ ] "New Assessment" button works

#### 4. API Endpoints
- [ ] `POST /api/forma/assessment` returns 200
- [ ] Assessment ID is generated
- [ ] BSOS score is calculated
- [ ] Data is saved to database
- [ ] Response includes all required fields

#### 5. Database
- [ ] Migrations run successfully
- [ ] Tables created: `users`, `projects`, `assessments`
- [ ] Foreign key relationships work
- [ ] Data persists between requests
- [ ] Can query assessments from DB

### Sample Test Data

Use this data for testing:

```json
{
  "brandName": "Test Company",
  "websiteUrl": "https://test.com",
  "industry": "SaaS",
  "website": {
    "socialProof": 2,
    "authority": 2,
    "scarcity": 1,
    "reciprocity": 2,
    "optionPresentation": 2,
    "defaultSelections": 1,
    "ctaDesign": 2,
    "pricingDisplay": 2,
    "navigationFlow": 2,
    "decisionStaging": 1,
    "frictionReduction": 2
  },
  "social": {
    "emotionalTriggers": 2,
    "storytellingQuality": 2,
    "socialProofElements": 1,
    "shareabilityFactors": 2,
    "scarcityUrgency": 1,
    "reciprocityElements": 2,
    "commitmentDevices": 1,
    "consistencyPrinciple": 1,
    "colorPsychology": 2,
    "attentionDirection": 1,
    "visualHierarchy": 2
  },
  "ads": {
    "headlineFraming": 2,
    "visualHierarchy": 2,
    "attentionCapture": 2,
    "descriptionPower": 2,
    "biasApplication": 1,
    "lossAversionFraming": 1,
    "socialProofIntegration": 2,
    "urgencyScarcity": 1,
    "messageConsistency": 2,
    "expectationFulfillment": 3,
    "conversionPathOptimization": 2
  }
}
```

Expected BSOS Score: ~52-57 (Moderate application)

## 🐛 Common Issues & Solutions

### Issue: Build Fails with Prisma Error
**Error**: `Prisma Client is not generated`
**Solution**: 
```bash
# Build script should include:
"build": "prisma generate && prisma migrate deploy && next build"
```

### Issue: Database Connection Fails
**Error**: `Can't reach database server`
**Solution**:
- Verify `POSTGRES_PRISMA_URL` is set in environment variables
- Check database is running and accessible
- Ensure connection string format is correct

### Issue: 404 on /forma Routes
**Error**: Page not found
**Solution**:
- Verify files exist in `/app/forma/` directory
- Check for typos in file names
- Ensure pages are exported as default functions

### Issue: API Returns 500
**Error**: Internal server error
**Solution**:
- Check Vercel logs for detailed error
- Verify Prisma client is generated
- Ensure database schema matches code

### Issue: Blank Page After Submission
**Error**: No redirect after submitting assessment
**Solution**:
- Check browser console for errors
- Verify API returns `assessmentId`
- Check router.push() is called with correct URL

## 📊 Expected Results

### BSOS Score Ranges

**High Performer (75-100)**
- Most sliders at 3
- Green score indicator
- 1-3 recommendations
- "Sophisticated behavioral design" interpretation

**Moderate Performer (50-74)**
- Mix of 1-2 sliders
- Blue score indicator
- 3-5 recommendations
- "Moderate application" interpretation

**Needs Improvement (25-49)**
- Most sliders at 0-1
- Yellow score indicator
- 5-6 recommendations
- "Limited behavioral science" interpretation

**Critical (0-24)**
- All sliders at 0
- Red score indicator
- 6+ recommendations
- "Minimal application" interpretation

## ✨ Post-Deployment

### Immediate Actions
1. Test complete user flow
2. Share demo URL with stakeholders
3. Gather initial feedback
4. Monitor error logs

### Next Steps
1. Add user authentication (NextAuth.js)
2. Enable PDF export of results
3. Add analytics tracking
4. Implement email notifications
5. Create admin dashboard

### Performance Monitoring
- Page load times (<2s target)
- API response times (<500ms target)
- Database query performance
- Error rate (<0.1% target)

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Landing page loads in <2 seconds
- ✅ Assessment can be completed end-to-end
- ✅ Results display with accurate scoring
- ✅ Recommendations are relevant and actionable
- ✅ No console errors in browser
- ✅ Database persists data correctly
- ✅ Mobile responsive design works

## 📞 Support Resources

- **Documentation**: FORMA_README.md
- **Quick Start**: FORMA_QUICKSTART.md
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Last Updated**: November 28, 2025
**Version**: 1.0.0
**Status**: Ready for Production ✅
