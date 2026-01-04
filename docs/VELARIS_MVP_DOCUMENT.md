# Velaris AI Visibility Platform - MVP Document

**Document Version:** 1.0
**Date:** January 5, 2025
**Status:** MVP Complete, Production Readiness In Progress

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current MVP State](#2-current-mvp-state)
3. [Technology Stack](#3-technology-stack)
4. [Feature Inventory](#4-feature-inventory)
5. [Pricing Strategy & Competitive Analysis](#5-pricing-strategy--competitive-analysis)
6. [Value Proposition & Differentiation](#6-value-proposition--differentiation)
7. [Development Roadmap](#7-development-roadmap)
8. [January 15th Launch Requirements](#8-january-15th-launch-requirements)
9. [Operational Costs & Financial Projections](#9-operational-costs--financial-projections)
10. [Risk Assessment](#10-risk-assessment)

---

## 1. Executive Summary

### What is Velaris?

Velaris is an **AI Visibility Analysis Platform** that helps brands understand how they appear in AI-powered search and recommendation systems. As 70% of searches now end without a click (zero-click searches) and AI assistants increasingly influence purchase decisions, traditional SEO is no longer sufficient.

### The Problem We Solve

When customers ask ChatGPT, Perplexity, or Gemini questions like:
- "What's the best CRM for small businesses?"
- "Which skincare brand is best for sensitive skin?"
- "What project management tool should I use?"

**Your brand should come up. But does it?**

Most companies have no visibility into how AI platforms represent them, recommend competitors, or even spread misinformation about their products.

### The Solution

Velaris queries real AI platforms with questions your customers ask, analyzes:
- Whether you're mentioned at all
- Where you rank vs. competitors
- What AI says about your brand (sentiment, accuracy)
- At which buying stage you're visible (Awareness → Consideration → Decision)

Then provides actionable recommendations to improve your AI visibility.

---

## 2. Current MVP State

### What's Built (Production Ready)

| Component | Status | Notes |
|-----------|--------|-------|
| AI Visibility Analysis | ✅ Complete | Real API integration with 3 platforms |
| Brand Positioning Check | ✅ Complete | AI perception vs intended positioning |
| Dashboard | ✅ Complete | Analysis history, management |
| Results Page | ✅ Complete | Full visibility analysis with leaderboard |
| Automation System | ✅ Complete | Scheduling infrastructure built |
| Alert System | ✅ Complete | 9 alert types, email notifications |
| Export System | ✅ Complete | PDF, CSV, Excel, JSON |
| User Authentication | ⚠️ Partial | Basic login/register, needs Stripe integration |
| Payment/Subscriptions | ❌ Not Built | Stripe integration required |
| Tier Enforcement | ⚠️ Frontend Only | Backend validation needed |

### What's NOT Built (Required for Launch)

1. **Stripe Payment Integration** - No way to collect payments
2. **Backend Tier Enforcement** - Limits are frontend-only (easily bypassed)
3. **Usage Tracking** - Can't count analyses per month
4. **Email Verification** - Registration doesn't verify emails
5. **Password Reset** - No forgot password flow
6. **Onboarding Flow** - No guided first-time experience

---

## 3. Technology Stack

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  Next.js 16 + React 19 + TypeScript + Tailwind CSS          │
│  Deployed on: Vercel                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API ROUTES (Next.js)                     │
│  /api/analysis/*     - Core analysis endpoints               │
│  /api/auth/*         - Login/Register                        │
│  /api/alerts/*       - Alert configuration                   │
│  /api/automation/*   - Scheduled scans                       │
│  /api/brand-positioning/* - Brand perception analysis        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE                                │
│  PostgreSQL (Vercel Postgres) + Prisma ORM                  │
│  25+ tables for users, analyses, alerts, webhooks, etc.     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI INTEGRATIONS                           │
│  ChatGPT (OpenAI API) - gpt-4o-mini                         │
│  Gemini (Google AI) - gemini-1.5-flash                      │
│  Perplexity - sonar-pro model                               │
└─────────────────────────────────────────────────────────────┘
```

### Dependencies (package.json)

| Package | Purpose |
|---------|---------|
| `next` v16 | React framework |
| `@prisma/client` | Database ORM |
| `openai` | ChatGPT API |
| `@google/generative-ai` | Gemini API |
| `bcryptjs` | Password hashing |
| `jose` / `jsonwebtoken` | JWT authentication |
| `recharts` | Data visualization |
| `zod` | Input validation |
| `bullmq` / `ioredis` | Background job processing |

### Database Schema (Prisma)

**Core Tables:**
- `User` - User accounts with tier info
- `Analysis` - Visibility analysis results
- `AITestResult` - Individual AI platform responses
- `ScheduledScan` - Automation configurations
- `AlertConfig` - Alert rules and thresholds
- `BrandGroundTruth` - Brand facts for accuracy checking

---

## 4. Feature Inventory

### Current Features (Live)

#### 1. AI Visibility Analysis
- **Platforms:** ChatGPT, Gemini, Perplexity (real APIs)
- **Journey Stages:** Awareness, Consideration, Decision
- **Competitor Tracking:** Up to 10 competitors
- **Follow-up Questions:** AI explains why it recommends competitors
- **Visibility Leaderboard:** Compare mentions across platforms

#### 2. Brand Positioning Check
- Auto-fetch positioning from website
- Define positioning attributes
- AI perception vs. intended positioning comparison
- Alignment scoring per platform

#### 3. Dashboard
- Analysis history
- Quick stats overview
- Recent activity tracking
- Export capabilities (PDF, CSV, Excel, JSON)

#### 4. Automation (Infrastructure Built)
- Cron-based scheduling (daily, weekly, monthly)
- Execution history tracking
- Error handling & retry logic
- *Note: Requires cron trigger setup*

#### 5. Alert System (Infrastructure Built)
- 9 alert types:
  - Visibility drop
  - Competitor surge
  - Hallucination detected
  - New competitor mentioned
  - Sentiment shift
  - Position change
  - Stage coverage change
  - Citation added/removed
  - Brand confusion
- Email notifications
- *Note: Requires email service (SendGrid/Resend)*

### Coming Soon Features

| Feature | Priority | Effort |
|---------|----------|--------|
| More AI Platforms (Copilot, Claude, Grok, Meta AI, Mistral) | High | 2-3 days per platform |
| Webhooks | Medium | 3-4 days |
| Third-party Integrations (Slack, Discord, Teams, Zapier) | Medium | 1-2 weeks |
| API Access | Medium | 3-5 days |
| White-label Reports | Low | 1 week |

---

## 5. Pricing Strategy & Competitive Analysis

### Market Research Summary

| Competitor | Pricing Range | Focus |
|------------|---------------|-------|
| Otterly.ai | $25-249/mo | AI search monitoring |
| Peec.ai | $99-399/mo | AI visibility |
| Profound | $149-499/mo | Enterprise AI analytics |
| Rankability | $49-199/mo | AI SEO |
| AthenaHQ | $200-500/mo | Brand intelligence |

**Market Average:** ~$337/month for mid-tier plans

### Velaris Pricing (Positioned Below Market)

| Tier | Price | Annual | Target Customer |
|------|-------|--------|-----------------|
| **Starter** | $0/mo | Free | Try before buy |
| **Growth** | $149/mo | $119/mo (20% off) | Growing brands, marketers |
| **Agency** | $349/mo | $279/mo (20% off) | Agencies, enterprises |

### Why This Pricing Works

1. **Below Market Average** - $149 vs $337 industry average (56% cheaper)
2. **Free Tier Creates Leads** - Users see the problem, pay for solutions
3. **Growth is the Target** - Visual prominence, "Most Popular" badge
4. **Agency for High-Value** - White-label, API, unlimited brands

### Behavioral Science Principles Applied

- **Anchoring:** Show Agency tier first ($349) makes Growth feel reasonable
- **Decoy Effect:** Starter ($0) has clear limits, Growth removes all friction
- **Loss Aversion:** "Stop losing customers to AI" messaging
- **Compromise Effect:** Growth is the middle option (most will choose it)

---

## 6. Value Proposition & Differentiation

### Unique Selling Proposition

> **"Know what AI says about your brand before your customers ask."**

### Key Differentiators vs. Competitors

| Feature | Velaris | Otterly | Peec | Traditional SEO |
|---------|---------|---------|------|-----------------|
| Full Journey Analysis (Awareness → Decision) | ✅ | ❌ | Partial | ❌ |
| Follow-up Questions (AI reasoning) | ✅ | ❌ | ❌ | ❌ |
| Competitive Leaderboard | ✅ | ✅ | ❌ | ❌ |
| Brand Positioning vs. AI Perception | ✅ | ❌ | ❌ | ❌ |
| Hallucination/Misinformation Detection | ✅ | ❌ | ❌ | ❌ |
| Real-time AI Querying | ✅ | ✅ | ✅ | ❌ |

### Why Velaris Delivers More Value

1. **Full Funnel Analysis** - Not just "are you mentioned" but "where in the buying journey"
2. **Competitive Intelligence** - See exactly who beats you and why AI prefers them
3. **Actionable Insights** - Follow-up questions reveal AI's reasoning for recommendations
4. **Brand Accuracy** - Detect misinformation before it hurts your reputation

---

## 7. Development Roadmap

### Phase 1: Production Ready (Jan 5-15, 2025)
*Goal: Accept paying customers*

| Task | Effort | Dependencies | Priority |
|------|--------|--------------|----------|
| Stripe Integration | 2 days | Stripe account | Critical |
| Backend Tier Enforcement | 1 day | Stripe webhooks | Critical |
| Usage Tracking | 1 day | Database | Critical |
| Email Verification (SendGrid/Resend) | 1 day | Email service account | High |
| Password Reset Flow | 0.5 days | Email service | High |
| Onboarding Flow | 1 day | None | Medium |
| Error Monitoring (Sentry) | 0.5 days | Sentry account | Medium |
| Analytics (PostHog/Mixpanel) | 0.5 days | Analytics account | Medium |

**Total Effort: 7.5 days**

### Phase 2: Growth Features (Jan 16-31, 2025)

| Task | Effort | Priority |
|------|--------|----------|
| Copilot Integration | 2 days | High |
| Claude Integration | 2 days | High |
| Email Alert Delivery | 2 days | High |
| Cron Job Setup (Vercel/external) | 1 day | High |
| Landing Page Optimization | 2 days | Medium |

### Phase 3: Scale Features (Feb 2025)

| Task | Effort | Priority |
|------|--------|----------|
| Grok Integration | 2 days | Medium |
| Meta AI Integration | 2 days | Medium |
| Slack/Discord Integration | 3 days | Medium |
| Webhook System | 3 days | Medium |
| API Access (public) | 5 days | Low |
| White-label Reports | 5 days | Low |

### Phase 4: Infrastructure (If Moving Off Vercel)

| Task | Effort | Priority |
|------|--------|----------|
| Docker Containerization | 1 day | High |
| Google Cloud Run Setup | 1 day | High |
| Cloud SQL Migration | 0.5 days | High |
| CI/CD Pipeline | 1 day | High |
| Monitoring & Logging | 1 day | Medium |

---

## 8. January 15th Launch Requirements

### What Must Be True by January 15

To have a fully operational, revenue-generating platform:

```
┌─────────────────────────────────────────────────────────────┐
│                  CRITICAL PATH (10 days)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Day 1-2: Stripe Integration                                 │
│    □ Create Stripe account                                   │
│    □ Configure products (Growth $149, Agency $349)           │
│    □ Create checkout session API                             │
│    □ Create webhook handler for subscription events          │
│    □ Update user tier on successful payment                  │
│                                                              │
│  Day 3: Backend Tier Enforcement                             │
│    □ Add tier check middleware                               │
│    □ Enforce analysis limits in /api/analysis/run            │
│    □ Block features based on tier (exports, automation)      │
│    □ Add usage counter to User model                         │
│                                                              │
│  Day 4: Email Service                                        │
│    □ Set up SendGrid/Resend account                          │
│    □ Email verification on registration                      │
│    □ Password reset flow                                     │
│    □ Alert notification emails                               │
│                                                              │
│  Day 5-6: Testing & Polish                                   │
│    □ End-to-end payment testing                              │
│    □ Tier limit testing                                      │
│    □ Mobile responsiveness check                             │
│    □ Error handling review                                   │
│                                                              │
│  Day 7: Onboarding & UX                                      │
│    □ First-time user onboarding flow                         │
│    □ Trial activation messaging                              │
│    □ Upgrade prompts at limit points                         │
│                                                              │
│  Day 8: Monitoring & Analytics                               │
│    □ Sentry error tracking                                   │
│    □ PostHog/Mixpanel analytics                              │
│    □ Uptime monitoring                                       │
│                                                              │
│  Day 9-10: Buffer & Final Testing                            │
│    □ Full regression testing                                 │
│    □ Payment flow verification                               │
│    □ Documentation                                           │
│    □ Soft launch to test users                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### External Account Requirements

| Service | Purpose | Setup Time | Cost |
|---------|---------|------------|------|
| Stripe | Payments | 1-2 hours | 2.9% + $0.30 per transaction |
| SendGrid or Resend | Email | 30 min | Free tier / $20/mo |
| Sentry | Error tracking | 15 min | Free tier |
| PostHog | Analytics | 15 min | Free tier |

### Decision: Stay on Vercel or Move?

**Recommendation: Stay on Vercel for January 15 Launch**

| Factor | Vercel | Google Cloud Run |
|--------|--------|------------------|
| Time to deploy | Already deployed | 2-3 days setup |
| Cost at launch scale | ~$20/mo | ~$10-20/mo |
| Complexity | Low | Medium |
| Cron jobs | Vercel Cron (Pro) | Cloud Scheduler |
| Database | Vercel Postgres | Cloud SQL |

**Move to GCP later when:**
- You need more control over infrastructure
- Costs become significant (>$100/mo on Vercel)
- You need custom networking/security

---

## 9. Operational Costs & Financial Projections

### Monthly Operational Costs (At Launch)

| Cost Category | Vercel Hosting | GCP Hosting |
|---------------|----------------|-------------|
| **Hosting** | $20 (Pro plan) | $15-30 (Cloud Run) |
| **Database** | Included | $10-30 (Cloud SQL) |
| **AI API Costs** | Variable | Variable |
| **Email (SendGrid)** | $0-20 | $0-20 |
| **Domain** | ~$1.50/mo | ~$1.50/mo |
| **Monitoring** | Free tier | Free tier |
| **Total Fixed** | ~$25/mo | ~$35-60/mo |

### AI API Costs Per Analysis

| Platform | Cost Per Query | Queries Per Analysis | Cost Per Analysis |
|----------|----------------|----------------------|-------------------|
| ChatGPT (gpt-4o-mini) | ~$0.002 | 9-27 | $0.02-0.06 |
| Gemini (1.5-flash) | ~$0.001 | 9-27 | $0.01-0.03 |
| Perplexity (sonar) | ~$0.005 | 9-27 | $0.05-0.15 |
| **Total per analysis** | | | **$0.08-0.24** |

### Revenue Projections

**Scenario: 10 Paying Customers (Month 1-3)**

| Tier | Customers | Monthly Revenue | AI Cost* | Net Revenue |
|------|-----------|-----------------|----------|-------------|
| Growth ($149) | 8 | $1,192 | $40 | $1,152 |
| Agency ($349) | 2 | $698 | $50 | $648 |
| **Total** | **10** | **$1,890** | **$90** | **$1,800** |

*Assuming 50 analyses/customer/month avg

**Scenario: 50 Paying Customers (Month 6)**

| Tier | Customers | Monthly Revenue | AI Cost | Net Revenue |
|------|-----------|-----------------|---------|-------------|
| Growth ($149) | 40 | $5,960 | $200 | $5,760 |
| Agency ($349) | 10 | $3,490 | $250 | $3,240 |
| **Total** | **50** | **$9,450** | **$450** | **$9,000** |

### Profit Margin Analysis

| Revenue Level | Fixed Costs | Variable Costs | Gross Profit | Margin |
|---------------|-------------|----------------|--------------|--------|
| $1,890/mo | $25 | $90 | $1,775 | 94% |
| $5,000/mo | $50 | $240 | $4,710 | 94% |
| $10,000/mo | $100 | $500 | $9,400 | 94% |

**Key Insight:** SaaS margins are excellent. Variable costs (AI APIs) scale linearly but are tiny relative to subscription revenue.

### Break-Even Analysis

| Cost Type | Monthly Amount |
|-----------|----------------|
| Fixed costs | $25-50 |
| Your time | $X (depends on your hourly rate) |

**Break-even at just 1 Growth customer ($149/mo)** if you don't count your time.

---

## 10. Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI API rate limits | Medium | High | Implement queuing, caching |
| AI API price increases | Low | Medium | Multi-platform redundancy |
| Vercel downtime | Low | High | Consider multi-region |
| Database corruption | Low | Critical | Daily backups |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low conversion (free→paid) | Medium | High | Optimize upgrade triggers |
| Competitor copies features | High | Medium | Focus on UX, speed to market |
| AI platforms change APIs | Medium | High | Abstract API layer |
| GDPR/Privacy concerns | Medium | Medium | Clear data handling policy |

### Timeline Risks for Jan 15

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stripe approval delays | 1-2 day delay | Apply immediately |
| Email service setup issues | 0.5 day delay | Have backup (Resend) |
| Unexpected bugs | 1-3 day delay | Buffer time built in |

---

## Appendix A: Tech Decisions Rationale

### Why Next.js?
- Full-stack in one codebase
- Excellent Vercel integration
- React ecosystem familiarity
- API routes for backend logic

### Why PostgreSQL?
- Relational data model fits our needs
- Prisma ORM excellent DX
- Vercel Postgres easy setup
- Easy migration to Cloud SQL later

### Why Not Clerk/Auth0?
- Full control over user data
- No vendor lock-in
- Simple auth needs (email/password)
- Can add OAuth later if needed

### Why Vercel for Now?
- Zero DevOps for launch
- Already deployed and working
- Can migrate later when scale demands

---

## Appendix B: API Keys Required

| Service | Environment Variable | Required For |
|---------|---------------------|--------------|
| OpenAI | `OPENAI_API_KEY` | ChatGPT queries |
| Google AI | `GOOGLE_AI_API_KEY` | Gemini queries |
| Perplexity | `PERPLEXITY_API_KEY` | Perplexity queries |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Payments |
| SendGrid | `SENDGRID_API_KEY` | Email |
| Database | `POSTGRES_PRISMA_URL` | Database connection |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 5, 2025 | Claude/Mohamed | Initial MVP document |

---

*This document should be updated as development progresses toward the January 15th launch.*
