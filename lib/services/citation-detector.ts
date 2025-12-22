/**
 * Citation Detection Service
 * 
 * Detects and extracts citations from different LLM responses.
 * Each LLM has different citation capabilities and formats.
 */

export interface DetectedCitation {
  url?: string;
  domain: string;
  title?: string;
  type: 'native' | 'grounding' | 'implicit' | 'domain_mention';
  confidence: 'high' | 'medium' | 'low';
  source: string; // The LLM that provided this
}

export interface CitationAnalysis {
  citations: DetectedCitation[];
  brandDomainCited: boolean;
  brandContentCited: boolean;
  citationRate: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  llmCitationSupport: 'native' | 'partial' | 'heuristic';
}

/**
 * LLM-specific citation extractors
 */
export const CITATION_EXTRACTORS = {
  /**
   * Perplexity - Best citation support
   * Returns native citations in structured format
   */
  perplexity: {
    hasNativeCitations: true,
    confidence: 'high' as const,
    
    extract: (response: any): DetectedCitation[] => {
      const citations: DetectedCitation[] = [];
      
      // Perplexity includes citations array in response
      if (response.citations && Array.isArray(response.citations)) {
        for (const citation of response.citations) {
          citations.push({
            url: citation.url || citation.link,
            domain: extractDomainFromUrl(citation.url || citation.link || ''),
            title: citation.title,
            type: 'native',
            confidence: 'high',
            source: 'perplexity',
          });
        }
      }
      
      // Also check for sources in response
      if (response.sources && Array.isArray(response.sources)) {
        for (const source of response.sources) {
          const url = source.url || source.link || '';
          if (url && !citations.some(c => c.url === url)) {
            citations.push({
              url,
              domain: extractDomainFromUrl(url),
              title: source.title || source.name,
              type: 'native',
              confidence: 'high',
              source: 'perplexity',
            });
          }
        }
      }
      
      return citations;
    },
  },
  
  /**
   * Gemini - Partial citation support via grounding
   * Requires grounding to be enabled for citations
   */
  gemini: {
    hasNativeCitations: 'partial' as const,
    confidence: 'medium' as const,
    
    extract: (response: any): DetectedCitation[] => {
      const citations: DetectedCitation[] = [];
      
      // Check for grounding metadata (if available)
      const groundingMetadata = response.groundingMetadata || 
                                response.candidates?.[0]?.groundingMetadata;
      
      if (groundingMetadata) {
        // Web search queries
        const webSearchQueries = groundingMetadata.webSearchQueries || [];
        
        // Grounding chunks (actual sources)
        const groundingChunks = groundingMetadata.groundingChunks || [];
        for (const chunk of groundingChunks) {
          if (chunk.web) {
            citations.push({
              url: chunk.web.uri || '',
              domain: extractDomainFromUrl(chunk.web.uri || ''),
              title: chunk.web.title || '',
              type: 'grounding',
              confidence: 'medium',
              source: 'gemini',
            });
          }
        }
        
        // Grounding supports
        const groundingSupports = groundingMetadata.groundingSupports || [];
        for (const support of groundingSupports) {
          if (support.groundingChunkIndices && support.segment) {
            // This maps text segments to sources
            // Can be used for more granular citation tracking
          }
        }
      }
      
      return citations;
    },
  },
  
  /**
   * ChatGPT - No native citation API
   * Uses heuristic extraction from response text
   */
  chatgpt: {
    hasNativeCitations: false,
    confidence: 'low' as const,
    
    extract: (response: any): DetectedCitation[] => {
      const content = typeof response === 'string' ? response : response.content || response.text || '';
      return extractImplicitCitations(content, 'chatgpt');
    },
  },
  
  /**
   * Copilot - Partial citation support
   * Sometimes includes web results
   */
  copilot: {
    hasNativeCitations: 'partial' as const,
    confidence: 'medium' as const,
    
    extract: (response: any): DetectedCitation[] => {
      const citations: DetectedCitation[] = [];
      
      // Check for web results
      const webResults = response.webResults || response.web_results || [];
      for (const result of webResults) {
        citations.push({
          url: result.url || result.link,
          domain: extractDomainFromUrl(result.url || result.link || ''),
          title: result.title || result.name,
          type: 'native',
          confidence: 'medium',
          source: 'copilot',
        });
      }
      
      // If no native results, try heuristic
      if (citations.length === 0) {
        const content = typeof response === 'string' ? response : response.content || response.text || '';
        return extractImplicitCitations(content, 'copilot');
      }
      
      return citations;
    },
  },
};

/**
 * Extract domain from URL
 */
function extractDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    // Try to extract domain pattern from malformed URL
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
    return match ? match[1] : '';
  }
}

/**
 * Heuristic citation extraction for LLMs without native citations
 */
function extractImplicitCitations(content: string, source: string): DetectedCitation[] {
  const citations: DetectedCitation[] = [];
  
  // Pattern 1: "according to [source]"
  const accordingToPattern = /according to ([A-Za-z0-9\s.]+(?:\.com|\.org|\.net|\.edu)?)/gi;
  let match;
  while ((match = accordingToPattern.exec(content)) !== null) {
    const sourceText = match[1].trim();
    const domain = extractDomainIfPresent(sourceText);
    if (domain || sourceText.length > 2) {
      citations.push({
        domain: domain || normalizeSourceName(sourceText),
        title: sourceText,
        type: 'implicit',
        confidence: 'low',
        source,
      });
    }
  }
  
  // Pattern 2: "based on [source]'s data/research/study"
  const basedOnPattern = /based on (?:data from |information from |research by )?([A-Za-z0-9\s.]+)/gi;
  while ((match = basedOnPattern.exec(content)) !== null) {
    const sourceText = match[1].trim();
    if (sourceText.length > 2 && !citations.some(c => c.domain === normalizeSourceName(sourceText))) {
      citations.push({
        domain: normalizeSourceName(sourceText),
        title: sourceText,
        type: 'implicit',
        confidence: 'low',
        source,
      });
    }
  }
  
  // Pattern 3: Domain mentions "[domain]'s research shows" or "[domain] reports"
  const domainPattern = /([a-zA-Z0-9-]+\.(?:com|org|net|edu|io|co))(?:'s)?\s+(?:research|study|data|report|article|website)/gi;
  while ((match = domainPattern.exec(content)) !== null) {
    const domain = match[1].toLowerCase();
    if (!citations.some(c => c.domain === domain)) {
      citations.push({
        domain,
        type: 'domain_mention',
        confidence: 'medium',
        source,
      });
    }
  }
  
  // Pattern 4: Explicit URLs in text
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[0];
    const domain = extractDomainFromUrl(url);
    if (domain && !citations.some(c => c.url === url)) {
      citations.push({
        url,
        domain,
        type: 'implicit',
        confidence: 'medium',
        source,
      });
    }
  }
  
  return citations;
}

/**
 * Extract domain if present in source text
 */
function extractDomainIfPresent(text: string): string | null {
  const domainMatch = text.match(/([a-zA-Z0-9-]+\.(?:com|org|net|edu|io|co))/i);
  return domainMatch ? domainMatch[1].toLowerCase() : null;
}

/**
 * Normalize source name to a consistent format
 */
function normalizeSourceName(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 30);
}

/**
 * Analyze citations for a response and check for brand domain
 */
export function analyzeCitations(
  response: any,
  platform: 'chatgpt' | 'gemini' | 'copilot' | 'perplexity',
  brandDomain: string,
  brandName: string
): CitationAnalysis {
  const extractor = CITATION_EXTRACTORS[platform];
  const citations = extractor.extract(response);
  
  // Normalize brand domain for comparison
  const normalizedBrandDomain = brandDomain.toLowerCase().replace(/^www\./, '');
  const normalizedBrandName = brandName.toLowerCase();
  
  // Check if brand domain is cited
  const brandDomainCited = citations.some(c => {
    const citedDomain = c.domain.toLowerCase();
    return citedDomain === normalizedBrandDomain ||
           citedDomain.includes(normalizedBrandDomain) ||
           normalizedBrandDomain.includes(citedDomain);
  });
  
  // Check if brand content is cited (brand name appears in citation title/domain)
  const brandContentCited = citations.some(c => {
    const citedDomain = c.domain.toLowerCase();
    const citedTitle = (c.title || '').toLowerCase();
    return citedDomain.includes(normalizedBrandName) ||
           citedTitle.includes(normalizedBrandName);
  });
  
  // Calculate citation rate (normalized 0-100)
  // More citations = higher rate, but capped
  const citationRate = Math.min(100, citations.length * 20);
  
  return {
    citations,
    brandDomainCited,
    brandContentCited,
    citationRate,
    confidence: extractor.confidence,
    llmCitationSupport: extractor.hasNativeCitations === true ? 'native' : 
                        extractor.hasNativeCitations === 'partial' ? 'partial' : 'heuristic',
  };
}

/**
 * Calculate awareness score based on citations
 * For awareness stage, citations matter more than mentions
 */
export function calculateAwarenessScoreFromCitations(
  citationAnalyses: CitationAnalysis[],
  brandMentioned: boolean,
  sentiment: 'positive' | 'neutral' | 'negative'
): {
  score: number;
  breakdown: {
    citationScore: number;
    mentionScore: number;
    sentimentScore: number;
  };
} {
  // Calculate average citation metrics
  let totalCitations = 0;
  let brandCitedCount = 0;
  
  for (const analysis of citationAnalyses) {
    totalCitations += analysis.citations.length;
    if (analysis.brandDomainCited || analysis.brandContentCited) {
      brandCitedCount++;
    }
  }
  
  // Citation score (60% weight for awareness)
  // If brand domain is cited as source, that's the best signal
  const citationScore = citationAnalyses.length > 0
    ? (brandCitedCount / citationAnalyses.length) * 100
    : 0;
  
  // Mention score (25% weight)
  const mentionScore = brandMentioned ? 100 : 0;
  
  // Sentiment score (15% weight)
  const sentimentScore = sentiment === 'positive' ? 100 :
                         sentiment === 'neutral' ? 50 : 0;
  
  // Weighted calculation for awareness stage
  const score = Math.round(
    (citationScore * 0.60) +
    (mentionScore * 0.25) +
    (sentimentScore * 0.15)
  );
  
  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown: {
      citationScore: Math.round(citationScore),
      mentionScore,
      sentimentScore,
    },
  };
}
