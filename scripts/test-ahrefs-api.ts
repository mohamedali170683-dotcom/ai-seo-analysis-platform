/**
 * Test script to verify Ahrefs API is working correctly
 * Run with: npx tsx scripts/test-ahrefs-api.ts
 */

import axios from "axios";

async function testAhrefsAPI() {
  console.log("🧪 Testing Ahrefs API Connection\n");

  // Check if API key is set
  const apiKey = process.env.AHREFS_API_KEY;

  if (!apiKey) {
    console.error("❌ AHREFS_API_KEY environment variable is not set!");
    console.log("\nTo fix this:");
    console.log("1. Create a .env.local file in the root directory");
    console.log("2. Add: AHREFS_API_KEY=your-api-key-here");
    process.exit(1);
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
  console.log("");

  // Test with a simple keyword
  const testKeyword = "Nike";

  try {
    console.log(`📡 Testing Ahrefs API with keyword: "${testKeyword}"`);
    console.log("");

    const endpoint = "https://api.ahrefs.com/v3/keywords-explorer/keyword-ideas";

    const params = {
      target: testKeyword,
      country: "us",
      mode: "questions",
      limit: 10,
    };

    console.log("Request details:");
    console.log(`  Endpoint: ${endpoint}`);
    console.log(`  Params:`, params);
    console.log("");

    const startTime = Date.now();

    const response = await axios.get(endpoint, {
      params,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      timeout: 15000,
    });

    const duration = Date.now() - startTime;

    console.log(`✅ API Response received in ${duration}ms`);
    console.log("");
    console.log("Response status:", response.status);
    console.log("Response keys:", Object.keys(response.data || {}));
    console.log("");

    // Parse response
    let keywords = [];

    if (response.data?.keywords) {
      keywords = response.data.keywords;
    } else if (response.data?.results) {
      keywords = response.data.results;
    } else if (response.data?.items) {
      keywords = response.data.items;
    } else if (Array.isArray(response.data)) {
      keywords = response.data;
    }

    console.log(`📊 Found ${keywords.length} questions`);
    console.log("");

    if (keywords.length > 0) {
      console.log("Sample questions:");
      keywords.slice(0, 5).forEach((kw: any, i: number) => {
        const question = kw.keyword || kw.phrase || kw.term || kw.query || "N/A";
        const volume = kw.volume || kw.search_volume || kw.monthly_volume || 0;
        console.log(`  ${i + 1}. "${question}" (volume: ${volume})`);
      });

      console.log("");
      console.log("✅ Ahrefs API is working correctly!");
      console.log("");
      console.log("Your analysis should now work properly.");

    } else {
      console.log("⚠️  No questions found for this keyword.");
      console.log("This might mean:");
      console.log("  - The keyword has no question data in Ahrefs");
      console.log("  - Try a different keyword (e.g., 'CRM software', 'running shoes')");
      console.log("");
      console.log("The fallback mechanism will still work though!");
    }

  } catch (error: any) {
    console.error("\n❌ Ahrefs API Test Failed!");
    console.error("");

    if (error.response) {
      console.error("API Error Response:");
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${JSON.stringify(error.response.data, null, 2)}`);
      console.error("");

      if (error.response.status === 401) {
        console.error("🔑 Authentication Error - Your API key is invalid or expired");
        console.error("   Please check your Ahrefs API key in your account settings");
      } else if (error.response.status === 403) {
        console.error("🚫 Forbidden - Your account may not have access to this API endpoint");
        console.error("   Please check your Ahrefs subscription includes API access");
      } else if (error.response.status === 429) {
        console.error("⏱️  Rate Limit - Too many requests");
        console.error("   Please wait a moment and try again");
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error("⏱️  Request Timeout");
      console.error("   The API took too long to respond");
    } else {
      console.error("Network Error:");
      console.error(`  ${error.message}`);
    }

    console.error("");
    console.error("💡 Don't worry! The fallback mechanism will ensure your analysis still works.");
    console.error("   It will use smart template questions instead of Ahrefs data.");

    process.exit(1);
  }
}

testAhrefsAPI();
