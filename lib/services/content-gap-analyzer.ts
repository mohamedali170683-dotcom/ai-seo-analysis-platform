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
  /** ISO-639-1 best-guess language code from heuristic word matching. */
  language: string | null;
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
  /** True when cited and brand pages are in different languages. */
  languageMismatch: boolean;
  /** Human-readable warning when comparison reliability is reduced. */
  warning?: string;
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
      return { url, ok: false, title: "", text: "", wordCount: 0, language: null, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "";
    // Prefer the <html lang="..."> attribute when present — it's the authoritative
    // signal. Fall back to text-based heuristic detection.
    const htmlLangMatch = html.match(/<html[^>]*\blang=["']([a-zA-Z-]+)["']/i);
    const declaredLang = htmlLangMatch?.[1]?.slice(0, 2).toLowerCase() || null;
    const text = htmlToText(html);
    const language = declaredLang || detectLanguage(text);

    return {
      url,
      ok: text.length > 200,
      title,
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      language,
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
      language: null,
      error: err.name === "AbortError" ? `Timeout after ${FETCH_TIMEOUT_MS}ms` : err.message,
    };
  }
}

/**
 * Cheap stop-word-frequency language detector. Good enough to flag obvious
 * EN/DE/ES/FR/IT/PT/NL mismatches; not a replacement for a real language
 * detector. Returns null when nothing matches confidently.
 */
function detectLanguage(text: string): string | null {
  const sample = text.toLowerCase().slice(0, 4000);
  const words = sample.match(/\b[a-zà-ÿß]{2,}\b/g) || [];
  if (words.length < 30) return null;

  const stopwords: Record<string, string[]> = {
    en: ["the", "and", "for", "with", "this", "that", "are", "from", "have", "you", "your"],
    de: ["und", "der", "die", "das", "ist", "mit", "den", "für", "auf", "nicht", "ein", "eine"],
    es: ["que", "los", "las", "para", "con", "una", "del", "por", "como", "más", "este"],
    fr: ["les", "des", "une", "dans", "pour", "que", "qui", "avec", "sur", "vous", "est"],
    it: ["che", "non", "per", "con", "una", "del", "alla", "sono", "più", "come", "anche"],
    pt: ["que", "para", "com", "uma", "dos", "das", "como", "por", "mais", "este", "está"],
    nl: ["een", "het", "van", "voor", "met", "niet", "ook", "naar", "deze", "wordt", "zijn"],
  };

  const counts: Record<string, number> = {};
  for (const [lang, list] of Object.entries(stopwords)) {
    counts[lang] = words.filter(w => list.includes(w)).length;
  }
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  const [topLang, topCount] = sorted[0];
  const [, runnerUpCount] = sorted[1] || ["", 0];

  // Need at least 5 hits AND a clear lead over the runner-up to call it.
  if (topCount < 5 || topCount < runnerUpCount * 1.5) return null;
  return topLang;
}

/**
 * Strip HTML to plain text. Cheap regex-based — no DOM parser dependency.
 * Removes script/style/nav/footer/aside/header blocks, then strips elements
 * whose class or id signals boilerplate (share/social/breadcrumb/cookie/
 * sidebar/widget/comment/subscribe), then collapses whitespace.
 *
 * Why class-based: many sites (Motherhood Center, most CMS templates) put
 * navigation, share buttons, and footer content in plain `<div>`s, not
 * semantic tags, so element-name stripping alone misses them.
 */
function htmlToText(html: string): string {
  let body = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) body = bodyMatch[1];

  // First pass: strip whole blocks by tag name.
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
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Second pass: strip <div>/<section>/<ul>/<ol> blocks whose class or id
  // matches a boilerplate keyword. Non-greedy match against the matching
  // closing tag — imperfect for nested structures, but cheap and effective.
  const boilerplatePattern =
    "(?:nav|menu|footer|header|breadcrumb|sidebar|widget|share|social|cookie|consent|banner|subscribe|newsletter|comment(?:s|-form)?|related-?posts?|popular-?posts?|tags?-?cloud|cta|promo|advert|ad-)";
  const blockTags = ["div", "section", "ul", "ol", "aside"];
  for (const tag of blockTags) {
    const re = new RegExp(
      `<${tag}\\b[^>]*\\b(?:class|id)=["'][^"']*${boilerplatePattern}[^"']*["'][^>]*>[\\s\\S]*?</${tag}>`,
      "gi"
    );
    // Run twice — strips non-overlapping matches that emerge after the first pass.
    body = body.replace(re, " ").replace(re, " ");
  }

  // Strip remaining tags and decode entities first — Wikipedia's [edit]
  // markers and [N] references are wrapped in <a>/<sup> tags, so they only
  // appear as plain "[ edit ]" / "[ 12 ]" after tag removal.
  body = body
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
    });

  // Now that tags are gone, kill Wikipedia [edit] / [N] reference markers
  // and other common encyclopedia lead-ins.
  body = body
    .replace(/\[\s*edit\s*\]/gi, " ")
    .replace(/\[\s*\d+\s*\]/g, " ")
    .replace(/Jump to content/gi, " ")
    .replace(/From Wikipedia,\s*the free encyclopedia/gi, " ");

  return body.replace(/\s+/g, " ").trim().slice(0, MAX_CHARS_PER_PAGE);
}

/**
 * Heuristically reject chunks that are mostly boilerplate (opening hours
 * tables, share-button runs, address blocks, link soup). These would
 * otherwise pollute the "missing topics" list with garbage like opening
 * hours or "Share Tweet Share Pin" sequences.
 */
function isBoilerplateChunk(chunk: string): boolean {
  const text = chunk.trim();
  const lower = text.toLowerCase();

  // Opening hours: 3+ "9:00 am" / "5.30 pm" tokens
  const hourMatches = lower.match(/\b\d{1,2}[:.]\d{2}\s*(?:am|pm)\b/g) || [];
  if (hourMatches.length >= 3) return true;

  // Share-button runs: "share tweet", "tweet share", "share pin", "share email"
  if (/\bshare\b.{0,30}\b(?:tweet|pin|email|copy|reddit|whatsapp)\b/i.test(text)) return true;
  if (/\b(?:tweet|pin)\b.{0,30}\bshare\b/i.test(text)) return true;

  // Lots of "Previous Post", "Next Post", "Related Posts", "Categories" markers
  const navMarkers = (lower.match(/\b(?:previous post|next post|related posts?|categories|tags?-?cloud|read more|skip to)\b/g) || []).length;
  if (navMarkers >= 2) return true;

  // Address-only chunks: a US/EU street pattern with ZIP or postcode and very few sentences
  if (/\b(?:suite|ste\.?|floor|fl\.?)\s*\d+/i.test(text) && (text.match(/[.!?]/g) || []).length < 2) {
    return true;
  }

  // Link-soup chunk: too many short tokens separated by single spaces, low
  // sentence punctuation density. A real prose paragraph has roughly one
  // period per ~150 chars; a link list has near-zero.
  const sentenceCount = (text.match(/[.!?]/g) || []).length;
  if (text.length > 300 && sentenceCount === 0) return true;

  // Mostly non-letters (lots of numbers, punctuation, list markers)
  const letters = (text.match(/[a-zA-Zà-ÿ]/g) || []).length;
  if (letters / text.length < 0.55) return true;

  return false;
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

  return chunks.filter(c => c.length >= 80 && !isBoilerplateChunk(c));
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
    citedSource: { url: citedSourceUrl, ok: false, title: "", text: "", wordCount: 0, language: null },
    brandSource: { url: brandUrl, ok: false, title: "", text: "", wordCount: 0, language: null },
    coverageScore: 0,
    averageSimilarity: 0,
    matchThreshold: MATCH_THRESHOLD,
    missingTopics: [],
    matchedTopics: [],
    chunksCompared: { source: 0, brand: 0 },
    languageMismatch: false,
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

    // Detect language mismatch BEFORE embedding so we can warn even when the
    // score itself is non-zero. Cross-lingual embeddings exist but degrade
    // the signal — surfacing this lets users interpret the score correctly.
    const languageMismatch =
      !!citedSource.language &&
      !!brandSource.language &&
      citedSource.language !== brandSource.language;
    const warning = languageMismatch
      ? `Cited source is in ${langName(citedSource.language!)} but the brand page is in ${langName(brandSource.language!)} — coverage score may underestimate actual content overlap. Consider comparing against a same-language brand page.`
      : undefined;

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
    // Only surface "already covered well" for chunks that actually crossed the
    // match threshold. Otherwise we'd show "you cover this" with sim=0.45,
    // which is misleading — if nothing crossed, the answer is "nothing
    // meaningfully covered."
    const matchedTopics: GapTopic[] = sortedDesc
      .filter(s => s.bestBrandSimilarity >= MATCH_THRESHOLD)
      .slice(0, 3)
      .map(s => ({
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
      languageMismatch,
      warning,
      ok: true,
    };
  } catch (err: any) {
    return { ...empty, error: err.message || "Unknown error during gap analysis" };
  }
}

function langName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    de: "German",
    es: "Spanish",
    fr: "French",
    it: "Italian",
    pt: "Portuguese",
    nl: "Dutch",
  };
  return names[code] || code.toUpperCase();
}

function condenseExcerpt(chunk: string, maxLen = 220): string {
  const trimmed = chunk.replace(/\s+/g, " ").trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
