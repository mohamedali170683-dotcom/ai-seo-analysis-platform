# Ahrefs API Setup Guide

## Why Ahrefs?

Ahrefs API provides **real keyword and question data** for your analysis, including:
- Real search questions people ask
- Actual search volumes
- Keyword difficulty scores
- Much faster than alternatives (< 3 seconds vs 10-15 seconds)

**Without Ahrefs, the analysis cannot run.** (The demo page has mock data, but real analyses need real data).

## Get Your Ahrefs API Key

### Step 1: Sign Up for Ahrefs API
1. Go to https://ahrefs.com/api
2. Choose a plan (starts at $82/month)
   - Includes 25,000 API credits per month
   - Each analysis uses ~10-20 credits
   - Can run ~1,000-2,000 analyses per month

### Step 2: Get Your API Token
1. Log in to your Ahrefs account
2. Go to Settings → API
3. Click "Generate new token"
4. Copy your API token (looks like: `AhrefsToken_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## Add to Vercel

### Step 1: Open Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project: `ai-seo-analysis-platform`
3. Click "Settings" tab
4. Click "Environment Variables" in sidebar

### Step 2: Add AHREFS_API_KEY
1. Click "Add New"
2. **Key:** `AHREFS_API_KEY`
3. **Value:** Paste your Ahrefs API token
4. **Environment:** Select all (Production, Preview, Development)
5. Click "Save"

### Step 3: Redeploy
1. Go to "Deployments" tab
2. Click the three dots (...) on the latest deployment
3. Click "Redeploy"
4. Wait 2-3 minutes for deployment to complete

## Verify It's Working

### Test the Analysis
1. Visit your app: https://ai-seo-analysis-platform.vercel.app/
2. Enter a brand name (e.g., "Nike")
3. Click "Check AI Visibility"
4. Watch the progress bar:
   - Should move past 10% quickly (< 5 seconds)
   - Should complete in 30-60 seconds total

### Check Logs (If Issues)
1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" tab
3. Click on the latest deployment
4. Click "Functions" tab
5. Find `POST /api/analysis/start`
6. Check logs for any Ahrefs errors

## Expected Behavior

### With Ahrefs API Key ✅
```
10% → "Using Ahrefs API for: Nike"
10% → "Ahrefs returned 36 raw questions in 2.5s"
20% → "Discovered 12 questions"
30% → Continue with AI testing...
```

### Without Ahrefs API Key ❌
```
Error: "AHREFS_API_KEY is not configured. Please add it to your environment variables in Vercel."
```

## API Limits & Costs

### Ahrefs API Pricing
- **Lite Plan:** $82/month - 25,000 credits
- **Standard Plan:** $333/month - 100,000 credits
- **Advanced Plan:** $666/month - 200,000 credits

### Credits Per Analysis
Each analysis uses approximately:
- Question discovery: 10-15 credits
- Total per analysis: ~10-15 credits

### Analyses Per Month
- **Lite Plan:** ~1,600-2,500 analyses/month
- **Standard Plan:** ~6,600-10,000 analyses/month
- **Advanced Plan:** ~13,000-20,000 analyses/month

## Alternative: Use DataForSEO (Not Recommended)

If you can't use Ahrefs, you could revert to DataForSEO, but it's:
- Much slower (8-15 seconds vs < 3 seconds)
- Less reliable (frequent timeouts)
- More expensive per query

To revert to DataForSEO:
1. Contact me to implement the switch
2. Not recommended due to performance issues

## Troubleshooting

### "Analysis stuck at 10%"
**Cause:** Ahrefs API key not set or invalid

**Solution:**
1. Check Vercel environment variables
2. Verify `AHREFS_API_KEY` is set
3. Verify the key is valid (test at https://ahrefs.com/api)
4. Redeploy after adding/updating

### "Ahrefs returned 0 questions"
**Cause:** Keyword too specific or niche

**Solution:**
- Try a more general keyword
- Check if the keyword exists in Ahrefs
- Verify your Ahrefs subscription includes Keywords Explorer

### "Ahrefs API timeout"
**Cause:** Ahrefs API is slow or down

**Solution:**
- Check Ahrefs API status
- Try again in a few minutes
- Increase timeout (currently 10 seconds)

### "Invalid API token"
**Cause:** API key is wrong or expired

**Solution:**
1. Go to Ahrefs → Settings → API
2. Regenerate a new token
3. Update in Vercel environment variables
4. Redeploy

## Support

If you continue having issues:
1. Check Vercel logs for detailed error messages
2. Verify Ahrefs API key is correctly copied (no spaces)
3. Ensure you have an active Ahrefs subscription
4. Test your API key directly: https://ahrefs.com/api/documentation

## Summary

✅ **Required:** AHREFS_API_KEY in Vercel environment variables  
✅ **Get Key:** https://ahrefs.com/api  
✅ **Cost:** Starting at $82/month  
✅ **Performance:** < 3 seconds for question discovery  
✅ **Reliability:** Much more reliable than alternatives  

**Your analysis tool NEEDS Ahrefs to work properly!** 🚀
