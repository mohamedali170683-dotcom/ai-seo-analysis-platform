import { NextResponse } from "next/server";
// Using REST API directly for grounding support

export const maxDuration = 60;
export const preferredRegion = "iad1"; // US East - for Gemini API availability

/**
 * Dedicated Gemini API test endpoint
 * Tests the Gemini API directly without any abstraction layers
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    steps: [],
  };

  try {
    const body = await request.json().catch(() => ({}));
    const testQuestion = body.question || "What is Nike known for?";

    // Step 1: Check environment variable
    diagnostics.steps.push({ step: "Check GEMINI_API_KEY", status: "checking" });
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      diagnostics.steps[0].status = "failed";
      diagnostics.steps[0].error = "GEMINI_API_KEY environment variable is not set";
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY not configured",
        diagnostics,
        suggestion: "Add GEMINI_API_KEY to your .env file. Get one at https://aistudio.google.com/app/apikey",
      }, { status: 500 });
    }

    diagnostics.steps[0].status = "passed";
    diagnostics.steps[0].keyInfo = {
      length: apiKey.length,
      prefix: apiKey.substring(0, 4) + "...",
      isPlaceholder: apiKey === "your-google-gemini-api-key",
    };

    if (apiKey === "your-google-gemini-api-key") {
      diagnostics.steps[0].status = "failed";
      diagnostics.steps[0].error = "API key is still the placeholder value";
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY is a placeholder",
        diagnostics,
        suggestion: "Replace the placeholder with a real API key from https://aistudio.google.com/app/apikey",
      }, { status: 500 });
    }

    // Step 2: Test API connectivity (using REST API with grounding)
    diagnostics.steps.push({ step: "Test REST API with grounding", status: "checking" });
    diagnostics.steps[1].status = "passed";
    diagnostics.steps[1].note = "Using REST API directly for Google Search grounding support";

    // Step 3: Test ALL models to find which are available in this region
    diagnostics.steps.push({ step: "Test available models", status: "checking" });
    
    const modelsToTest = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash-001",
      "gemini-flash-latest",
    ];
    
    const modelResults: { model: string; available: boolean; error?: string }[] = [];
    let workingModel: string | null = null;
    let workingResponse: string | null = null;
    
    console.log(`[Gemini Test] Testing ${modelsToTest.length} models...`);
    
    let groundingSources: any[] = [];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`[Gemini Test] Trying model: ${modelName} (REST API with grounding)`);
        
        // Use REST API directly with grounding enabled
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: testQuestion }] }],
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
            },
            // Enable Google Search grounding for source citations
            tools: [{
              googleSearch: {}
            }],
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.candidates?.[0]?.content?.parts) {
          const parts = data.candidates[0].content.parts;
          const finalText = parts
            .filter((p: any) => p.text)
            .map((p: any) => p.text)
            .join('\n');
          
          // Extract grounding metadata / sources
          const groundingMetadata = data.candidates[0].groundingMetadata;
          if (groundingMetadata) {
            const chunks = groundingMetadata.groundingChunks || [];
            const supports = groundingMetadata.groundingSupports || [];
            const searchQueries = groundingMetadata.webSearchQueries || [];
            
            console.log(`[Gemini Test] ${modelName} has grounding: ${chunks.length} chunks, ${supports.length} supports`);
            
            for (const chunk of chunks) {
              if (chunk.web) {
                groundingSources.push({
                  url: chunk.web.uri || '',
                  title: chunk.web.title || '',
                  domain: (chunk.web.uri || '').replace(/^https?:\/\//, '').split('/')[0],
                });
              }
            }
          }
          
          if (finalText && finalText.length > 0) {
            modelResults.push({ model: modelName, available: true });
            console.log(`[Gemini Test] ✓ ${modelName} WORKS (${finalText.length} chars, ${groundingSources.length} sources)`);
            
            if (!workingModel) {
              workingModel = modelName;
              workingResponse = finalText;
            }
          } else {
            modelResults.push({ model: modelName, available: false, error: "Empty response" });
          }
        } else if (data.error?.code === 429) {
          console.log(`[Gemini Test] ✗ ${modelName}: Rate limited`);
          modelResults.push({ model: modelName, available: false, error: "Rate limited" });
        } else if (data.error) {
          console.log(`[Gemini Test] ✗ ${modelName}: ${data.error.message?.substring(0, 80)}`);
          modelResults.push({ model: modelName, available: false, error: data.error.message?.substring(0, 100) });
        } else {
          modelResults.push({ model: modelName, available: false, error: "Unknown response format" });
        }
      } catch (modelError: any) {
        const errMsg = modelError.message || 'Unknown error';
        console.log(`[Gemini Test] ✗ ${modelName}: ${errMsg.substring(0, 80)}`);
        modelResults.push({ 
          model: modelName, 
          available: false, 
          error: errMsg.substring(0, 100),
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    diagnostics.steps[2].status = workingModel ? "passed" : "failed";
    diagnostics.steps[2].modelResults = modelResults;
    diagnostics.steps[2].workingModel = workingModel;
    diagnostics.steps[2].availableModels = modelResults.filter(m => m.available).map(m => m.model);
    diagnostics.steps[2].unavailableModels = modelResults.filter(m => !m.available).map(m => m.model);
    
    // Check if ANY model worked
    if (!workingModel) {
      return NextResponse.json({
        success: false,
        error: "No Gemini models available in this region",
        diagnostics,
        modelResults,
        suggestion: `None of the ${modelsToTest.length} models are available. This is usually caused by:
1. The Vercel function is running in a region where Gemini is not available
2. Your API key doesn't have access to any models
3. The 'Generative Language API' is not enabled in your Google Cloud project

SOLUTIONS:
1. Go to Vercel Dashboard → Settings → Functions → Change region to 'iad1' (US East) or 'sfo1' (US West)
2. Create a new API key at https://aistudio.google.com/apikey
3. Enable 'Generative Language API' at https://console.cloud.google.com/apis/library`,
      }, { status: 500 });
    }

    // Success - at least one model works!
    const elapsed = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: `Gemini API working! Model '${workingModel}' is available.`,
      elapsed: `${elapsed}ms`,
      diagnostics,
      workingModel,
      modelResults,
      availableModels: modelResults.filter(m => m.available).map(m => m.model),
      grounding: {
        enabled: true,
        sourcesFound: groundingSources.length,
        sources: groundingSources,
      },
      response: {
        text: workingResponse,
        length: workingResponse?.length || 0,
        fullResponse: workingResponse,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unexpected error",
      diagnostics,
    }, { status: 500 });
  }
}

export async function GET() {
  // Direct REST API test - bypasses SDK completely
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: "GEMINI_API_KEY not set",
    });
  }
  
  // First, list available models to see what we have access to
  const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  let availableModels: string[] = [];
  let listError: string | null = null;
  
  try {
    const listResponse = await fetch(listModelsUrl);
    const listData = await listResponse.json();
    
    if (listResponse.ok && listData.models) {
      availableModels = listData.models
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace('models/', ''));
    } else {
      listError = listData.error?.message || 'Failed to list models';
    }
  } catch (e: any) {
    listError = e.message;
  }
  
  // Try multiple models - spread load across different models to avoid rate limits
  if (availableModels.length > 0) {
    // Prioritize models that might have less usage
    const modelsToTry = [
      "gemini-2.0-flash",      // Different from 2.5 to spread load
      "gemini-2.0-flash-001",
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-pro-latest",
    ].filter(m => availableModels.includes(m));
    
    for (const modelToUse of modelsToTry) {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;
      
      try {
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "What are the top 3 running shoe brands? Please list them briefly." }] }],
            generationConfig: {
              maxOutputTokens: 1024,
            }
          }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return NextResponse.json({
            success: true,
            message: `Gemini API is working! Model '${modelToUse}' responded.`,
            workingModel: modelToUse,
            availableModels: modelsToTry,
            response: responseText,
            responseLength: responseText.length,
            keyInfo: { length: apiKey.length, prefix: apiKey.substring(0, 8) + "..." },
          });
        } else if (data.error?.code === 429) {
          // Rate limited - try next model
          console.log(`[Gemini] ${modelToUse} rate limited, trying next...`);
          continue;
        } else {
          return NextResponse.json({
            success: false,
            error: `Model ${modelToUse} failed`,
            availableModels,
            errorDetails: data.error,
            keyInfo: { length: apiKey.length, prefix: apiKey.substring(0, 8) + "..." },
          });
        }
      } catch (fetchError: any) {
        console.log(`[Gemini] ${modelToUse} fetch error: ${fetchError.message}`);
        continue;
      }
    }
    
    // All models rate limited
    return NextResponse.json({
      success: false,
      error: "All models rate limited",
      availableModels: modelsToTry,
      suggestion: "The free tier has 20 requests/day per model. Wait or upgrade to a paid plan.",
      keyInfo: { length: apiKey.length, prefix: apiKey.substring(0, 8) + "..." },
    });
  }
  
  // No models available
  return NextResponse.json({
    success: false,
    error: "No compatible Gemini models found",
    availableModels,
    listModelsError: listError,
    keyInfo: { length: apiKey.length, prefix: apiKey.substring(0, 8) + "..." },
    suggestion: "Your API key may not have access to any Gemini models. Please ensure you created the key at https://aistudio.google.com/apikey and that the 'Generative Language API' is enabled.",
  });
}
