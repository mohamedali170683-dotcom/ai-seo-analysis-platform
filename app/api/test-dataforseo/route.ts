import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;

    // Check if credentials exist
    if (!login || !password) {
      return NextResponse.json({
        success: false,
        error: "DataForSEO credentials not set in Vercel environment variables",
        hasLogin: !!login,
        hasPassword: !!password,
      });
    }

    // Test API connection
    const auth = Buffer.from(`${login}:${password}`).toString('base64');
    
    const response = await axios.post(
      "https://api.dataforseo.com/v3/keywords_data/google/search_volume/live",
      [{
        keywords: ["Nike shoes"],
        location_code: 2840, // United States
        language_code: "en",
      }],
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return NextResponse.json({
      success: true,
      message: "✅ DataForSEO is working!",
      statusCode: response.data.status_code,
      statusMessage: response.data.status_message,
      tasksCount: response.data.tasks_count,
      cost: response.data.cost,
      sampleData: response.data.tasks?.[0]?.result?.[0] || null,
      credentialsUsed: {
        login: login.substring(0, 3) + "***",
        passwordLength: password.length,
      },
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      statusCode: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      hasCredentials: {
        login: !!process.env.DATAFORSEO_LOGIN,
        password: !!process.env.DATAFORSEO_PASSWORD,
      },
    }, { status: 500 });
  }
}
