# 🚀 Quick Start - AI Visibility Analysis Platform

## ⚡ Get Started in 30 Seconds

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Create Your First Analysis
Visit **http://localhost:3000/analysis/new**

Fill in:
- **Brand**: `Nike` (or any brand you want)
- **Domain**: `nike.com` (optional)
- **Competitors**: `Adidas, Puma` (optional)

Click **"Start Analysis"**

### 3. Watch the Magic ✨
- Progress bar fills up (0% → 100%)
- Takes 15-25 seconds
- Live status updates

### 4. View Your Beautiful Report 📊
- Overall AI visibility score (0-100)
- Journey stage breakdowns
- Real AI response examples
- Competitor comparisons
- Actionable recommendations

### 5. Export Your Report 📥
Click **"Print / Export PDF"** to save

---

## 📍 Important URLs

| Page | URL | Purpose |
|------|-----|---------|
| **New Analysis** | `/analysis/new` | Start a new analysis |
| **Dashboard** | `/dashboard` | View all analyses |
| **Demo** | `/demo` | See sample report (Purina) |
| **Results** | `/results/{id}` | View specific analysis |

---

## 🎯 What You Get

### ✅ Comprehensive Analysis
- 9 smart questions (3 per journey stage)
- 18 AI responses analyzed
- Real ChatGPT testing

### ✅ Journey Stages
- **Awareness** - Brand discovery
- **Consideration** - Brand comparison
- **Decision** - Purchase intent

### ✅ Key Metrics
- **Mention Rate** (50% weight)
- **Position** (30% weight)
- **Sentiment** (20% weight)

### ✅ Insights
- Real AI response examples
- Competitor comparison bars
- Gap analysis
- Actionable recommendations

---

## 🔧 Environment Setup

Make sure these are in your `.env` file:

```bash
POSTGRES_PRISMA_URL="postgresql://..."
OPENAI_API_KEY="sk-..."
```

That's it! Only 2 environment variables needed.

---

## 🧪 Test Examples

### E-commerce Brand
```
Brand: Nike
Domain: nike.com
Competitors: Adidas, Puma, Under Armour
```

### SaaS Product
```
Brand: Shopify
Domain: shopify.com
Competitors: WooCommerce, BigCommerce, Wix
```

### Generic Keyword
```
Brand: project management software
Domain: (leave empty)
Competitors: Asana, Monday.com, Trello
```

---

## 📊 What Happens Behind the Scenes

```
1. Generate 9 Questions (instant)
   ├─ 3 Awareness questions
   ├─ 3 Consideration questions
   └─ 3 Decision questions

2. Test with AI (15-20 seconds)
   └─ 2 tests per question = 18 total responses

3. Analyze Results (5 seconds)
   ├─ Calculate mention rates
   ├─ Determine positions
   ├─ Analyze sentiment
   ├─ Compare competitors
   └─ Generate recommendations

4. Display Beautiful Report (instant)
```

---

## 🎨 Features

✅ Real-time progress tracking  
✅ Beautiful interactive reports  
✅ Export to PDF  
✅ Competitor analysis  
✅ Journey stage insights  
✅ AI-generated recommendations  
✅ Real AI response examples  
✅ Sentiment analysis  

---

## 🆘 Troubleshooting

### Analysis Stuck at 5%?
Check your `OPENAI_API_KEY` in `.env`

### Can't See Any Analyses?
Visit `/analysis/new` to create your first one

### Report Not Loading?
Wait for status to change to "completed" (check dashboard)

---

## 📚 Learn More

- **Full Guide**: `JOURNEY_ANALYSIS_GUIDE.md`
- **Transformation Details**: `TRANSFORMATION_SUMMARY.md`
- **API Docs**: `API.md`
- **Implementation**: `IMPLEMENTATION.md`

---

## 🎉 You're Ready!

**Visit http://localhost:3000/analysis/new and create your first analysis!**

Questions? Check the guides above or the inline documentation.

**Happy Analyzing! 🚀**
