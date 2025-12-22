import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    // Step 2: Initialize client
    diagnostics.steps.push({ step: "Initialize GoogleGenerativeAI client", status: "checking" });
    
    let client: GoogleGenerativeAI;
    try {
      client = new GoogleGenerativeAI(apiKey);
      diagnostics.steps[1].status = "passed";
    } catch (initError: any) {
      diagnostics.steps[1].status = "failed";
      diagnostics.steps[1].error = initError.message;
      return NextResponse.json({
        success: false,
        error: `Failed to initialize Gemini client: ${initError.message}`,
        diagnostics,
      }, { status: 500 });
    }

    // Step 3: Test ALL models to find which are available in this region
    diagnostics.steps.push({ step: "Test available models", status: "checking" });
    
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "gemini-1.0-pro-latest",
      "gemini-pro",
    ];
    
    const modelResults: { model: string; available: boolean; error?: string }[] = [];
    let workingModel: string | null = null;
    let workingResponse: string | null = null;
    
    console.log(`[Gemini Test] Testing ${modelsToTest.length} models...`);
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`[Gemini Test] Trying model: ${modelName}`);
        const model = client.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: testQuestion }] }],
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          },
        });
        
        const response = result.response;
        const text = response.text();
        
        if (text && text.length > 0) {
          modelResults.push({ model: modelName, available: true });
          console.log(`[Gemini Test] ✓ ${modelName} WORKS`);
          
          if (!workingModel) {
            workingModel = modelName;
            workingResponse = text;
          }
        } else {
          modelResults.push({ model: modelName, available: false, error: "Empty response" });
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
      response: {
        text: workingResponse,
        length: workingResponse?.length || 0,
        truncated: (workingResponse?.length || 0) > 300 
          ? workingResponse?.substring(0, 300) + "..." 
          : workingResponse,
      },
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
  
  // Test with direct REST API call
  const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Say hello" }]
        }]
      }),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Gemini API is working via REST!",
        status: response.status,
        response: data,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Gemini API returned an error",
        status: response.status,
        statusText: response.statusText,
        errorDetails: data,
        keyInfo: {
          length: apiKey.length,
          prefix: apiKey.substring(0, 8) + "...",
        },
        suggestion: data.error?.message || "Check your API key and project configuration",
      });
    }
  } catch (fetchError: any) {
    return NextResponse.json({
      success: false,
      error: `Network error: ${fetchError.message}`,
      keyInfo: {
        length: apiKey.length,
        prefix: apiKey.substring(0, 8) + "...",
      },
    });
  }
}
