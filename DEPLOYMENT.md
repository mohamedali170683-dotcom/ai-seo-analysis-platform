# Deployment Guide

Complete guide to deploy your AI SEO Analysis Platform to production.

## 🚀 Quick Deploy to Vercel (Recommended)

### Step 1: Connect GitHub to Vercel

1. Go to: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select: `mohamedali170683-dotcom/ai-seo-analysis-platform`
4. Click **"Import"**

### Step 2: Configure Environment Variables

Add these in Vercel dashboard:

```env
DATABASE_URL=your-postgresql-connection-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
AHREFS_API_KEY=your-ahrefs-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
Step 3: Deploy
Click "Deploy" - Vercel will:

Install dependencies
Build your app
Deploy to production
Give you a live URL
Done! Your app is live! 🎉

🗄️ Set Up Database (Render PostgreSQL)
Step 1: Create Database
Go to: https://dashboard.render.com/
Click "New +" → "PostgreSQL"
Choose:
Name: seo-analysis-db
Database: seo_analysis
User: seo_user
Region: Choose closest to you
Plan: Free (for testing) or Starter
Click "Create Database"
Step 2: Get Connection String
In Render dashboard, find your database
Copy the "External Database URL"
It looks like:
postgresql://user:password@dpg-xxx.render.com/database_name
Step 3: Add to Vercel
Go to Vercel dashboard
Your project → Settings → Environment Variables
Add:
Key: DATABASE_URL
Value: Your Render PostgreSQL URL
Click "Save"
Step 4: Run Migrations
In Vercel dashboard:

Go to Deployments
Click on latest deployment
Click "..." → "Redeploy"
Check "Use existing Build Cache" → "Redeploy"
Or run locally then push:

npx prisma migrate deploy
🔑 Get API Keys
Google Search Console
https://console.cloud.google.com/
Create project
Enable "Google Search Console API"
Create OAuth 2.0 credentials
Add redirect URI: https://your-app.vercel.app/api/auth/google/callback
Ahrefs
https://ahrefs.com/api
Sign up for API access
Generate API token
OpenAI
https://platform.openai.com/
Create API key
Add billing info
Google Gemini
https://makersuite.google.com/app/apikey
Create API key
🔄 Update Deployment
Every time you push to GitHub main branch:

Vercel automatically rebuilds
Changes go live in ~2 minutes
Manual redeploy:

Vercel dashboard → Your project
Click "Redeploy"
🌍 Custom Domain (Optional)
Add Domain to Vercel
Vercel dashboard → Your project → Settings → Domains
Enter your domain (e.g., seo-analysis.com)
Click "Add"
Follow DNS configuration instructions
Update Environment Variables
After adding domain, update:

NEXTAUTH_URL=https://yourdomain.com
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
📊 Monitor Your App
Vercel Analytics
Vercel dashboard → Your project → Analytics
See traffic, performance, errors
Database Monitoring
Render dashboard → Your database
See connections, queries, usage
🐛 Troubleshooting
Build Fails
Error: Prisma generate failed

Ensure DATABASE_URL is set in environment variables
Redeploy with npx prisma generate in build command
Error: Module not found

Check all imports use correct paths
Verify tsconfig.json paths are correct
Runtime Errors
Database connection failed

Verify DATABASE_URL is correct
Check database is running (Render dashboard)
API errors

Verify all API keys are set
Check API quotas/limits
Slow Performance
Enable Vercel Edge Functions
Add Redis caching (optional)
Optimize database queries
🔐 Security Checklist
[ ] All API keys in environment variables (not in code)
[ ] NEXTAUTH_SECRET is random and secure
[ ] Database uses SSL in production
[ ] CORS configured properly
[ ] Rate limiting enabled (optional)
📈 Post-Deployment
Test all features:

Homepage loads
Dashboard works
API routes respond
Set up monitoring:

Vercel Analytics
Error tracking (Sentry - optional)
Share your app:

Add to portfolio
Share on LinkedIn/Twitter
Get feedback
🚀 Alternative Deployments
Railway
https://railway.app/
"New Project" → "Deploy from GitHub"
Select your repo
Add environment variables
Deploy
AWS (Advanced)
Use AWS Amplify or ECS
Configure RDS for PostgreSQL
Set up CloudFront CDN
Docker
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
Need help? Open an issue on GitHub! 🙋‍♂️
