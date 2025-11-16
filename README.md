# AI-Powered SEO & Search Visibility Analysis Platform

A comprehensive web application that analyzes the impact of AI-driven search features (Google AI Overviews, ChatGPT, Gemini) on organic and paid search performance.

## 🚀 Features

### Module 1: AI Overview Impact Analysis
- Google Search Console API integration
- Ahrefs API integration  
- Traffic impact analysis (before/after AI Overview)
- Interactive visualizations
- Export reports

### Module 2: AI Chatbot Visibility Scoring
- Automated ChatGPT & Gemini querying
- Brand mention detection
- Citation analysis
- Visibility scoring (0-100)
- Actionable recommendations

## 📋 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **APIs**: Google Search Console, Ahrefs, OpenAI, Google Gemini
- **Charts**: Recharts

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- API Keys (GSC, Ahrefs, OpenAI, Gemini)

### Installation

```bash
# Clone repository
git clone https://github.com/mohamedali170683-dotcom/ai-seo-analysis-platform.git
cd ai-seo-analysis-platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Initialize database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
Visit http://localhost:3000

📊 Project Structure
ai-seo-analysis-platform/
├── app/              # Next.js pages and API routes
├── components/       # React components
├── lib/
│   ├── services/    # Business logic
│   ├── db/          # Database utilities
│   └── types/       # TypeScript types
├── prisma/          # Database schema
└── public/          # Static assets
🔑 Environment Variables
Required in .env:

DATABASE_URL="postgresql://user:password@localhost:5432/seo_analysis"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AHREFS_API_KEY="your-ahrefs-api-key"
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_AI_API_KEY="your-google-ai-api-key"
📖 Documentation
Complete setup instructions
System architecture details
API endpoint reference
🤝 Contributing
Contributions welcome! Please open an issue or submit a pull request.

📄 License
MIT License - see LICENSE file

🙏 Acknowledgments
Built with Next.js, Prisma, OpenAI, and love ❤️
