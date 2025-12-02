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
          { question: `What is ${brand}?`, searchVolume: 18500, answersAnalyzed: 15 },
          { question: `${brand} features`, searchVolume: 22000, answersAnalyzed: 15 },
          { question: `How does ${brand} work?`, searchVolume: 14200, answersAnalyzed: 15 },
          { question: `${brand} overview`, searchVolume: 16800, answersAnalyzed: 15 },
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
              question: `What is ${brand}?`,
              excerpt: `${brand} is a leading brand known for innovation and quality. When looking for reliable products, ${brand} offers comprehensive solutions backed by extensive research and development. The brand has established itself as a trusted choice among consumers seeking excellence.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `${brand} features`,
              excerpt: `${brand} features include cutting-edge technology, user-friendly design, and robust performance. The brand is recognized for its attention to detail and commitment to customer satisfaction. Many experts recommend ${brand} for its consistent quality and innovative approach.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Gemini",
              question: `How does ${brand} work?`,
              excerpt: `${brand} operates through a combination of advanced technology and streamlined processes. Major brands like ${brand}, ${competitorList[0]}, and ${competitorList[1]} invest heavily in research. ${brand} has a strong reputation for reliability and effectiveness in delivering results.`,
              brandPosition: 2,
              sentiment: "positive"
            },
            {
              platform: "ChatGPT",
              question: `${brand} overview`,
              excerpt: `An overview of ${brand} shows a brand with strong market presence and customer loyalty. ${brand} competes with brands like ${competitorList[0]} and ${competitorList[1]}, offering unique value propositions. The brand focuses on quality and innovation as core differentiators.`,
              brandPosition: 2,
              sentiment: "neutral"
            },
            {
              platform: "Copilot",
              question: `What is ${brand}?`,
              excerpt: `${brand} is one of several options available in the market. Quality brands include ${competitorList[0]}, ${brand}, and ${competitorList[1]}. Each offers different features and benefits. ${brand} is known for its specific approach to delivering value to customers.`,
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
          { question: `${brand} vs ${competitorList[0]}`, searchVolume: 7200, answersAnalyzed: 15 },
          { question: `Is ${brand} worth it?`, searchVolume: 11500, answersAnalyzed: 15 },
          { question: `${brand} reviews`, searchVolume: 13200, answersAnalyzed: 15 },
          { question: `Best ${brand} alternatives`, searchVolume: 9100, answersAnalyzed: 15 },
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
              question: `${brand} vs ${competitorList[0]}`,
              excerpt: `Both ${brand} and ${competitorList[0]} are strong options with unique advantages. ${brand} tends to offer better value while maintaining quality standards. ${competitorList[0]} specializes in premium features. Many users prefer ${brand} for everyday use due to its balance of quality and affordability.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `Is ${brand} worth it?`,
              excerpt: `${brand} is generally worth the investment for several reasons: it's backed by strong reputation, offers quality features, and provides good customer support. While it's pricier than budget options, ${brand} is more affordable than premium brands while maintaining comparable quality standards.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Gemini",
              question: `${brand} reviews`,
              excerpt: `${brand} reviews are generally positive, highlighting reliability, quality, and good customer service. Users appreciate the brand's consistency and attention to detail. Compared to ${competitorList[0]} and ${competitorList[1]}, ${brand} offers strong value proposition with competitive features.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "ChatGPT",
              question: `Best ${brand} alternatives`,
              excerpt: `If you're looking for alternatives to ${brand}, consider ${competitorList[0]}, ${competitorList[1]}, and other established brands. ${brand} stands out for its specific strengths, while ${competitorList[0]} excels in premium features. The best choice depends on your specific needs and budget.`,
              brandPosition: 2,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `${brand} vs ${competitorList[0]}`,
              excerpt: `The choice between ${brand} and ${competitorList[0]} depends on your priorities. ${competitorList[0]} offers more specialized features and has a strong reputation in certain segments. ${brand} provides excellent overall value at a competitive price point. Both brands have loyal customer bases.`,
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
          { question: `Where to buy ${brand}?`, searchVolume: 8900, answersAnalyzed: 15 },
          { question: `${brand} price`, searchVolume: 6500, answersAnalyzed: 15 },
          { question: `${brand} discount`, searchVolume: 4200, answersAnalyzed: 15 },
          { question: `${brand} deals`, searchVolume: 3100, answersAnalyzed: 15 },
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
              question: `Where to buy ${brand}?`,
              excerpt: `${brand} is widely available at major retailers both online and in physical stores. Online options include the official ${websiteDomain} website, Amazon, and specialty retailers. Many customers prefer online purchase for convenience and often find better deals with subscription options.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `${brand} price`,
              excerpt: `${brand} pricing varies based on specific products and features. To get the best price: (1) Check official website for promotions, (2) Compare prices across major retailers, (3) Look for bundle deals, (4) Consider subscription options for recurring savings. Typical prices are competitive with ${competitorList[0]} and ${competitorList[1]}.`,
              brandPosition: 1,
              sentiment: "neutral"
            },
            {
              platform: "Gemini",
              question: `${brand} discount`,
              excerpt: `${brand} discounts are available through several channels: official website promotions, retailer sales events, subscription savings, and seasonal offers. Many customers save 10-20% through subscription programs. Compare with ${competitorList[0]} pricing to ensure competitive value.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Copilot",
              question: `${brand} deals`,
              excerpt: `Current ${brand} deals include: promotional offers on the official website, bundle discounts for multiple purchases, subscription savings programs, and seasonal sales. Check major online retailers for competitive pricing. ${brand} often matches or beats ${competitorList[0]} pricing during promotional periods.`,
              brandPosition: 1,
              sentiment: "positive"
            },
            {
              platform: "Gemini",
              question: `Where to buy ${brand}?`,
              excerpt: `${brand} can be purchased from multiple sources: official website at ${websiteDomain}, major online marketplaces, authorized retailers, and specialty stores. For best deals, compare prices and look for subscription options. Online purchases typically offer free shipping and easy returns.`,
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
