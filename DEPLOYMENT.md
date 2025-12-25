# Vercel Deployment Guide

Complete guide to deploy the AI SEO Analysis Platform to Vercel with all latest features.

## 🚀 Quick Start

### Prerequisites

- A Vercel account ([sign up free](https://vercel.com))
- A PostgreSQL database (Vercel Postgres, Supabase, or Render)
- At minimum, an OpenAI API key

### 1. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**
5. **Important**: Set Production Branch to `main`

### 2. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

#### Required Variables

```env
# Database (REQUIRED)
POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/database?schema=public"

# OpenAI API (REQUIRED - for ChatGPT and fallback simulation)
OPENAI_API_KEY="sk-..."

# NextAuth (REQUIRED for authentication)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"

# Environment
NODE_ENV="production"
```

#### Optional Platform API Keys

```env
# Google Gemini API (for real Gemini testing)
GEMINI_API_KEY="..."

# Perplexity API (for real Perplexity testing with web search)
PERPLEXITY_API_KEY="pplx-..."

# Anthropic Claude API (for Claude AI platform support)
ANTHROPIC_API_KEY="sk-ant-..."

# SerpAPI (for Google AI Overviews support)
SERPAPI_KEY="..."
```

#### Optional Services

```env
# Redis (for job queue and background processing)
REDIS_URL="redis://default:password@host:6379"

# Search Volume Data APIs
DATAFORSEO_LOGIN="your-email@example.com"
DATAFORSEO_PASSWORD="your-api-password"
# OR
AHREFS_API_KEY="..."

# Google OAuth (for Google Search Console integration)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="https://your-app.vercel.app/api/auth/google/callback"
```

### 3. Deploy

Click **"Deploy"** - Vercel will automatically:
- Install dependencies
- Generate Prisma client
- Push database schema
- Build Next.js application
- Deploy to production

## 🗄️ Database Setup

### Option 1: Vercel Postgres (Recommended)

1. In Vercel Dashboard → Your Project → Storage
2. Click **"Create Database"** → **"Postgres"**
3. Vercel automatically sets `POSTGRES_PRISMA_URL`
4. No additional configuration needed

### Option 2: Supabase (Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → Database → Connection String
4. Copy **"Transaction"** connection string
5. Add `?schema=public` to the end
6. Add to Vercel as `POSTGRES_PRISMA_URL`

### Option 3: Render PostgreSQL

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - Name: `seo-analysis-db`
   - Database: `seo_analysis`
   - Region: Choose closest to your users
4. Copy **"External Database URL"**
5. Add to Vercel as `POSTGRES_PRISMA_URL`

## 🔑 Getting API Keys

### OpenAI API (Required)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Click **"API Keys"** → **"Create new secret key"**
3. Copy key (starts with `sk-`)
4. Add billing information
5. Cost: ~$0.15 per 1M input tokens with gpt-4o-mini

### Google Gemini API (Recommended)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy key
4. Free tier available, then pay-as-you-go

### Perplexity API (Recommended)

1. Go to [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Generate API key
3. Cost: ~$0.20 per 1M tokens (includes real-time web search)

### Anthropic Claude API

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and add billing
3. Generate API key (starts with `sk-ant-`)
4. Cost: $3/$15 per 1M tokens (input/output)

### SerpAPI (for Google AI Overviews)

1. Go to [serpapi.com](https://serpapi.com)
2. Sign up for account
3. Get API key from dashboard
4. 100 free searches/month, then pay-as-you-go

## ⚙️ Build Configuration

The platform is configured with optimal build settings:

**Build Process** (configured in `package.json`):
```bash
prisma generate && prisma db push --skip-generate --accept-data-loss && next build
```

**API Function Timeout** (configured in `vercel.json`):
- 300 seconds (5 minutes) for all API routes
- Handles multi-platform analysis, batch processing, and content optimization

**Framework**:
- Next.js 16.0.8 with App Router
- React 19.2.0
- TypeScript 5.9.3
- Prisma ORM for database

## 🌍 Production Branch Configuration

**Important**: Ensure Vercel deploys from the correct branch.

1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Under **"Production Branch"**, set to `main`
3. Save changes
4. Any push to `main` will trigger production deployment

## 📊 Features Deployed

Your deployment includes all latest features:

### Core Features
- ✅ Multi-platform AI analysis (ChatGPT, Gemini, Copilot, Perplexity, Claude, Google AI Overviews)
- ✅ Competitive analysis and brand visibility tracking
- ✅ Conversation flow and stickiness metrics
- ✅ Overall visibility scoring

### Advanced Features (Latest)
- ✅ **Automation & Alerting System**
  - Scheduled scans
  - Custom alert rules
  - Multi-channel notifications (Email, Slack, Webhook)
  - Automated reporting

- ✅ **Hallucination Detection & Brand Safety**
  - AI response verification
  - Ground truth management
  - Brand safety monitoring

- ✅ **API & Integration Layer**
  - REST API with authentication
  - Rate limiting
  - Webhook management
  - Export service (CSV, JSON, PDF)

- ✅ **Content Optimization Engine**
  - Content gap analysis
  - AI-powered recommendations
  - Schema markup generation
  - Optimization reports

- ✅ **Multi-Platform Orchestration**
  - Parallel platform queries
  - Result comparison
  - Platform coverage reports

## 🔄 Continuous Deployment

### Automatic Deployments

- **Production**: Push to `main` branch → Deploys to production
- **Preview**: Push to any feature branch → Creates preview URL
- **Development**: Run `npm run dev` locally

### Manual Redeploy

1. Go to Vercel Dashboard → Your Project → Deployments
2. Find the deployment you want to redeploy
3. Click **"..."** → **"Redeploy"**
4. Select **"Use existing Build Cache"** for faster builds
5. Click **"Redeploy"**

## 🐛 Troubleshooting

### Changes Not Appearing on Live Site

1. **Check Production Branch**:
   - Settings → Git → Production Branch should be `main`

2. **Verify Latest Deployment**:
   - Go to Deployments tab
   - Check that latest `main` branch commit is deployed
   - Look for green checkmark (success) or red X (failed)

3. **Clear Cache**:
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Try incognito/private browsing mode

4. **Check Deployment Logs**:
   - Click on deployment → View build logs
   - Look for errors or warnings

### Build Failures

**TypeScript Errors**:
```bash
# Run locally to catch errors before pushing
npm run build
```

**Database Connection Errors**:
- Verify `POSTGRES_PRISMA_URL` is set correctly
- Check database is accessible from Vercel's region (iad1)
- Ensure connection string includes `?schema=public`

**Missing Environment Variables**:
- Check all required variables are set
- Ensure variable names match exactly (case-sensitive)
- Variables must be set for "Production" environment

**Prisma Errors**:
```bash
# If Prisma generation fails, check:
# 1. DATABASE_URL or POSTGRES_PRISMA_URL is set
# 2. Connection string is valid
# 3. Database is accessible
```

### Runtime Errors

**API Routes Timing Out**:
- Check function logs in Vercel dashboard
- Verify API keys are correct
- Check if external APIs (OpenAI, etc.) are responding

**Database Queries Failing**:
- Check database connection is active
- Verify Prisma client is generated
- Review query syntax

**Authentication Issues**:
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your deployment URL
- Review OAuth redirect URIs

## 🔐 Security Best Practices

- ✅ Never commit `.env` files to git
- ✅ Use Vercel's environment variable encryption
- ✅ Rotate API keys regularly
- ✅ Enable 2FA on Vercel account
- ✅ Set up monitoring and alerts
- ✅ Use `.vercelignore` to exclude sensitive files
- ✅ Review function logs regularly
- ✅ Implement rate limiting for public APIs

## 📈 Post-Deployment Checklist

- [ ] Visit production URL: `https://your-app.vercel.app`
- [ ] Test health endpoint: `https://your-app.vercel.app/api/health`
- [ ] Verify database connection (run a test analysis)
- [ ] Check all environment variables are loaded
- [ ] Test authentication flows
- [ ] Verify API routes work correctly
- [ ] Monitor initial deployment logs
- [ ] Set up custom domain (optional)
- [ ] Configure monitoring/analytics
- [ ] Share your deployed app

## 🌐 Custom Domain Setup

1. **Add Domain in Vercel**:
   - Settings → Domains → Add domain
   - Enter your domain (e.g., `seo-analysis.com`)

2. **Configure DNS**:
   - Add DNS records as instructed by Vercel
   - Wait for DNS propagation (up to 48 hours)

3. **Update Environment Variables**:
   ```env
   NEXTAUTH_URL="https://yourdomain.com"
   GOOGLE_REDIRECT_URI="https://yourdomain.com/api/auth/google/callback"
   ```

4. **Redeploy**:
   - Trigger redeploy for changes to take effect

## 📊 Monitoring Your Deployment

### Vercel Analytics
- Dashboard → Your Project → Analytics
- View real-time traffic, performance, and errors

### Function Logs
- Dashboard → Your Project → Logs
- Monitor API route executions
- Debug runtime errors

### Database Monitoring
- Use your database provider's dashboard
- Monitor connections, queries, and performance

## 🆘 Getting Help

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)
- **GitHub Issues**: Open an issue in the repository

## 📝 Environment Variables Reference

See [.env.example](.env.example) for complete list with descriptions.

## ⚡ Performance Tips

1. **Enable Edge Runtime** for faster response times
2. **Use Redis** for caching and job queue
3. **Optimize database queries** with proper indexes
4. **Enable Vercel Analytics** for performance insights
5. **Use ISR** (Incremental Static Regeneration) where applicable

## 🎉 Success!

Your AI SEO Analysis Platform is now live on Vercel!

Visit your deployment URL and start analyzing your brand's presence across AI platforms.

---

**Built with**: Next.js, TypeScript, Prisma, Vercel
**License**: MIT
