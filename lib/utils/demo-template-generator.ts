import { Brain, Users, ShoppingCart } from "lucide-react";

interface DemoParams {
  brand: string;
  domain?: string;
  competitors?: string;
}

export function generateDemoData(params: DemoParams) {
  const { brand, domain, competitors } = params;
  
  // Parse competitors
  const competitorList = competitors 
    ? competitors.split(',').map(c => c.trim()).filter(c => c).slice(0, 3)
    : ['Competitor A', 'Competitor B', 'Competitor C'];

  // Generate domain if not provided
  const websiteDomain = domain || `${brand.toLowerCase().replace(/\s+/g, '')}.com`;

  // Base scores (we'll vary these slightly to make it realistic)
  const baseScore = 65 + Math.floor(Math.random() * 15); // 65-80
  
  return {
    brandOrKeyword: brand,
    domain: websiteDomain.startsWith('http') ? websiteDomain : `https://${websiteDomain}`,
    overallScore: baseScore,
    totalTests: 180,
    totalQuestions: 12,
    
    scoringMethodology: {
      mentionRate: { 
        weight: 50, 
        description: "How often your brand appears in AI responses", 
        yourScore: baseScore - 2 + Math.floor(Math.random() * 5), 
        calculation: "(Mentions ÷ Total Tests) × 100" 
      },
      averagePosition: { 
        weight: 30, 
        description: "Where your brand is mentioned (1st = 100pts, 5th = 20pts)", 
        yourScore: baseScore + 5 + Math.floor(Math.random() * 5), 
        calculation: "100 - ((Avg Position - 1) × 20)" 
      },
      sentiment: { 
        weight: 20, 
        description: "How positively your brand is portrayed", 
        yourScore: baseScore - 3 + Math.floor(Math.random() * 5), 
        calculation: "(Positive% - Negative%) normalized to 0-100" 
      }
    },
    
    sentimentDefinitions: {
      positive: {
        label: "Positive",
        emoji: "👍",
        color: "green",
        description: "AI recommends or praises your brand with favorable language",
        tone: "Enthusiastic, confident, endorsing",
        keywords: ["highly recommend", "excellent", "best", "trusted", "top-rated", "outstanding", "superior", "proven", "leading", "preferred"],
        examples: [
          `"${brand} is highly recommended by experts..."`,
          `"Excellent choice for those seeking quality..."`,
          `"Trusted brand with proven track record..."`
        ]
      },
      neutral: {
        label: "Neutral",
        emoji: "😐",
        color: "gray",
        description: "AI mentions your brand factually without endorsement or criticism",
        tone: "Objective, informative, balanced",
        keywords: ["available", "offers", "includes", "provides", "one option", "can be found", "also", "another"],
        examples: [
          `"${brand} is one option available..."`,
          `"${brand} offers various products including..."`,
          `"Can be found at major retailers..."`
        ]
      },
      negative: {
        label: "Negative",
        emoji: "👎",
        color: "red",
        description: "AI expresses concerns, criticisms, or warns against your brand",
        tone: "Cautionary, critical, discouraging",
        keywords: ["concerns", "issues", "not recommended", "avoid", "problems", "controversial", "recalls", "complaints", "inferior"],
        examples: [
          `"Some users have concerns about..."`,
          `"Not recommended for certain use cases..."`,
          `"Other brands may offer better value..."`
        ]
      }
    },
    
    journeyStages: [
      // AWARENESS STAGE
      {
        stage: "awareness",
        stageLabel: "Awareness",
        stageDescription: `User is learning about ${brand} and discovering the brand`,
        icon: Brain,
        color: "from-blue-500 to-blue-600",
        
        questions: [
          { question: `What is ${brand} known for?`, searchVolume: 18500, answersAnalyzed: 15 },
          { question: `Why is ${brand} popular?`, searchVolume: 22000, answersAnalyzed: 15 },
          { question: `Is ${brand} a good brand?`, searchVolume: 14200, answersAnalyzed: 15 },
          { question: `What makes ${brand} different?`, searchVolume: 16800, answersAnalyzed: 15 },
        ],
        
        portrayal: {
          mentionRate: 75.0 + Math.floor(Math.random() * 10),
          totalQuestions: 4,
          totalTests: 60,
          totalAnswersAnalyzed: 60,
          visibilityScore: 68.0 + Math.floor(Math.random() * 8),
          averagePosition: 2.0 + (Math.random() * 0.5),
          sentiment: {
            positive: 60.0 + Math.floor(Math.random() * 10),
            negative: 5.0 + Math.floor(Math.random() * 5),
            neutral: 25.0 + Math.floor(Math.random() * 10),
            dominant: "positive"
          },
          aiAnswerExamples: [
            {
              platform: "ChatGPT",
              question: `What is ${brand} known for?`,
              excerpt: `${brand} is known for its innovative products, strong brand recognition, and commitment to quality. The brand has built a reputation for excellence and reliability over the years. When consumers think of ${brand}, they associate it with industry leadership and cutting-edge offerings that set market standards.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `Why is ${brand} popular?`,
              excerpt: `${brand} is popular because of its consistent quality, strong marketing, and loyal customer base. The brand resonates with consumers through innovative products and compelling brand storytelling. Many people choose ${brand} for its reputation and the trust it has built in the market over time.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Gemini",
              question: `Is ${brand} a good brand?`,
              excerpt: `${brand} is generally considered a good brand, known for quality products and strong customer satisfaction. Like ${competitorList[0]} and ${competitorList[1]}, ${brand} has established itself as a reliable choice in its category. Customer reviews often highlight the brand's consistency and value proposition.`,
              brandPosition: 2,
              sentiment: "positive"
            },
            {
              platform: "ChatGPT",
              question: `What makes ${brand} different?`,
              excerpt: `${brand} differentiates itself through innovation, brand heritage, and customer focus. While competitors like ${competitorList[0]} and ${competitorList[1]} offer similar products, ${brand} has carved out its unique position in the market through distinctive features and brand identity.`,
              brandPosition: 2,
              sentiment: "neutral"
            },
            {
              platform: "Copilot",
              question: `What is ${brand} known for?`,
              excerpt: `${brand} is known as one of several established brands in its category. Along with ${competitorList[0]} and ${competitorList[1]}, ${brand} offers products that cater to specific customer needs. The brand has developed recognition for its approach to quality and customer service.`,
              brandPosition: 3,
              sentiment: "neutral"
            }
          ],
          competitorComparison: competitorList.slice(0, 3).map((comp, idx) => ({
            competitorName: comp,
            mentionRate: 70.0 + Math.floor(Math.random() * 15) + (idx * 2),
            avgPosition: 2.0 + (Math.random() * 0.8) + (idx * 0.2),
            sentiment: "positive" as const
          }))
        },
        
        recommendation: {
          commonPattern: `AI responses consistently prioritize brands that demonstrate authority, quality, and innovation when educating users about ${brand} and similar products.`,
          contentType: "Educational content about brand values, product features, innovation stories, and quality certifications",
          focusedAction: `Create a comprehensive '${brand} Knowledge Hub' featuring: (1) Brand story and heritage, (2) Product innovation timeline, (3) Quality certifications and awards, (4) Expert testimonials and reviews. Make this content easily crawlable and reference-friendly for AI systems.`
        }
      },
      
      // CONSIDERATION STAGE
      {
        stage: "consideration",
        stageLabel: "Consideration",
        stageDescription: `User is comparing ${brand} with competitors and evaluating options`,
        icon: Users,
        color: "from-purple-500 to-purple-600",
        
        questions: [
          { question: `${brand} vs ${competitorList[0]} - which is better?`, searchVolume: 7200, answersAnalyzed: 15 },
          { question: `Is ${brand} worth the money?`, searchVolume: 11500, answersAnalyzed: 15 },
          { question: `${brand} customer reviews and ratings`, searchVolume: 13200, answersAnalyzed: 15 },
          { question: `What are the best alternatives to ${brand}?`, searchVolume: 9100, answersAnalyzed: 15 },
        ],
        
        portrayal: {
          mentionRate: 62.0 + Math.floor(Math.random() * 10),
          totalQuestions: 4,
          totalTests: 60,
          totalAnswersAnalyzed: 60,
          visibilityScore: 60.0 + Math.floor(Math.random() * 8),
          averagePosition: 2.2 + (Math.random() * 0.6),
          sentiment: {
            positive: 68.0 + Math.floor(Math.random() * 8),
            negative: 4.0 + Math.floor(Math.random() * 4),
            neutral: 24.0 + Math.floor(Math.random() * 8),
            dominant: "positive"
          },
          aiAnswerExamples: [
            {
              platform: "ChatGPT",
              question: `${brand} vs ${competitorList[0]} - which is better?`,
              excerpt: `When comparing ${brand} and ${competitorList[0]}, both have their strengths. ${brand} is often praised for its quality-to-price ratio and brand reputation, while ${competitorList[0]} may offer specific features that appeal to certain customers. Many consumers prefer ${brand} for its consistent performance and strong brand value.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `Is ${brand} worth the money?`,
              excerpt: `${brand} is generally considered worth the investment by most customers. The brand delivers on quality, durability, and overall value. While it may cost more than budget alternatives, customers often report satisfaction with their ${brand} purchases. The brand's reputation for quality justifies the premium for many buyers.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Gemini",
              question: `${brand} customer reviews and ratings`,
              excerpt: `${brand} receives mostly positive customer reviews, with users highlighting product quality, brand reliability, and customer service. On major review platforms, ${brand} maintains strong ratings. Compared to competitors like ${competitorList[0]} and ${competitorList[1]}, ${brand} scores well for customer satisfaction and repeat purchase intent.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "ChatGPT",
              question: `What are the best alternatives to ${brand}?`,
              excerpt: `Top alternatives to ${brand} include ${competitorList[0]}, ${competitorList[1]}, and several other established brands. While ${brand} excels in certain areas, ${competitorList[0]} may be preferred for specific features. The best alternative depends on your budget, needs, and preferences.`,
              brandPosition: 2,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `${brand} vs ${competitorList[0]} - which is better?`,
              excerpt: `Choosing between ${brand} and ${competitorList[0]} comes down to personal preference and specific needs. ${competitorList[0]} has its strengths in certain areas, while ${brand} offers a well-rounded option with strong brand recognition. Both are reputable choices with dedicated customer bases.`,
              brandPosition: 1,
              sentiment: "neutral"
            }
          ],
          competitorComparison: competitorList.slice(0, 3).map((comp, idx) => ({
            competitorName: comp,
            mentionRate: 68.0 + Math.floor(Math.random() * 15) + (idx * 3),
            avgPosition: 1.8 + (Math.random() * 0.8) + (idx * 0.3),
            sentiment: "positive" as const
          }))
        },
        
        recommendation: {
          commonPattern: `AI chatbots prioritize brands that provide specific evidence for claims: customer reviews, expert testimonials, comparative data, and documented advantages when users are actively comparing ${brand} with alternatives.`,
          contentType: "Comparison-friendly content with detailed feature breakdowns, customer testimonials, expert reviews, case studies, and transparent pricing information",
          focusedAction: `Develop a '${brand} Evidence Library' with: (1) Side-by-side comparison tool showing ${brand} vs competitors, (2) Collection of verified customer testimonials and reviews, (3) Expert endorsements and awards, (4) Interactive feature comparison calculator with real-world scenarios.`
        }
      },
      
      // DECISION STAGE
      {
        stage: "decision",
        stageLabel: "Decision",
        stageDescription: `User is ready to purchase ${brand} and looking for where to buy, pricing, and deals`,
        icon: ShoppingCart,
        color: "from-pink-500 to-pink-600",
        
        questions: [
          { question: `Where can I buy ${brand} products?`, searchVolume: 8900, answersAnalyzed: 15 },
          { question: `How much does ${brand} cost?`, searchVolume: 6500, answersAnalyzed: 15 },
          { question: `Where to find ${brand} discounts and coupons?`, searchVolume: 4200, answersAnalyzed: 15 },
          { question: `Best places to buy ${brand} on sale?`, searchVolume: 3100, answersAnalyzed: 15 },
        ],
        
        portrayal: {
          mentionRate: 50.0 + Math.floor(Math.random() * 10),
          totalQuestions: 4,
          totalTests: 60,
          totalAnswersAnalyzed: 60,
          visibilityScore: 55.0 + Math.floor(Math.random() * 8),
          averagePosition: 2.8 + (Math.random() * 0.6),
          sentiment: {
            positive: 52.0 + Math.floor(Math.random() * 8),
            negative: 8.0 + Math.floor(Math.random() * 4),
            neutral: 32.0 + Math.floor(Math.random() * 8),
            dominant: "positive"
          },
          aiAnswerExamples: [
            {
              platform: "ChatGPT",
              question: `Where can I buy ${brand} products?`,
              excerpt: `You can buy ${brand} products at major retailers including the official ${websiteDomain} website, Amazon, and physical stores nationwide. Online shopping often provides the best selection and deals. Many customers prefer buying directly from ${websiteDomain} for the latest releases and exclusive offers.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `How much does ${brand} cost?`,
              excerpt: `${brand} pricing varies by product line and retailer. Generally, ${brand} is positioned as a mid-to-premium brand with prices comparable to ${competitorList[0]}. You can find deals by shopping sales events, using coupons, or checking multiple retailers. The official website often has the most transparent pricing.`,
              brandPosition: 1,
              sentiment: "neutral"
            },
            {
              platform: "Gemini",
              question: `Where to find ${brand} discounts and coupons?`,
              excerpt: `${brand} discounts are available through: (1) Official website seasonal sales, (2) Email newsletter signup offers, (3) Retailer promotions at major stores, (4) Student and military discounts, (5) Loyalty program rewards. Sites like RetailMeNot and Honey also aggregate ${brand} coupon codes.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `Best places to buy ${brand} on sale?`,
              excerpt: `The best places to find ${brand} on sale include: the official website during holiday sales, Amazon Prime Day deals, major retailer clearance events, and outlet stores. Sign up for ${brand} emails to get notified of upcoming sales. Prices are often competitive with ${competitorList[0]} during promotional periods.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Gemini",
              question: `Where can I buy ${brand} products?`,
              excerpt: `${brand} products are available at: official website (${websiteDomain}), Amazon and major e-commerce sites, department stores, specialty retailers, and authorized dealers. For authenticity and warranty, purchase from official channels. Compare prices across retailers to find the best deals, especially during sales events.`,
              brandPosition: 1,
              sentiment: "neutral"
            }
          ],
          competitorComparison: competitorList.slice(0, 3).map((comp, idx) => ({
            competitorName: comp,
            mentionRate: 55.0 + Math.floor(Math.random() * 10) + (idx * 2),
            avgPosition: 2.7 + (Math.random() * 0.6) + (idx * 0.2),
            sentiment: "positive" as const
          }))
        },
        
        recommendation: {
          commonPattern: `AI responses prioritize brands with clear, structured information about: purchase locations, pricing transparency, shipping options, discount programs, and easy checkout processes. AI struggles to recommend brands with fragmented purchase paths.`,
          contentType: "Structured e-commerce data: clear pricing information, retailer partnerships, shipping policies, return guarantees, and subscription benefits documentation",
          focusedAction: `Implement comprehensive e-commerce optimization for ${brand}: (1) Clear pricing on all pages with shipping costs, (2) Easy-to-find 'Where to Buy' with live availability, (3) Prominent subscription/discount programs, (4) Simplified checkout with multiple payment options. Ensure all retailer partners have accurate ${brand} product information.`
        }
      }
    ]
  };
}
