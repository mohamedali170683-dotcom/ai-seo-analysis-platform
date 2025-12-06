# Ahrefs API Testing & Debugging Guide

This guide helps you verify and troubleshoot your Ahrefs API integration.

## Quick Test

Run this command to test your Ahrefs API connection:

```bash
npm run test:ahrefs
```

## What the Test Does

1. ✅ Verifies `AHREFS_API_KEY` environment variable is set
2. 📡 Makes a real API call to Ahrefs
3. 📊 Shows you the questions returned
4. ⚠️ Identifies common errors with helpful messages

## Expected Output (Success)

```
🧪 Testing Ahrefs API Connection

✅ API Key found: ahxxxx...

📡 Testing Ahrefs API with keyword: "Nike"

Request details:
  Endpoint: https://api.ahrefs.com/v3/keywords-explorer/keyword-ideas
  Params: { target: 'Nike', country: 'us', mode: 'questions', limit: 10 }

✅ API Response received in 1234ms

Response status: 200
Response keys: [ 'keywords', 'meta' ]

📊 Found 10 questions

Sample questions:
  1. "What is Nike known for" (volume: 1200)
  2. "How does Nike manufacture shoes" (volume: 800)
  3. "Why is Nike so popular" (volume: 650)
  4. "What is Nike mission statement" (volume: 500)
  5. "Where to buy Nike shoes" (volume: 450)

✅ Ahrefs API is working correctly!

Your analysis should now work properly.
```

## Common Errors & Solutions

### Error 1: API Key Not Set

```
❌ AHREFS_API_KEY environment variable is not set!
```

**Solution:**
1. In Vercel: Go to Project Settings → Environment Variables → Add `AHREFS_API_KEY`
2. Locally: Create `.env.local` and add `AHREFS_API_KEY=your-key-here`

### Error 2: Authentication Failed (401)

```
🔑 Authentication Error - Your API key is invalid or expired
```

**Solution:**
1. Check your API key in Ahrefs account settings
2. Make sure you copied the entire key
3. Generate a new API key if needed

### Error 3: Forbidden (403)

```
🚫 Forbidden - Your account may not have access to this API endpoint
```

**Solution:**
1. Verify your Ahrefs subscription includes API access
2. Check if your plan supports the Keywords Explorer API
3. Contact Ahrefs support to enable API access

### Error 4: Rate Limit (429)

```
⏱️  Rate Limit - Too many requests
```

**Solution:**
1. Wait a few minutes before trying again
2. Check your Ahrefs API rate limits
3. The fallback mechanism will handle this automatically in production

### Error 5: Timeout

```
⏱️  Request Timeout - The API took too long to respond
```

**Solution:**
1. This is usually temporary - try again
2. Check your internet connection
3. The fallback mechanism handles timeouts automatically

### Error 6: No Questions Found

```
⚠️  No questions found for this keyword
```

**Solution:**
- Try different keywords (e.g., "CRM software", "running shoes")
- Some brands have limited question data in Ahrefs
- The fallback mechanism will use smart templates

## Testing Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Create `.env.local`:
```env
AHREFS_API_KEY=your-actual-ahrefs-api-key
OPENAI_API_KEY=your-openai-key
POSTGRES_PRISMA_URL=your-database-url
```

### 3. Run the test
```bash
npm run test:ahrefs
```

## Testing in Vercel

### 1. Set environment variables
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add `AHREFS_API_KEY`
5. Redeploy

### 2. Check deployment logs
After running an analysis, check:
1. Vercel Dashboard → Deployments → Latest
2. Functions → Logs
3. Look for:
   ```
   ✅ [QUESTIONS] Discovered 9 real questions from Ahrefs
   ```
   OR
   ```
   ❌ [QUESTIONS] Ahrefs API failed: [error message]
   ❌ [QUESTIONS] Using fallback smart questions instead
   ```

## How Fallback Works

If Ahrefs fails for ANY reason:

1. ❌ Ahrefs API call fails
2. 📝 System logs the error
3. ✅ Switches to smart template questions
4. ✅ Analysis completes successfully
5. ✅ Full report generated

**You'll never see a stuck analysis due to Ahrefs issues.**

## Production Recommendations

### Best Practices

1. **Always set AHREFS_API_KEY**
   - Even if it fails, fallback ensures analysis works
   - Real Ahrefs data is better when available

2. **Monitor logs**
   - Check if Ahrefs is working: `✅ Discovered X questions`
   - Check if fallback is used: `❌ Using fallback questions`

3. **Test different keywords**
   - Some keywords have more question data than others
   - Generic terms work better than specific brand names

### Ahrefs API Limits

- **Free tier**: Limited API calls per month
- **Paid tier**: Higher limits, check your plan
- **Rate limits**: Typically 500-1000 requests/day depending on plan

### Optimizing Costs

The current implementation:
- Makes **1 API call per analysis** (question discovery)
- Requests **9-12 questions** maximum
- Uses **10 second timeout** to prevent hanging

## Troubleshooting Checklist

- [ ] Is `AHREFS_API_KEY` set in Vercel environment variables?
- [ ] Did you redeploy after setting the environment variable?
- [ ] Is your Ahrefs subscription active?
- [ ] Does your plan include API access?
- [ ] Have you checked the Vercel function logs?
- [ ] Have you run `npm run test:ahrefs` locally?

## Next Steps

1. ✅ Run `npm run test:ahrefs` to verify setup
2. ✅ Set `AHREFS_API_KEY` in Vercel
3. ✅ Redeploy your application
4. ✅ Run a test analysis
5. ✅ Check Vercel logs to confirm Ahrefs is working

## Support

- **Ahrefs API Docs**: https://ahrefs.com/api/documentation
- **Project Issues**: https://github.com/mohamedali170683-dotcom/ai-seo-analysis-platform/issues

---

**Remember**: Even if Ahrefs fails, your analysis will complete successfully using the fallback mechanism!
