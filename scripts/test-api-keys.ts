/**
 * API Key Diagnostic Script
 * Tests if all AI platform API keys are properly configured
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testAPIKeys() {
  console.log('🔍 Testing API Keys Configuration\n');
  console.log('=' .repeat(60));

  // Test OpenAI (ChatGPT)
  console.log('\n1️⃣ Testing OpenAI API (ChatGPT)');
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey === 'your-openai-api-key') {
    console.log('❌ OpenAI API key not configured');
  } else {
    console.log(`✅ OpenAI API key found: ${openaiKey.substring(0, 8)}...`);
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "test successful"' }],
        max_tokens: 10
      });
      console.log('✅ OpenAI API is WORKING');
      console.log(`   Response: ${response.choices[0].message.content}`);
    } catch (error: any) {
      console.log(`❌ OpenAI API test failed: ${error.message}`);
    }
  }

  // Test Gemini
  console.log('\n2️⃣ Testing Google Gemini API');
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your-google-gemini-api-key') {
    console.log('⚠️  Gemini API key not configured - will use simulation');
  } else {
    console.log(`✅ Gemini API key found: ${geminiKey.substring(0, 8)}...`);
    try {
      const gemini = new GoogleGenerativeAI(geminiKey);
      const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent('Say "test successful"');
      const response = await result.response;
      console.log('✅ Gemini API is WORKING');
      console.log(`   Response: ${response.text()}`);
    } catch (error: any) {
      console.log(`❌ Gemini API test failed: ${error.message}`);
    }
  }

  // Test Perplexity
  console.log('\n3️⃣ Testing Perplexity API');
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  if (!perplexityKey || perplexityKey === 'your-perplexity-api-key') {
    console.log('⚠️  Perplexity API key not configured - will use simulation');
  } else {
    console.log(`✅ Perplexity API key found: ${perplexityKey.substring(0, 8)}...`);
    try {
      const perplexity = new OpenAI({
        apiKey: perplexityKey,
        baseURL: 'https://api.perplexity.ai',
      });
      const response = await perplexity.chat.completions.create({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: 'Say "test successful"' }],
        max_tokens: 10
      });
      console.log('✅ Perplexity API is WORKING');
      console.log(`   Response: ${response.choices[0].message.content}`);
    } catch (error: any) {
      console.log(`❌ Perplexity API test failed: ${error.message}`);
    }
  }

  // Test Copilot (always simulated)
  console.log('\n4️⃣ Microsoft Copilot');
  console.log('ℹ️  Copilot has no public API - always simulated via OpenAI');

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Summary:');
  console.log('   • OpenAI: Required (for ChatGPT + simulations)');
  console.log('   • Gemini: Optional (real API preferred)');
  console.log('   • Perplexity: Optional (real API preferred)');
  console.log('   • Copilot: Always simulated (no public API)\n');
}

testAPIKeys().catch(console.error);
