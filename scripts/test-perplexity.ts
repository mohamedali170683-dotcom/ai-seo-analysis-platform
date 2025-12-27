import OpenAI from "openai";

async function testPerplexity() {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    console.error("❌ PERPLEXITY_API_KEY not set");
    process.exit(1);
  }

  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  console.log(`📏 Length: ${apiKey.length} characters`);
  console.log(`🔍 Starts with: ${apiKey.substring(0, 5)}`);

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.perplexity.ai",
    timeout: 20000,
  });

  try {
    console.log("\n🧪 Testing Perplexity API...");
    const completion = await client.chat.completions.create({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        { role: "user", content: "What is the capital of France?" }
      ],
    });

    const response = completion.choices[0]?.message?.content;
    console.log("\n✅ SUCCESS! Perplexity API is working");
    console.log(`📝 Response: ${response?.substring(0, 100)}...`);

    // Check citations
    const citations = (completion as any).citations;
    if (citations && citations.length > 0) {
      console.log(`\n🔗 Citations found: ${citations.length}`);
      citations.slice(0, 3).forEach((c: string, i: number) => {
        console.log(`   ${i + 1}. ${c}`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ PERPLEXITY API TEST FAILED");
    console.error(`Error: ${error.message}`);
    if (error.status) {
      console.error(`Status: ${error.status}`);
    }
    if (error.code) {
      console.error(`Code: ${error.code}`);
    }

    // Specific error hints
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.error("\n💡 HINT: API key is invalid or expired");
      console.error("   → Get a new key from https://www.perplexity.ai/settings/api");
    } else if (error.message?.includes('429')) {
      console.error("\n💡 HINT: Rate limit exceeded");
    } else if (error.message?.includes('timeout')) {
      console.error("\n💡 HINT: Request timed out - API might be slow");
    }

    process.exit(1);
  }
}

testPerplexity();
