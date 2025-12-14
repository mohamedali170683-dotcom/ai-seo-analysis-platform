import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Visibility Analysis | WPP Media Holistic Search",
  description: "AI-powered brand visibility analysis across ChatGPT, Gemini, Copilot, and Perplexity. Measure your Share of Voice in AI search results.",
  openGraph: {
    title: "AI Visibility Analysis | WPP Media Holistic Search",
    description: "AI-powered brand visibility analysis across ChatGPT, Gemini, Copilot, and Perplexity. Measure your Share of Voice in AI search results.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Visibility Analysis | WPP Media Holistic Search",
    description: "AI-powered brand visibility analysis across ChatGPT, Gemini, Copilot, and Perplexity.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function WPPDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
