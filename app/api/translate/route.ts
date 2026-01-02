import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { success: false, error: "Missing text or targetLang" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Translation service not configured" },
        { status: 500 }
      );
    }

    const targetLanguage = targetLang === 'de' ? 'German' : 'English';
    const openai = getOpenAIClient();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLanguage}.
Keep the same formatting, including markdown syntax if present.
Only output the translated text, nothing else.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const translatedText = response.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      return NextResponse.json(
        { success: false, error: "Translation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      translatedText,
      originalLang: targetLang === 'de' ? 'en' : 'de',
      targetLang,
    });
  } catch (error: any) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Translation failed" },
      { status: 500 }
    );
  }
}
