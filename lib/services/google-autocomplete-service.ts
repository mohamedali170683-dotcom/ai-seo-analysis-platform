/**
 * Google Autocomplete Service
 * Gets REAL search suggestions that people actually search for
 * FREE and fast - no API key required
 */

export interface GoogleSuggestion {
  query: string;
  type: "awareness" | "consideration" | "decision";
  source: "google_autocomplete";
}

export class GoogleAutocompleteService {
  private baseUrl = "https://suggestqueries.google.com/complete/search";

  /**
   * Get real questions from Google Autocomplete
   */
  async getQuestions(brandName: string, competitor?: string): Promise<GoogleSuggestion[]> {
    console.log(`🔍 [GOOGLE] Fetching real questions for: ${brandName}`);
    const startTime = Date.now();
    
    const allSuggestions: GoogleSuggestion[] = [];

    // AWARENESS stage queries
    const awarenessQueries = [
      `what is ${brandName}`,
      `is ${brandName}`,
      `why ${brandName}`,
    ];

    // CONSIDERATION stage queries
    const considerationQueries = [
      `${brandName} reviews`,
      `${brandName} vs`,
      `best ${brandName}`,
      competitor ? `${brandName} vs ${competitor}` : `${brandName} alternatives`,
    ];

    // DECISION stage queries
    const decisionQueries = [
      `buy ${brandName}`,
      `${brandName} price`,
      `where to buy ${brandName}`,
    ];

    // Fetch awareness suggestions
    for (const query of awarenessQueries) {
      try {
        const suggestions = await this.fetchSuggestions(query);
        suggestions.slice(0, 3).forEach(s => {
          if (this.isQuestion(s) && s.toLowerCase().includes(brandName.toLowerCase())) {
            allSuggestions.push({ query: s, type: "awareness", source: "google_autocomplete" });
          }
        });
      } catch (e) {
        console.error(`  ⚠️ Failed to fetch: ${query}`);
      }
    }

    // Fetch consideration suggestions
    for (const query of considerationQueries) {
      try {
        const suggestions = await this.fetchSuggestions(query);
        suggestions.slice(0, 3).forEach(s => {
          if (s.toLowerCase().includes(brandName.toLowerCase())) {
            allSuggestions.push({ query: s, type: "consideration", source: "google_autocomplete" });
          }
        });
      } catch (e) {
        console.error(`  ⚠️ Failed to fetch: ${query}`);
      }
    }

    // Fetch decision suggestions
    for (const query of decisionQueries) {
      try {
        const suggestions = await this.fetchSuggestions(query);
        suggestions.slice(0, 3).forEach(s => {
          if (s.toLowerCase().includes(brandName.toLowerCase())) {
            allSuggestions.push({ query: s, type: "decision", source: "google_autocomplete" });
          }
        });
      } catch (e) {
        console.error(`  ⚠️ Failed to fetch: ${query}`);
      }
    }

    // Remove duplicates
    const uniqueSuggestions = this.removeDuplicates(allSuggestions);
    
    console.log(`✅ [GOOGLE] Got ${uniqueSuggestions.length} real questions in ${Date.now() - startTime}ms`);
    return uniqueSuggestions;
  }

  /**
   * Fetch suggestions from Google Autocomplete API
   */
  private async fetchSuggestions(query: string): Promise<string[]> {
    const url = `${this.baseUrl}?client=firefox&q=${encodeURIComponent(query)}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      // Response format: [query, [suggestions], [], {}]
      return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Timeout');
      }
      throw error;
    }
  }

  /**
   * Check if a suggestion is question-like
   */
  private isQuestion(text: string): boolean {
    const questionStarters = ['what', 'why', 'how', 'is', 'are', 'can', 'does', 'do', 'should', 'which', 'where', 'when'];
    const lower = text.toLowerCase();
    return questionStarters.some(q => lower.startsWith(q)) || text.includes('?');
  }

  /**
   * Remove duplicate suggestions
   */
  private removeDuplicates(suggestions: GoogleSuggestion[]): GoogleSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
      const key = s.query.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
