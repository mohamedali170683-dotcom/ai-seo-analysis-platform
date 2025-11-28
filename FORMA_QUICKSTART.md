# Forma & Attention - Quick Start Guide

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Fork or Clone This Repository

```bash
git clone https://github.com/YOUR_USERNAME/your-repo.git
cd your-repo
```

### Step 2: Push to Your GitHub

If you haven't already:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/your-new-repo.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Project"
3. Select your GitHub repository
4. Click "Deploy" (Vercel will auto-detect Next.js)

### Step 4: Add Database

1. In your Vercel project dashboard:
   - Click "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Click "Continue"
   - Vercel will automatically connect the database

2. The environment variable `POSTGRES_PRISMA_URL` will be added automatically

### Step 5: Trigger Redeploy

1. Go to "Deployments" tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"
4. Migrations will run automatically during build

### Step 6: Access Your App

Your Forma prototype is live at: `https://your-project.vercel.app/forma`

## ✅ What You Get

- ✨ Professional landing page with product positioning
- 📋 Interactive 4-step assessment form (33 metrics)
- 📊 Beautiful results dashboard with BSOS scoring
- 💡 Personalized optimization recommendations
- 🗄️ PostgreSQL database with Prisma ORM
- 🔄 Automatic migrations on deploy

## 🎯 Test the Platform

1. Visit `/forma` - View landing page
2. Click "Calculate Your BSOS Score"
3. Complete the assessment:
   - Enter brand name: "Test Company"
   - Rate each metric using sliders (0-3)
   - Click through all 4 steps
4. View your BSOS scorecard and recommendations

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your database URL
# POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/forma"

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000/forma](http://localhost:3000/forma)

## 📁 Key Files

```
/workspace
├── app/forma/                    # Main Forma pages
│   ├── page.tsx                 # Landing page
│   ├── assessment/page.tsx      # Assessment form
│   └── results/[id]/page.tsx    # Results dashboard
├── app/api/forma/               # API routes
│   └── assessment/route.ts      # Assessment endpoint
├── lib/services/
│   └── bsos-calculator.ts       # Scoring engine
└── prisma/
    └── schema.prisma            # Database schema
```

## 🎨 Customization

### Brand Colors

Edit Tailwind classes throughout the app:
- Primary: `bg-purple-600`, `text-purple-400`
- Accent: `bg-pink-600`
- Background: `from-slate-900 via-purple-900 to-slate-900`

### Scoring Logic

Edit `/lib/services/bsos-calculator.ts`:
- Adjust max values for each metric
- Modify recommendation triggers
- Customize impact estimates

### Assessment Questions

Edit `/app/forma/assessment/page.tsx`:
- Add/remove metrics
- Change slider ranges
- Update descriptions

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error**: `Environment variable not found: POSTGRES_PRISMA_URL`
- Solution: Make sure you've added a database in Vercel Storage

**Error**: `Migration failed`
- Solution: Redeploy after adding the database

### Assessment Submission Fails

**Error**: `Failed to create assessment`
- Check browser console for errors
- Verify database connection in Vercel logs
- Ensure migrations ran successfully

### Prisma Client Issues

```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 📈 Next Steps

After deployment, consider:

1. **Add Authentication**
   - Install NextAuth.js
   - Create user login/signup
   - Protect assessment routes

2. **Enable PDF Export**
   - Install react-pdf or similar
   - Add download button on results page

3. **Analytics Integration**
   - Add Google Analytics
   - Track conversion funnel
   - Monitor BSOS score distribution

4. **Custom Domain**
   - Add your domain in Vercel settings
   - Update NEXTAUTH_URL if using auth

5. **Email Notifications**
   - Integrate SendGrid or similar
   - Email results to users
   - Send follow-up recommendations

## 🤝 Support

- **Documentation**: See [FORMA_README.md](./FORMA_README.md)
- **Issues**: Create GitHub issue with error logs
- **Questions**: Check Vercel deployment logs first

## 🎉 You're Done!

Your Forma & Attention platform is now live. Share the URL and start collecting BSOS assessments!

**Example URL**: https://forma-attention.vercel.app/forma
