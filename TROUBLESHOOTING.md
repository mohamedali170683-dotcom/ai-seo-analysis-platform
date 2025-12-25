# Troubleshooting: Analysis Initialization Stuck

This guide helps diagnose and fix issues when the analysis gets stuck at the initialization step.

## 🔍 Quick Diagnosis

### Step 1: Check Health Endpoint

Visit your health check endpoint:
```
https://your-app.vercel.app/api/health
```

This returns a JSON response showing:
```json
{
  "status": "✅ healthy" or "❌ unhealthy",
  "environment": {
    "OPENAI_API_KEY": "✅ SET" or "❌ NOT SET",
    "POSTGRES_PRISMA_URL": "✅ SET" or "❌ NOT SET",
    ...
  },
  "database": {
    "status": "✅ connected" or "❌ failed",
    "error": "error message if failed"
  },
  "missingRequired": ["list of missing variables"],
  "recommendations": ["list of actions to take"]
}
```

### Step 2: Check Vercel Function Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **"Logs"** tab
4. Filter by **"Functions"**
5. Look for `/api/analysis/run` requests
6. Check for error messages

## 🐛 Common Issues & Solutions

### Issue 1: Database Connection Not Set

**Symptoms:**
- Health check shows `POSTGRES_PRISMA_URL: "❌ NOT SET"`
- Logs show: "Database error (user): Check POSTGRES_PRISMA_URL"
- Analysis stuck at "Initializing..."

**Solution:**

1. **Get a PostgreSQL Database** (choose one):

   **Option A: Vercel Postgres** (Easiest)
   ```
   1. Vercel Dashboard → Your Project → Storage
   2. Click "Create Database" → "Postgres"
   3. Vercel automatically sets POSTGRES_PRISMA_URL
   4. Click "Redeploy" in Deployments tab
   ```

   **Option B: Supabase** (Free tier available)
   ```
   1. Go to supabase.com
   2. Create project
   3. Settings → Database → Connection String (Transaction)
   4. Copy the connection string
   5. Add ?schema=public to the end
   6. Add to Vercel Environment Variables as POSTGRES_PRISMA_URL
   7. Redeploy
   ```

   **Option C: Render** (Free tier available)
   ```
   1. Go to dashboard.render.com
   2. New+ → PostgreSQL
   3. Copy "External Database URL"
   4. Add ?schema=public to the end
   5. Add to Vercel Environment Variables as POSTGRES_PRISMA_URL
   6. Redeploy
   ```

2. **Add to Vercel**:
   ```
   Vercel Dashboard → Your Project → Settings → Environment Variables

   Key: POSTGRES_PRISMA_URL
   Value: postgresql://user:password@host:5432/database?schema=public

   Environments: Production, Preview, Development (select all)

   Click "Save"
   ```

3. **CRITICAL**: After adding environment variables, you MUST redeploy:
   ```
   Deployments tab → Click latest deployment → ... → Redeploy
   ```

### Issue 2: OpenAI API Key Not Set

**Symptoms:**
- Health check shows `OPENAI_API_KEY: "❌ NOT SET"`
- Analysis returns error: "OPENAI_API_KEY not configured"

**Solution:**

1. Get OpenAI API Key:
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)

2. Add to Vercel:
   ```
   Settings → Environment Variables → Add

   Key: OPENAI_API_KEY
   Value: sk-your-key-here

   Environments: Production, Preview, Development

   Save → Redeploy
   ```

### Issue 3: Database Schema Not Synchronized

**Symptoms:**
- Health check shows database connected but `hasNewColumns: false`
- Build logs show: "The database is already in sync with the Prisma schema"
- But analysis fails with column errors

**Solution:**

The build command should automatically run `prisma db push`. If it's not working:

1. **Check Build Command** in Vercel:
   ```
   Settings → General → Build & Development Settings

   Build Command should be: npm run build

   If it's different, change it and redeploy
   ```

2. **Verify in Build Logs**:
   ```
   Deployments → Click deployment → View Function Logs

   Look for:
   "Prisma schema loaded from prisma/schema.prisma"
   "The database is already in sync with the Prisma schema"
   ```

### Issue 4: Database Connection Timeout

**Symptoms:**
- Initialization takes 30+ seconds then times out
- Logs show: "Operation timed out"
- Database is set but connection fails

**Solutions:**

1. **Check Database Region**:
   - Vercel deploys to iad1 (US East - Virginia)
   - Your database should be in the same or nearby region
   - If database is in Europe or Asia, connection may be slow

2. **Check SSL Configuration**:
   ```
   Connection string should include SSL if required:
   postgresql://user:password@host:5432/db?schema=public&sslmode=require
   ```

3. **Check Database Firewall**:
   - Ensure database accepts connections from anywhere (0.0.0.0/0)
   - Or whitelist Vercel's IPs (check Vercel docs for IP ranges)

4. **Check Connection Pool**:
   - Some databases limit concurrent connections
   - Ensure your plan allows at least 5-10 connections

### Issue 5: Vercel Function Timeout

**Symptoms:**
- Analysis starts but stops after exactly 10, 30, or 60 seconds
- Logs show: "Function execution timed out"

**Solution:**

The API routes are already configured for 300-second timeout:
```typescript
export const maxDuration = 300; // in route.ts files
```

But verify in `vercel.json`:
```json
{
  "functions": {
    "app/api/**/*": {
      "maxDuration": 300
    }
  }
}
```

If you're on Vercel Free plan:
- Hobby plan: 10-second max
- Pro plan: 300-second max (5 minutes)
- **Solution**: Upgrade to Pro plan for longer analysis times

### Issue 6: Missing Environment Variables After Deployment

**Symptoms:**
- Environment variables show as set in Vercel dashboard
- But health check shows them as NOT SET
- Build succeeded but runtime fails

**Solution:**

Environment variables are cached during build. After changing them:

1. **Don't** just "Redeploy" with existing build cache
2. **Do** use "Redeploy" and **uncheck** "Use existing Build Cache"
3. This forces a full rebuild with new environment variables

Steps:
```
Deployments → Latest deployment → ... → Redeploy
Uncheck "Use existing Build Cache"
Click "Redeploy"
```

## 🧪 Testing Steps

After making changes:

### 1. Test Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "✅ healthy",
  "database": {
    "status": "✅ connected"
  }
}
```

### 2. Test Analysis Endpoint
```bash
curl -X POST https://your-app.vercel.app/api/analysis/run \
  -H "Content-Type: application/json" \
  -d '{"brandOrKeyword": "Test Brand"}'
```

Should return:
```json
{
  "success": true,
  "analysisId": "some-id",
  "message": "Analysis started"
}
```

### 3. Monitor Progress
```bash
curl https://your-app.vercel.app/api/analysis/[analysisId]
```

Should show increasing progress:
```json
{
  "success": true,
  "analysis": {
    "status": "running",
    "progress": 45,
    "currentStep": "Testing AI platforms..."
  }
}
```

## 📊 Understanding the Initialization Flow

The analysis initialization goes through these steps:

1. **Parse Request** (instant)
   - Validates brand name
   - Parses competitors

2. **Check Environment** (instant)
   - Verifies OPENAI_API_KEY is set

3. **Database: Create User** (0.5-2 seconds)
   - ⚠️ **COMMON FAILURE POINT**
   - Connects to PostgreSQL
   - Creates or finds user record

4. **Database: Create Analysis** (0.5-2 seconds)
   - ⚠️ **COMMON FAILURE POINT**
   - Creates analysis record with status "running"

5. **Start Background Job** (instant)
   - Returns immediately
   - Analysis continues in background

If it's stuck at "Initializing...", it's failing at step 3 or 4 (database operations).

## 🔧 Advanced Debugging

### Enable Detailed Logging

Check Vercel Function Logs for these messages:

```
✅ Success indicators:
"🚀 [API] POST /api/analysis/run called"
"✅ [API] OPENAI_API_KEY is set"
"✅ [API] User ready: user-id"
"✅ [API] Created analysis analysis-id"
"🔄 [API] Starting background execution"

❌ Failure indicators:
"❌ [API] OPENAI_API_KEY not configured"
"❌ [API] Failed to create/find user: error"
"❌ [API] Failed to create analysis: error"
```

### Check Database Connection Manually

If you have the Prisma CLI installed:

```bash
# Set environment variable locally
export POSTGRES_PRISMA_URL="your-connection-string"

# Test connection
npx prisma db push

# If successful, database is accessible
# If fails, shows specific error
```

### Check Prisma Client Generation

In Vercel build logs, look for:

```
✔ Generated Prisma Client (v6.19.0) to ./node_modules/@prisma/client in 278ms
```

If missing, Prisma client wasn't generated and database calls will fail.

## 🆘 Still Stuck?

1. **Check Vercel Status**: https://www.vercel-status.com/
   - Vercel services might be down

2. **Check Database Status**:
   - Go to your database provider's status page
   - Check if database is running

3. **Try Synchronous Endpoint**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/analysis/run-sync \
     -H "Content-Type: application/json" \
     -d '{"brandOrKeyword": "Test"}'
   ```
   - This runs synchronously and shows full error stack

4. **Check Build Logs**:
   - Deployments → Click deployment → "Building" section
   - Look for Prisma or TypeScript errors

5. **Contact Support**:
   - Share health check output
   - Share relevant Vercel function logs
   - Share database provider (Vercel Postgres, Supabase, etc.)

## ✅ Checklist

Before deploying, ensure:

- [ ] `POSTGRES_PRISMA_URL` is set in Vercel Environment Variables
- [ ] `OPENAI_API_KEY` is set in Vercel Environment Variables
- [ ] Database is accessible from Vercel's region (iad1)
- [ ] Environment variables are set for "Production" environment
- [ ] Redeployed after adding/changing environment variables
- [ ] Health check returns `"status": "✅ healthy"`
- [ ] Build logs show "Generated Prisma Client"
- [ ] Build logs show "database is in sync with Prisma schema"

## 📚 Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide

---

**Last Updated**: 2025-12-25
