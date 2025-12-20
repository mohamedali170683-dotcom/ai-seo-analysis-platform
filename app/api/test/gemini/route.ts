import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

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

    // Step 3: Get model
    diagnostics.steps.push({ step: "Get gemini-1.5-flash model", status: "checking" });
    
    let model;
    try {
      model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      diagnostics.steps[2].status = "passed";
    } catch (modelError: any) {
      diagnostics.steps[2].status = "failed";
      diagnostics.steps[2].error = modelError.message;
      return NextResponse.json({
        success: false,
        error: `Failed to get model: ${modelError.message}`,
        diagnostics,
      }, { status: 500 });
    }

    // Step 4: Make API call
    diagnostics.steps.push({ step: "Call generateContent API", status: "checking" });
    diagnostics.question = testQuestion;

    try {
      console.log(`[Gemini Test] Making API call with question: "${testQuestion}"`);
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: testQuestion }] }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      });

      diagnostics.steps[3].status = "passed";
      diagnostics.steps[3].hasResult = true;

      // Step 5: Parse response
      diagnostics.steps.push({ step: "Parse response", status: "checking" });

      const response = result.response;
      
      if (!response) {
        diagnostics.steps[4].status = "failed";
        diagnostics.steps[4].error = "No response object returned";
        return NextResponse.json({
          success: false,
          error: "No response from Gemini API",
          diagnostics,
        }, { status: 500 });
      }

      // Check for blocks
      if (response.promptFeedback?.blockReason) {
        diagnostics.steps[4].status = "blocked";
        diagnostics.steps[4].blockReason = response.promptFeedback.blockReason;
        return NextResponse.json({
          success: false,
          error: `Response blocked: ${response.promptFeedback.blockReason}`,
          diagnostics,
        }, { status: 500 });
      }

      const text = response.text();
      
      if (!text || text.length === 0) {
        diagnostics.steps[4].status = "failed";
        diagnostics.steps[4].error = "Empty response text";
        return NextResponse.json({
          success: false,
          error: "Empty response from Gemini",
          diagnostics,
        }, { status: 500 });
      }

      diagnostics.steps[4].status = "passed";
      diagnostics.steps[4].responseLength = text.length;

      // Success!
      const elapsed = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        message: "Gemini API is working correctly!",
        elapsed: `${elapsed}ms`,
        diagnostics,
        response: {
          text: text,
          length: text.length,
          truncated: text.length > 500 ? text.substring(0, 500) + "..." : text,
        },
      });

    } catch (apiError: any) {
      diagnostics.steps[3].status = "failed";
      diagnostics.steps[3].error = apiError.message;
      diagnostics.steps[3].errorDetails = {
        name: apiError.name,
        status: apiError.status,
        statusText: apiError.statusText,
      };

      // Analyze error
      const errorMsg = apiError.message?.toLowerCase() || '';
      let suggestion = "";

      if (errorMsg.includes('api key') || errorMsg.includes('api_key') || errorMsg.includes('invalid')) {
        suggestion = "Your API key appears to be invalid. Get a new one at https://aistudio.google.com/app/apikey";
      } else if (errorMsg.includes('quota') || errorMsg.includes('rate') || errorMsg.includes('429')) {
        suggestion = "Rate limit or quota exceeded. Wait a minute or check your quota at Google AI Studio.";
      } else if (errorMsg.includes('permission') || errorMsg.includes('403')) {
        suggestion = "Permission denied. Make sure your API key has access to the Gemini API.";
      } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        suggestion = "Model not found. The gemini-1.5-flash model may not be available in your region.";
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        suggestion = "Network error. Check your internet connection and firewall settings.";
      } else {
        suggestion = "Unknown error. Check the error details and try again.";
      }

      return NextResponse.json({
        success: false,
        error: `Gemini API call failed: ${apiError.message}`,
        suggestion,
        diagnostics,
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Unexpected error",
      diagnostics,
    }, { status: 500 });
  }
}

export async function GET() {
  // Quick check without making an API call
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    success: true,
    message: "Gemini Test Endpoint",
    usage: {
      method: "POST",
      body: {
        question: "string (optional, default: 'What is Nike known for?')",
      },
    },
    configuration: {
      keyConfigured: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? apiKey.substring(0, 4) + "..." : null,
      isPlaceholder: apiKey === "your-google-gemini-api-key",
    },
    nextSteps: !apiKey
      ? "Set GEMINI_API_KEY in your .env file. Get one at https://aistudio.google.com/app/apikey"
      : apiKey === "your-google-gemini-api-key"
      ? "Replace the placeholder API key with a real one"
      : "POST to this endpoint to test the API",
  });
}
