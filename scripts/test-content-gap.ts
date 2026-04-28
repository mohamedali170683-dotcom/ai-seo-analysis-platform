/**
 * Smoke test for the content gap analyzer.
 *
 * Runs computeContentGap() against a real URL pair and prints the result.
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/test-content-gap.ts
 *   OPENAI_API_KEY=sk-... npx tsx scripts/test-content-gap.ts <citedSourceUrl> <brandUrl>
 *
 * Default pair: Wikipedia Pampers article vs pampers.com homepage.
 */

import { computeContentGap, fetchAndExtractText, chunkText, cosineSimilarity } from "../lib/services/content-gap-analyzer";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("✘ Missing OPENAI_API_KEY");
    process.exit(1);
  }

  const citedSourceUrl = process.argv[2] || "https://en.wikipedia.org/wiki/Pampers";
  const brandUrl = process.argv[3] || "https://www.pampers.com/en-us/about-us";

  console.log("─── Pure-function self-checks ───");
  const v1 = [1, 0, 0];
  const v2 = [0, 1, 0];
  const v3 = [1, 0, 0];
  console.log(`cosine(orthogonal)=${cosineSimilarity(v1, v2)} (expect 0)`);
  console.log(`cosine(identical) =${cosineSimilarity(v1, v3)} (expect 1)`);

  const sample = "First sentence. Second sentence with more words! Third sentence? Fourth one. ".repeat(20);
  const chunks = chunkText(sample);
  console.log(`chunkText returned ${chunks.length} chunks (each ~${chunks[0]?.length ?? 0} chars)`);

  console.log("\n─── Scrape probe ───");
  const probe = await fetchAndExtractText(citedSourceUrl);
  console.log(`  ${citedSourceUrl}`);
  console.log(`  ok=${probe.ok}  words=${probe.wordCount}  title="${probe.title.slice(0, 60)}"`);
  if (!probe.ok) console.log(`  error=${probe.error}`);

  console.log("\n─── Full gap analysis ───");
  console.log(`Cited source: ${citedSourceUrl}`);
  console.log(`Brand page:   ${brandUrl}\n`);
  const t0 = Date.now();
  const result = await computeContentGap(citedSourceUrl, brandUrl, apiKey);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log(`Elapsed:          ${elapsed}s`);
  console.log(`ok:               ${result.ok}`);
  if (!result.ok) {
    console.log(`error:            ${result.error}`);
    process.exit(1);
  }
  console.log(`Coverage score:   ${result.coverageScore}%`);
  console.log(`Avg similarity:   ${result.averageSimilarity}`);
  console.log(`Match threshold:  ${result.matchThreshold}`);
  console.log(`Chunks compared:  source=${result.chunksCompared.source}  brand=${result.chunksCompared.brand}`);
  console.log(`Cited title:      "${result.citedSource.title.slice(0, 70)}"`);
  console.log(`Brand title:      "${result.brandSource.title.slice(0, 70)}"`);

  console.log("\nTop missing topics (lowest brand similarity):");
  result.missingTopics.forEach((t, i) => {
    console.log(`  ${i + 1}. [sim=${t.bestBrandSimilarity}] ${t.excerpt}`);
  });

  console.log("\nTop matched topics (already covered):");
  result.matchedTopics.forEach((t, i) => {
    console.log(`  ${i + 1}. [sim=${t.bestBrandSimilarity}] ${t.excerpt}`);
  });
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
