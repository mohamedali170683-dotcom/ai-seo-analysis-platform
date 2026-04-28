/**
 * Cited-Source Content Gap Analyzer
 *
 * For a given funnel stage, compares the brand's website content against the
 * most-cited authoritative source for AI answers. Uses embeddings to find
 * topics covered by the cited source that are missing on the brand site.
 *
 * Output is intentionally narrow: a coverage score plus a small list of
 * specific topical gaps the brand can close with new content.
 */

import OpenAI from "openai";

export interface ScrapedPage {
  url: string;
  ok: boolean;
  title: string;
  text: string;
  wordCount: number;
  error?: string;
}

export interface GapTopic {
  excerpt: string;
  bestBrandSimilarity: number;
}

export interface ContentGapResult {
  citedSource: ScrapedPage;
  brandSource: ScrapedPage;
  coverageScore: number;
  averageSimilarity: number;
  matchThreshold: number;
  missingTopics: GapTopic[];
  matchedTopics: GapTopic[];
  chunksCompared: { source: number; brand: number };
  ok: boolean;
  error?: string;
}

const FETCH_TIMEOUT_MS = 12000;
const MAX_CHARS_PER_PAGE = 80_000;
const TARGET_CHUNK_CHARS = 1200;
const MAX_CHUNKS_PER_PAGE = 30;
const MATCH_THRESHOLD = 0.72;
const EMBED_MODEL = "text-embedding-3-small";

/**
 * Fetch a URL and extract clean readable text. Strips scripts, styles, nav,
 * footer, and inline whitespace. Returns the first ~MAX_CHARS_PER_PAGE chars
 * of body content.
 */
export async function fetchAndExtractText(url: string): Promise<ScrapedPage> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VelarisGapAnalyzer/1.0; +https://velaris.io)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { url, ok: false, title: "", text: "", wordCount: 0, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "";
    const text = htmlToText(html);

    return {
      url,
      ok: text.length > 200,
      title,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      error: text.length <= 200 ? "Page returned too little readable text" : undefined,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      url,
      ok: false,
      title: "",
      text: "",
      wordCount: 0,
      error: err.name === "AbortError" ? `Timeout after ${FETCH_TIMEOUT_MS}ms` : err.message,
    };
  }
}

/**
 * Strip HTML to plain text. Cheap regex-based — no DOM parser dependency.
 * Removes script/style/nav/footer/aside/header blocks then collapses whitespace.
 */
function htmlToText(html: string): string {
  let body = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) body = bodyMatch[1];

  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_m, code) => {
      const n = parseInt(code, 10);
      return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : " ";
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => {
      const n = parseInt(hex, 16);
      return Number.isFinite(n) && n > 0 && n < 0x10ffff ? String.fromCodePoint(n) : " ";
    })
    .replace(/\s+/g, " ")
    .trim();

  return body.slice(0, MAX_CHARS_PER_PAGE);
}

/**
 * Split text into ~TARGET_CHUNK_CHARS chunks on sentence boundaries.
 * Capped at MAX_CHUNKS_PER_PAGE to keep embedding cost bounded.
 */
export function chunkText(text: string): string[] {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    if ((buffer + sentence).length > TARGET_CHUNK_CHARS && buffer.length > 0) {
      chunks.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer += sentence;
    }
    if (chunks.length >= MAX_CHUNKS_PER_PAGE) break;
  }
  if (buffer.trim().length > 0 && chunks.length < MAX_CHUNKS_PER_PAGE) {
    chunks.push(buffer.trim());
  }

  return chunks.filter(c => c.length >= 80);
}

/**
 * Embed an array of texts in a single OpenAI call.
 */
export async function embedTexts(
  texts: string[],
  apiKey: string
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 });
  const response = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: texts,
  });
  return response.data.map(d => d.embedding as number[]);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Run the full gap analysis: scrape both sides, embed, score.
 * Returns a result with ok=false (and a populated error) on any failure mode
 * the caller can surface gracefully — never throws.
 */
export async function computeContentGap(
  citedSourceUrl: string,
  brandUrl: string,
  apiKey: string
): Promise<ContentGapResult> {
  const empty: ContentGapResult = {
    citedSource: { url: citedSourceUrl, ok: false, title: "", text: "", wordCount: 0 },
    brandSource: { url: brandUrl, ok: false, title: "", text: "", wordCount: 0 },
    coverageScore: 0,
    averageSimilarity: 0,
    matchThreshold: MATCH_THRESHOLD,
    missingTopics: [],
    matchedTopics: [],
    chunksCompared: { source: 0, brand: 0 },
    ok: false,
  };

  try {
    const [citedSource, brandSource] = await Promise.all([
      fetchAndExtractText(citedSourceUrl),
      fetchAndExtractText(brandUrl),
    ]);

    if (!citedSource.ok || !brandSource.ok) {
      return {
        ...empty,
        citedSource,
        brandSource,
        error: !citedSource.ok
          ? `Could not scrape cited source: ${citedSource.error}`
          : `Could not scrape brand page: ${brandSource.error}`,
      };
    }

    const sourceChunks = chunkText(citedSource.text);
    const brandChunks = chunkText(brandSource.text);

    if (sourceChunks.length === 0 || brandChunks.length === 0) {
      return {
        ...empty,
        citedSource,
        brandSource,
        error: "Not enough content to compare after chunking",
      };
    }

    const allTexts = [...sourceChunks, ...brandChunks];
    const embeddings = await embedTexts(allTexts, apiKey);
    const sourceVectors = embeddings.slice(0, sourceChunks.length);
    const brandVectors = embeddings.slice(sourceChunks.length);

    const perChunkScores: { chunk: string; bestBrandSimilarity: number }[] = sourceChunks.map(
      (chunk, i) => {
        let best = 0;
        for (const bv of brandVectors) {
          const sim = cosineSimilarity(sourceVectors[i], bv);
          if (sim > best) best = sim;
        }
        return { chunk, bestBrandSimilarity: best };
      }
    );

    const matchedCount = perChunkScores.filter(s => s.bestBrandSimilarity >= MATCH_THRESHOLD).length;
    const coverageScore = Math.round((matchedCount / perChunkScores.length) * 100);
    const averageSimilarity =
      perChunkScores.reduce((sum, s) => sum + s.bestBrandSimilarity, 0) / perChunkScores.length;

    const sortedAsc = [...perChunkScores].sort((a, b) => a.bestBrandSimilarity - b.bestBrandSimilarity);
    const sortedDesc = [...perChunkScores].sort((a, b) => b.bestBrandSimilarity - a.bestBrandSimilarity);

    const missingTopics: GapTopic[] = sortedAsc.slice(0, 5).map(s => ({
      excerpt: condenseExcerpt(s.chunk),
      bestBrandSimilarity: round(s.bestBrandSimilarity),
    }));
    const matchedTopics: GapTopic[] = sortedDesc.slice(0, 3).map(s => ({
      excerpt: condenseExcerpt(s.chunk),
      bestBrandSimilarity: round(s.bestBrandSimilarity),
    }));

    return {
      citedSource,
      brandSource,
      coverageScore,
      averageSimilarity: round(averageSimilarity),
      matchThreshold: MATCH_THRESHOLD,
      missingTopics,
      matchedTopics,
      chunksCompared: { source: sourceChunks.length, brand: brandChunks.length },
      ok: true,
    };
  } catch (err: any) {
    return { ...empty, error: err.message || "Unknown error during gap analysis" };
  }
}

function condenseExcerpt(chunk: string, maxLen = 220): string {
  const trimmed = chunk.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
