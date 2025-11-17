import Link from "next/link";
import { ArrowRight, BarChart3, Bot, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered SEO & Search Visibility Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Analyze the impact of AI-driven search features (Google AI Overviews, ChatGPT, Gemini)
            on your organic and paid search performance
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI Overview Impact Analysis
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Measure how Google AI Overviews affect your SEO and SEA traffic.
              Track AI Overview presence, analyze traffic impact, and identify opportunities.
            </p>
            <ul className="space-y-3 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Google Search Console & Ahrefs API integration</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>AI Overview detection & tracking over time</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Traffic impact analysis (clicks, impressions, CTR)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">✓</span>
                <span>Before/after comparison visualizations</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Bot className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI Chatbot Visibility Scoring
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Analyze and score your brand visibility across ChatGPT and Gemini.
              Get actionable recommendations to improve your chatbot presence.
            </p>
            <ul className="space-y-3 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Automated ChatGPT & Gemini query analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Brand mention detection & competitive analysis</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Visibility scoring (0-100) with trend tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">✓</span>
                <span>Actionable optimization recommendations</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 mb-16">
          <div className="flex items-center mb-6">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Platform Capabilities</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">Real-time</div>
              <div className="text-gray-600">Traffic Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">Multi-Platform</div>
              <div className="text-gray-600">AI Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">Actionable</div>
              <div className="text-gray-600">Insights</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">Competitive</div>
              <div className="text-gray-600">Intelligence</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
