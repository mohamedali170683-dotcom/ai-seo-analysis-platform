import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CitationAnalysis } from "./citation-detector";

export type AIPlatform = "ChatGPT" | "Gemini" | "Perplexity";

export interface SourceCitation {
  url: string;
  title?: string;
  snippet?: string;
  domain?: string;
}

export interface AIResponse {
  platform: AIPlatform;
  modelVersion: string;
  queryNumber: number;
  question: string;
  fullResponse: string;
  brandMentioned: boolean;
  brandPosition: number | null;
  contextExtract: string | null;
  sentiment: "positive" | "neutral" | "negative";
  recommendationType: "direct" | "conditional" | "listed" | null;
  competitorsMentioned: string[];
  citedUrls: string[];
  sources: SourceCitation[]; // Detailed source citations
  isRealAPI: boolean;
  hasGrounding: boolean; // Whether response has verifiable sources
  citationAnalysis?: CitationAnalysis; // Citation analysis for awareness scoring
}

export interface PlatformStats {
  platform: AIPlatform;
  totalTests: number;
  mentionCount: number;
  mentionRate: number;
  avgPosition: number | null;
  sentimentCounts: { positive: number; neutral: number; negative: number };
}

export interface QuestionAnalysis {
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  totalResponses: number;
  responses: AIResponse[];
  aggregated: {
    mentionRate: number;
    avgPosition: number | null;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
      dominant: "positive" | "neutral" | "negative";
    };
    competitorMentions: { [competitor: string]: number };
    platformBreakdown: PlatformStats[];
  };
}

export class MultiPlatformAIService {
  private openaiClient: OpenAI;
  private geminiClient: GoogleGenerativeAI | null = null;
  private perplexityClient: OpenAI | null = null; // Perplexity uses OpenAI-compatible API
  private testsPerPlatform: number;
  
  // Track which platforms have real API access
  public platformStatus: Record<AIPlatform, { isReal: boolean; reason: string }>;

  constructor(
    openaiApiKey: string, 
    geminiApiKey?: string, 
    testsPerPlatform: number = 3,
    perplexityApiKey?: string
  ) {
    this.openaiClient = new OpenAI({ 
      apiKey: openaiApiKey,
      timeout: 15000,
      maxRetries: 1,
    });
    
    // Initialize platform status - Real APIs only
    this.platformStatus = {
      ChatGPT: { isReal: true, reason: "OpenAI API (gpt-4o-mini)" },
      Gemini: { isReal: false, reason: "No API key - simulated via OpenAI" },
      Perplexity: { isReal: false, reason: "No API key - simulated via OpenAI" },
    };
    
    // Initialize Gemini client if API key provided
    if (geminiApiKey && geminiApiKey !== "your-google-gemini-api-key" && geminiApiKey.length > 10) {
      try {
        this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
        this.platformStatus.Gemini = { isReal: true, reason: "Google Gemini API" };
        console.log("✅ [AI] Gemini client created");
        console.log(`   → Key: ${geminiApiKey.substring(0, 8)}... (${geminiApiKey.length} chars)`);
      } catch (initError: any) {
        console.error(`❌ [AI] Gemini client init FAILED: ${initError.message}`);
        this.geminiClient = null;
        this.platformStatus.Gemini = { isReal: false, reason: `Init error: ${initError.message}` };
      }
    } else {
      const reason = !geminiApiKey ? "No API key" : 
                     geminiApiKey === "your-google-gemini-api-key" ? "Placeholder key" :
                     geminiApiKey.length <= 10 ? "Key too short" : "Unknown";
      console.log(`⚠️ [AI] Gemini: ${reason} - will SIMULATE`);
    }
    
    // Initialize Perplexity client if API key provided
    // Perplexity uses an OpenAI-compatible API
    if (perplexityApiKey) {
      this.perplexityClient = new OpenAI({
        apiKey: perplexityApiKey,
        baseURL: "https://api.perplexity.ai",
        timeout: 20000,
        maxRetries: 1,
      });
      this.platformStatus.Perplexity = { isReal: true, reason: "Perplexity API (llama-3.1-sonar-small-128k-online)" };
      console.log("✅ [AI] Perplexity API initialized (REAL)");
    } else {
      console.log("⚠️ [AI] Perplexity API key not provided - will use simulation");
    }

    this.testsPerPlatform = Math.min(testsPerPlatform, 10);
    
    // Log overall status
    console.log("🤖 [AI] Platform Status:");
    Object.entries(this.platformStatus).forEach(([platform, status]) => {
      console.log(`   ${status.isReal ? "✅" : "⚠️"} ${platform}: ${status.reason}`);
    });
  }

  /**
   * Test a question - PARALLEL platforms for speed
   */
  async testQuestion(
    question: string,
    brandName: string,
    competitors: string[] = [],
    testsPerPlatform?: number,
    targetCountry: string = "US"
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    console.log(`🤖 [AI] Testing: "${question.substring(0, 50)}..." (${numTests} tests × 3 platforms) [${targetCountry}]`);
    const startTime = Date.now();

    // Run all 3 platforms in PARALLEL using Promise.allSettled
    // Each platform will run numTests times for statistical significance
    const results = await Promise.allSettled([
      this.testSinglePlatform("ChatGPT", question, brandName, competitors, numTests, targetCountry),
      this.testSinglePlatform("Gemini", question, brandName, competitors, numTests, targetCountry),
      this.testSinglePlatform("Perplexity", question, brandName, competitors, numTests, targetCountry),
    ]);

    // Collect successful responses
    const allResponses: AIResponse[] = [];
    const platformNames: AIPlatform[] = ["ChatGPT", "Gemini", "Perplexity"];
    const platformErrors: { platform: string; error: string }[] = [];

    results.forEach((result, index) => {
      const platform = platformNames[index];
      if (result.status === "fulfilled") {
        const responses = result.value;
        allResponses.push(...responses);
        console.log(`  ✅ ${platform}: ${responses.length} responses generated`);
      } else {
        const errorMsg = result.reason?.message || result.reason || "Unknown error";
        platformErrors.push({ platform, error: errorMsg });
        console.error(`  ❌ ${platform} FAILED: ${errorMsg}`);
        if (result.reason?.stack) {
          console.error(`     Stack: ${result.reason.stack.substring(0, 200)}`);
        }
      }
    });

    // Log summary
    if (platformErrors.length > 0) {
      console.warn(`  ⚠️ ${platformErrors.length}/${platformNames.length} platforms failed for this question`);
      platformErrors.forEach(e => console.warn(`     - ${e.platform}: ${e.error}`));
    }

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    console.log(`✅ [AI] Done in ${Date.now() - startTime}ms - ${allResponses.length} responses`);

    return {
      question,
      searchVolume: 0,
      category: "awareness",
      totalResponses: allResponses.length,
      responses: allResponses,
      aggregated,
    };
  }

  /**
   * Test a question on SELECTED platforms
   * Runs platforms in PARALLEL with strict per-platform timeout
   */
  async testQuestionOnPlatforms(
    question: string,
    brandName: string,
    competitors: string[] = [],
    platforms: AIPlatform[],
    testsPerPlatform?: number,
    targetCountry: string = "US"
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    console.log(`🤖 Q: "${question.substring(0, 30)}..." (${numTests}×${platforms.length}) [${targetCountry}]`);
    const startTime = Date.now();

    // Run ALL platforms in PARALLEL with individual timeouts
    const platformPromises = platforms.map(async (platform) => {
      try {
        // Strict 15-second timeout per platform
        const result = await this.withTimeout(
          this.testSinglePlatform(platform, question, brandName, competitors, numTests, targetCountry),
          15000,
          `${platform} timeout`
        );
        console.log(`  ✓ ${platform}: ${result.length}/${numTests}`);
        return result;
      } catch (error: any) {
        console.warn(`  ✗ ${platform}: ${error.message}`);
        return [] as AIResponse[];
      }
    });

    // Wait for all platforms (max ~15s total since parallel)
    const results = await Promise.all(platformPromises);
    const allResponses = results.flat();

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    console.log(`✅ ${allResponses.length} responses in ${Date.now() - startTime}ms`);

    return {
      question,
      searchVolume: 0,
      category: "awareness",
      totalResponses: allResponses.length,
      responses: allResponses,
      aggregated,
    };
  }

  /**
   * Utility: wrap a promise with a strict timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMsg)), ms);
    });
    
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  /**
   * Parallel version (not used - kept for future optimization)
   */
  private async testQuestionOnPlatformsParallel(
    question: string,
    brandName: string,
    competitors: string[] = [],
    platforms: AIPlatform[],
    testsPerPlatform?: number
  ): Promise<QuestionAnalysis> {
    const numTests = testsPerPlatform || this.testsPerPlatform;
    const startTime = Date.now();

    const platformPromises = platforms.map(platform => 
      this.testSinglePlatform(platform, question, brandName, competitors, numTests)
        .catch(() => [] as AIResponse[])
    );
    
    const results = await Promise.allSettled(platformPromises);

    // Collect successful responses
    const allResponses: AIResponse[] = [];
    results.forEach((result, index) => {
      const platform = platforms[index];
      if (result.status === "fulfilled") {
        allResponses.push(...result.value);
      } else {
        console.error(`  ⚠️ ${platform} failed: ${result.reason?.message || result.reason}`);
      }
    });

    const aggregated = this.calculateAggregatedStats(allResponses, competitors);
    console.log(`✅ [AI] Done in ${Date.now() - startTime}ms - ${allResponses.length} responses`);

    return {
      question,
      searchVolume: 0,
      category: "awareness",
      totalResponses: allResponses.length,
      responses: allResponses,
      aggregated,
    };
  }

  private async testSinglePlatform(
    platform: AIPlatform,
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number,
    targetCountry: string = "US"
  ): Promise<AIResponse[]> {
    // Use real Gemini API if available
    if (platform === "Gemini" && this.geminiClient) {
      return this.testGeminiReal(question, brandName, competitors, numTests, targetCountry);
    }

    // Use real Perplexity API if available
    if (platform === "Perplexity" && this.perplexityClient) {
      return this.testPerplexityReal(question, brandName, competitors, numTests, targetCountry);
    }

    // Country context map for natural language
    const countryNames: Record<string, string> = {
      "US": "United States", "GB": "United Kingdom", "CA": "Canada", "AU": "Australia",
      "DE": "Germany", "FR": "France", "ES": "Spain", "IT": "Italy", "NL": "Netherlands",
      "SE": "Sweden", "JP": "Japan", "KR": "South Korea", "SG": "Singapore",
      "IN": "India", "BR": "Brazil", "MX": "Mexico", "AE": "United Arab Emirates", "SA": "Saudi Arabia"
    };
    const countryName = countryNames[targetCountry] || targetCountry;
    const geoContext = `You are answering for a user in ${countryName}. Provide information relevant to this market, including local brands, availability, and cultural context where appropriate.`;

    // Use OpenAI for ChatGPT and simulated platforms if no API key
    const systemPrompts: Record<string, string> = {
      "ChatGPT": geoContext,
      "Perplexity": `You are Perplexity AI, an AI-powered answer engine. ${geoContext} Provide comprehensive, well-researched answers with citations and sources when available. Focus on accuracy and include relevant context.`,
      "Gemini": `You are Google Gemini. ${geoContext} Provide helpful, accurate, and comprehensive answers.`,
    };

    const isRealAPI = platform === "ChatGPT"; // Only ChatGPT is real when using OpenAI directly

    // Run all tests for this platform in PARALLEL
    const testPromises = Array.from({ length: numTests }, async (_, idx) => {
      const i = idx + 1;
      try {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (systemPrompts[platform]) {
          messages.push({ role: "system", content: systemPrompts[platform] });
        }
        messages.push({ role: "user", content: question });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // Increased for full responses

        const completion = await this.openaiClient.chat.completions.create(
          {
            model: "gpt-4o-mini",
            messages,
            max_tokens: 2048,  // Increased from 250 to get full responses
            temperature: 0.7,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);
        const fullResponse = completion?.choices?.[0]?.message?.content || "";
        
        if (fullResponse) {
          const analysis = this.analyzeResponse(fullResponse, brandName, competitors);
          const modelVersionMap: Record<AIPlatform, string> = {
            "ChatGPT": "gpt-4o-mini",
            "Perplexity": "gpt-4o-mini (simulated)",
            "Gemini": "gpt-4o-mini (simulated)",
          };
          
          // Extract any URLs from the response (ChatGPT sometimes includes them)
          const urlsInText = this.extractUrlsFromText(fullResponse);
          const sources: SourceCitation[] = urlsInText.map(url => ({
            url,
            domain: this.extractDomain(url),
          }));
          
          return {
            platform,
            modelVersion: modelVersionMap[platform],
            queryNumber: i,
            question,
            fullResponse,
            isRealAPI,
            hasGrounding: sources.length > 0, // ChatGPT doesn't have true grounding
            sources,
            ...analysis,
          } as AIResponse;
        }
        console.warn(`  ⚠️ [${platform}] Test ${i} returned empty response`);
        return null;
      } catch (error: any) {
        const errorDetails = {
          message: error.message,
          code: error.code,
          status: error.status,
          type: error.type,
        };
        console.error(`  ❌ [${platform}] Test ${i} FAILED:`, JSON.stringify(errorDetails, null, 2));

        // Log specific error types
        if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
          console.error(`     → Timeout error - API took too long to respond`);
        } else if (error.message?.includes('401') || error.message?.includes('authentication')) {
          console.error(`     → Authentication error - Check API key for ${platform}`);
        } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
          console.error(`     → Rate limit error - Too many requests`);
        } else if (error.message?.includes('500') || error.message?.includes('502') || error.message?.includes('503')) {
          console.error(`     → Server error - ${platform} API is experiencing issues`);
        }

        return null;
      }
    });

    const results = await Promise.all(testPromises);
    const validResults = results.filter((r): r is AIResponse => r !== null);
    
    if (validResults.length < numTests) {
      console.warn(`  ⚠️ [${platform}] Only ${validResults.length}/${numTests} tests succeeded`);
    }
    
    return validResults;
  }
  
  /**
   * Test using REAL Perplexity API
   * Perplexity has an OpenAI-compatible API with online search capabilities
   * It returns citations/sources with every response!
   */
  private async testPerplexityReal(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number,
    targetCountry: string = "US"
  ): Promise<AIResponse[]> {
    if (!this.perplexityClient) return [];

    console.log(`  🟠 [Perplexity] Starting ${numTests} REAL API calls with web search...`);

    // Country context
    const countryNames: Record<string, string> = {
      "US": "United States", "GB": "United Kingdom", "CA": "Canada", "AU": "Australia",
      "DE": "Germany", "FR": "France", "ES": "Spain", "IT": "Italy", "NL": "Netherlands",
      "SE": "Sweden", "JP": "Japan", "KR": "South Korea", "SG": "Singapore",
      "IN": "India", "BR": "Brazil", "MX": "Mexico", "AE": "United Arab Emirates", "SA": "Saudi Arabia"
    };
    const countryName = countryNames[targetCountry] || targetCountry;
    const geoContext = `You are answering for a user in ${countryName}. Provide information relevant to this market.`;

    const results: (AIResponse | null)[] = [];

    // Run sequentially to avoid rate limits
    for (let idx = 0; idx < numTests; idx++) {
      const i = idx + 1;
      try {
        console.log(`  → [Perplexity] Test ${i}/${numTests} calling API...`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const completion = await this.perplexityClient!.chat.completions.create(
          {
            model: "llama-3.1-sonar-small-128k-online", // Perplexity's online model with web search
            messages: [
              { role: "system", content: geoContext },
              { role: "user", content: question }
            ],
            max_tokens: 2048,  // Increased from 500 to get full responses
            temperature: 0.7,
          },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);
        const fullResponse = completion?.choices?.[0]?.message?.content || "";
        
        // Perplexity includes citations in the response
        // They are typically returned in the 'citations' field or embedded in the response
        const sources: SourceCitation[] = [];
        let hasGrounding = false;
        
        try {
          // Check for citations in the completion object
          const citations = (completion as any).citations || [];
          if (citations.length > 0) {
            hasGrounding = true;
            for (const citation of citations) {
              if (typeof citation === 'string') {
                sources.push({
                  url: citation,
                  domain: this.extractDomain(citation),
                });
              } else if (citation.url) {
                sources.push({
                  url: citation.url,
                  title: citation.title || '',
                  snippet: citation.snippet || '',
                  domain: this.extractDomain(citation.url),
                });
              }
            }
            console.log(`  📎 [Perplexity] Test ${i} found ${sources.length} citations`);
          }
          
          // Also extract URLs from response text (Perplexity often includes them)
          const urlsInText = this.extractUrlsFromText(fullResponse);
          for (const url of urlsInText) {
            if (!sources.some(s => s.url === url)) {
              sources.push({
                url,
                domain: this.extractDomain(url),
              });
              hasGrounding = true;
            }
          }
        } catch (citationError: any) {
          console.warn(`  ⚠️ [Perplexity] Test ${i} citation extraction failed: ${citationError.message}`);
        }
        
        if (fullResponse) {
          const mentionsBrand = fullResponse.toLowerCase().includes(brandName.toLowerCase());
          console.log(`  ✓ [Perplexity] Test ${i} OK (${fullResponse.length} chars), mentions "${brandName}": ${mentionsBrand}, sources: ${sources.length}`);
          const analysis = this.analyzeResponse(fullResponse, brandName, competitors);
          results.push({
            platform: "Perplexity" as const,
            modelVersion: "llama-3.1-sonar-small-128k-online",
            queryNumber: i,
            question,
            fullResponse,
            isRealAPI: true,
            hasGrounding,
            sources,
            ...analysis,
          } as AIResponse);
        } else {
          results.push(null);
        }
        
        // Small delay between requests
        if (idx < numTests - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(`  ❌ [Perplexity] Test ${i} ERROR: ${error.message}`);
        results.push(null);
      }
    }

    const validResults = results.filter((r): r is AIResponse => r !== null);
    
    if (validResults.length === 0) {
      console.error(`  ❌ [Perplexity] ALL ${numTests} tests FAILED`);
    } else {
      console.log(`  ✅ [Perplexity] ${validResults.length}/${numTests} tests succeeded (REAL API with citations)`);
    }
    
    return validResults;
  }

  /**
   * Test using REAL Google Gemini API via direct REST calls
   * Uses REST API instead of SDK to avoid response truncation issues
   */
  private async testGeminiReal(
    question: string,
    brandName: string,
    competitors: string[],
    numTests: number,
    targetCountry: string = "US"
  ): Promise<AIResponse[]> {
    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your-google-gemini-api-key") {
      console.warn(`⚠️ [Gemini] No valid API key available`);
      return [];
    }

    // Global timeout - fail fast if Gemini isn't working
    const globalTimeout = 45000; // 45 seconds max for all Gemini tests
    const startTime = Date.now();
    
    console.log(`  🔵 [Gemini] Starting ${numTests} tests via REST API (${globalTimeout/1000}s max)...`);

    // Country context
    const countryNames: Record<string, string> = {
      "US": "United States", "GB": "United Kingdom", "CA": "Canada", "AU": "Australia",
      "DE": "Germany", "FR": "France", "ES": "Spain", "IT": "Italy", "NL": "Netherlands",
      "SE": "Sweden", "JP": "Japan", "KR": "South Korea", "SG": "Singapore",
      "IN": "India", "BR": "Brazil", "MX": "Mexico", "AE": "United Arab Emirates", "SA": "Saudi Arabia"
    };
    const countryName = countryNames[targetCountry] || targetCountry;
    const geoContext = `You are answering for a user in ${countryName}. Provide information relevant to this market.`;
    const contextualQuestion = `${geoContext}\n\n${question}`;

    // Models to try - spread load to avoid rate limits
    const modelNames = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ];

    const results: (AIResponse | null)[] = [];
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 2;
    
    for (let idx = 0; idx < numTests; idx++) {
      const i = idx + 1;
      
      if (Date.now() - startTime > globalTimeout) {
        console.warn(`  ⚠️ [Gemini] Global timeout reached, aborting remaining tests`);
        break;
      }
      
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.warn(`  ⚠️ [Gemini] ${consecutiveFailures} consecutive failures, aborting`);
        break;
      }
      
      let fullResponse = '';
      let usedModel = '';
      const sources: SourceCitation[] = [];
      let hasGrounding = false;
      
      console.log(`  → [Gemini] Test ${i}/${numTests}...`);
      
      // Try each model until one works
      for (const modelName of modelNames) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: contextualQuestion }] }],
              generationConfig: {
                maxOutputTokens: 4096,  // Increased for full comprehensive responses
                temperature: 0.7,
              },
              // Enable Google Search grounding to get source citations
              tools: [{
                googleSearch: {}
              }],
            }),
          });
          
          const data = await response.json();
          
          if (response.ok && data.candidates?.[0]?.content?.parts) {
            // Extract full text from all parts
            const parts = data.candidates[0].content.parts;
            fullResponse = parts
              .filter((p: any) => p.text)
              .map((p: any) => p.text)
              .join('\n');
            
            usedModel = modelName;
            
            // Check for grounding metadata
            const groundingMetadata = data.candidates[0].groundingMetadata;
            if (groundingMetadata) {
              hasGrounding = true;
              const chunks = groundingMetadata.groundingChunks || [];
              for (const chunk of chunks) {
                if (chunk.web) {
                  sources.push({
                    url: chunk.web.uri || '',
                    title: chunk.web.title || '',
                    domain: this.extractDomain(chunk.web.uri || ''),
                  });
                }
              }
            }
            
            console.log(`  ✓ [Gemini] Test ${i} SUCCESS: ${modelName} (${fullResponse.length} chars)`);
            break;
          } else if (data.error?.code === 429) {
            // Rate limited - try next model
            console.warn(`     ✗ ${modelName}: Rate limited`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else if (data.error) {
            console.warn(`     ✗ ${modelName}: ${data.error.message?.substring(0, 80)}`);
            continue;
          }
        } catch (fetchError: any) {
          console.warn(`     ✗ ${modelName}: ${fetchError.message?.substring(0, 50)}`);
          continue;
        }
      }
      
      if (fullResponse && fullResponse.length > 0) {
        // Extract any URLs from the response text
        const urlsInText = this.extractUrlsFromText(fullResponse);
        for (const url of urlsInText) {
          if (!sources.some(s => s.url === url)) {
            sources.push({ url, domain: this.extractDomain(url) });
          }
        }
        
        const mentionsBrand = fullResponse.toLowerCase().includes(brandName.toLowerCase());
        console.log(`  ✓ [Gemini] Test ${i} OK (${fullResponse.length} chars), mentions "${brandName}": ${mentionsBrand}`);
        
        const analysis = this.analyzeResponse(fullResponse, brandName, competitors);
        results.push({
          platform: "Gemini" as const,
          modelVersion: usedModel,
          queryNumber: i,
          question,
          fullResponse,
          isRealAPI: true,
          hasGrounding,
          sources,
          ...analysis,
        } as AIResponse);
      } else {
        console.warn(`  ⚠️ [Gemini] Test ${i} - no response from any model`);
        results.push(null);
        consecutiveFailures++;
      }
      
      // Small delay between requests to avoid rate limiting
      if (idx < numTests - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    const validResults = results.filter((r): r is AIResponse => r !== null);
    
    const elapsed = Date.now() - startTime;
    
    if (validResults.length === 0) {
      console.error(`  ❌ [Gemini] ALL tests failed in ${elapsed}ms - models not available in this region`);
    } else if (validResults.length < numTests) {
      console.warn(`  ⚠️ [Gemini] ${validResults.length}/${numTests} tests succeeded`);
    } else {
      console.log(`  ✅ [Gemini] All ${numTests} tests succeeded (REAL API with grounding)`);
    }
    
    return validResults;
  }
  
  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }
  
  /**
   * Extract URLs from text
   */
  private extractUrlsFromText(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const matches = text.match(urlRegex) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  private analyzeResponse(
    response: string,
    brandName: string,
    competitors: string[]
  ): Omit<AIResponse, 'platform' | 'modelVersion' | 'queryNumber' | 'question' | 'fullResponse' | 'isRealAPI' | 'hasGrounding' | 'sources'> {
    const lowerResponse = response.toLowerCase();
    const lowerBrand = brandName.toLowerCase();
    const brandMentioned = lowerResponse.includes(lowerBrand);

    let brandPosition: number | null = null;
    let contextExtract: string | null = null;

    if (brandMentioned) {
      const allBrands = [brandName, ...competitors];
      const brandMentions: { brand: string; index: number }[] = [];

      allBrands.forEach((brand) => {
        const regex = new RegExp(`\\b${this.escapeRegex(brand)}\\b`, "gi");
        let match;
        while ((match = regex.exec(response)) !== null) {
          brandMentions.push({ brand: brand.toLowerCase(), index: match.index });
        }
      });

      brandMentions.sort((a, b) => a.index - b.index);
      const brandFirstMention = brandMentions.findIndex(m => m.brand === lowerBrand);
      brandPosition = brandFirstMention >= 0 ? brandFirstMention + 1 : null;

      const brandIndex = lowerResponse.indexOf(lowerBrand);
      if (brandIndex !== -1) {
        const start = Math.max(0, brandIndex - 50);
        const end = Math.min(response.length, brandIndex + brandName.length + 200);
        contextExtract = response.substring(start, end).trim();
        if (start > 0) contextExtract = "..." + contextExtract;
        if (end < response.length) contextExtract = contextExtract + "...";
      }
    }

    const sentiment = this.analyzeSentiment(response, brandName, brandMentioned);
    const competitorsMentioned = competitors.filter(c => lowerResponse.includes(c.toLowerCase()));
    const citedUrls = response.match(/(https?:\/\/[^\s]+)/g) || [];

    return {
      brandMentioned,
      brandPosition,
      contextExtract,
      sentiment,
      recommendationType: brandMentioned ? "listed" : null,
      competitorsMentioned,
      citedUrls,
    };
  }

  private analyzeSentiment(response: string, brandName: string, brandMentioned: boolean): "positive" | "neutral" | "negative" {
    if (!brandMentioned) return "neutral";

    const sentences = response.split(/[.!?]+/).filter(s => s.toLowerCase().includes(brandName.toLowerCase()));
    if (sentences.length === 0) return "neutral";

    const positiveWords = ["best", "excellent", "great", "recommended", "top", "leading", "popular", "trusted", "quality", "innovative"];
    const negativeWords = ["expensive", "overpriced", "avoid", "poor", "disappointing", "concerns", "issues", "problems"];

    let positiveScore = 0, negativeScore = 0;
    sentences.forEach(s => {
      const lower = s.toLowerCase();
      positiveWords.forEach(w => { if (lower.includes(w)) positiveScore++; });
      negativeWords.forEach(w => { if (lower.includes(w)) negativeScore++; });
    });

    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private calculateAggregatedStats(responses: AIResponse[], competitors: string[]): QuestionAnalysis["aggregated"] {
    const total = responses.length;
    const mentioned = responses.filter(r => r.brandMentioned).length;
    const mentionRate = total > 0 ? (mentioned / total) * 100 : 0;

    const positions = responses.filter(r => r.brandPosition !== null).map(r => r.brandPosition as number);
    const avgPosition = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null;

    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    responses.forEach(r => { sentimentCounts[r.sentiment]++; });

    const sentimentTotal = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);
    let dominant: "positive" | "neutral" | "negative" = "neutral";
    const positivePct = sentimentTotal > 0 ? Math.round((sentimentCounts.positive / sentimentTotal) * 1000) / 10 : 0;
    const neutralPct = sentimentTotal > 0 ? Math.round((sentimentCounts.neutral / sentimentTotal) * 1000) / 10 : 0;
    const negativePct = sentimentTotal > 0 ? Math.round((sentimentCounts.negative / sentimentTotal) * 1000) / 10 : 0;

    if (positivePct > neutralPct && positivePct > negativePct) {
      dominant = "positive";
    } else if (negativePct > neutralPct) {
      dominant = "negative";
    }

    const sentimentBreakdown = {
      positive: positivePct,
      neutral: neutralPct,
      negative: negativePct,
      dominant,
    };

    const competitorMentions: { [c: string]: number } = {};
    competitors.forEach(c => { competitorMentions[c] = responses.filter(r => r.competitorsMentioned.includes(c)).length; });

    const platforms: AIPlatform[] = ["ChatGPT", "Gemini", "Perplexity"];
    const platformBreakdown = platforms.map(platform => {
      const pr = responses.filter(r => r.platform === platform);
      const pm = pr.filter(r => r.brandMentioned).length;
      const pp = pr.filter(r => r.brandPosition !== null).map(r => r.brandPosition as number);
      return {
        platform,
        totalTests: pr.length,
        mentionCount: pm,
        mentionRate: pr.length > 0 ? Math.round((pm / pr.length) * 1000) / 10 : 0,
        avgPosition: pp.length > 0 ? Math.round((pp.reduce((a, b) => a + b, 0) / pp.length) * 10) / 10 : null,
        sentimentCounts: {
          positive: pr.filter(r => r.sentiment === "positive").length,
          neutral: pr.filter(r => r.sentiment === "neutral").length,
          negative: pr.filter(r => r.sentiment === "negative").length,
        },
      };
    });

    return {
      mentionRate: Math.round(mentionRate * 10) / 10,
      avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      sentimentBreakdown,
      competitorMentions,
      platformBreakdown,
    };
  }
}
