import Link from "next/link";
import { TrendingUp, Bot, Search, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const stats = {
    totalKeywords: 150,
    aiOverviewKeywords: 45,
    avgTrafficChange: -12.5,
    chatbotVisibilityScore: 72,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              SEO Analysis Dashboard
            </h1>
            <div className="flex gap-4">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Settings
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Keywords</span>
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalKeywords}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">AI Overview Keywords</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.aiOverviewKeywords}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <span>+15.2% vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Traffic Change</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.avgTrafficChange}%</div>
            <div className="flex items-center text-xs text-red-600 mt-1">
              <span>Impact from AI</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Chatbot Visibility</span>
              <Bot className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.chatbotVisibilityScore}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <span>+8.3% vs last week</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Overview Impact</h2>
                <p className="text-sm text-gray-600">Analyze traffic impact from Google AI Overviews</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Keywords Affected</span>
                <span className="font-semibold">{stats.aiOverviewKeywords}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Traffic Impact</span>
                <span className="font-semibold text-red-600">{stats.avgTrafficChange}%</span>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                View Analysis
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg mr-4">
                <Bot className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Chatbot Visibility</h2>
                <p className="text-sm text-gray-600">Score your brand presence in ChatGPT & Gemini</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Visibility Score</span>
                <span className="font-semibold">{stats.chatbotVisibilityScore}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Queries Analyzed</span>
                <span className="font-semibold">127</span>
              </div>
              <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center">
                View Analysis
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <p className="text-sm text-gray-600 mb-4">Get started with your SEO analysis</p>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Import Keywords
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Connect APIs
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Run Analysis
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
