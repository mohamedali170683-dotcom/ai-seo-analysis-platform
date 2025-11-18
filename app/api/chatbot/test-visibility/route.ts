import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, brandName, platform, projectId } = body;

    if (!question || !brandName) {
      return NextResponse.json(
        { success: false, error: "Question and brand name are required" },
        { status: 400 }
      );
    }

    let response: string = "";
    let modelVersion: string = "";

    // Query OpenAI (ChatGPT)
    if (platform === "chatgpt" || !platform) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: question }],
        max_tokens: 500,
      });

      response = completion.choices[0]?.message?.content || "";
      modelVersion = completion.model;
    }

    // Check for brand mentions
    const hasBrandMention = response
      .toLowerCase()
      .includes(brandName.toLowerCase());

    // Find brand position
    let brandPosition: number | null = null;
    if (hasBrandMention) {
      const sentences = response.split(/[.!?]+/);
      for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].toLowerCase().includes(brandName.toLowerCase())) {
          brandPosition = i + 1;
          break;
        }
      }
    }

    // Extract URLs if mentioned
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const citedUrls = response.match(urlRegex) || [];

    // Save to database if projectId provided
    if (projectId) {
      const query = await prisma.chatbotQuery.create({
        data: {
          projectId,
          question,
          platform: platform || "chatgpt",
          modelVersion,
        },
      });

      await prisma.chatbotResponse.create({
        data: {
          queryId: query.id,
          responseText: response,
          hasBrandMention,
          brandPosition,
          citedUrls: citedUrls.length > 0 ? citedUrls : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        question,
        brandName,
        platform: platform || "chatgpt",
        modelVersion,
        response,
        hasBrandMention,
        brandPosition,
        citedUrls,
        visibilityScore: hasBrandMention
          ? Math.max(100 - (brandPosition || 1) * 10, 50)
          : 0,
      },
    });
  } catch (error: any) {
    console.error("Error testing chatbot visibility:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
