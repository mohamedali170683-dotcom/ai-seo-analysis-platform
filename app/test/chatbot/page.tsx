"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Send } from "lucide-react";

export default function ChatbotTestPage() {
  const [question, setQuestion] = useState("");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/chatbot/test-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          brandName,
          platform: "chatgpt",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to test chatbot visibility");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <Bot className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Chatbot Visibility Tester
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Test if your brand appears in ChatGPT responses (powered by OpenAI)
              </p>
            </div>
          </div>

          <form onSubmit={handleTest} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Nike, Apple, Salesforce"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question to Ask ChatGPT
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., What are the best project management tools? or Which running shoes should I buy?"
                rows={3}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Testing with ChatGPT...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Test Visibility
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Visibility Score */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
                <h2 className="text-xl font-bold mb-4">Visibility Analysis</h2>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <div className="text-sm text-gray-600 mb-2">
                      Brand Mentioned?
                    </div>
                    <div className="text-3xl font-bold">
                      {result.hasBrandMention ? (
                        <span className="text-green-600">✓ YES</span>
                      ) : (
                        <span className="text-red-600">✗ NO</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <div className="text-sm text-gray-600 mb-2">
                      Visibility Score
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {result.visibilityScore}/100
                    </div>
                    {result.brandPosition && (
                      <div className="text-sm text-gray-600 mt-2">
                        Mentioned in sentence #{result.brandPosition}
                      </div>
                    )}
                  </div>
                </div>

                {result.citedUrls && result.citedUrls.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      URLs Cited: {result.citedUrls.length}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {result.citedUrls.map((url: string, i: number) => (
                        <li key={i} className="truncate">{url}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ChatGPT Response */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-lg mb-3">ChatGPT Response</h3>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-gray-800 whitespace-pre-wrap">
                  {result.response}
                </div>
                <div className="text-xs text-gray-500 mt-3">
                  Model: {result.modelVersion}
                </div>
              </div>

              {/* Recommendations */}
              <div
                className={`rounded-lg p-6 border-2 ${
                  result.hasBrandMention
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <h3 className="font-bold text-lg mb-3">
                  {result.hasBrandMention ? "✓ Great News!" : "⚠️ Action Required"}
                </h3>
                <ul className="space-y-2">
                  {result.hasBrandMention ? (
                    <>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Your brand is being mentioned by ChatGPT for this type of
                          query
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Position #{result.brandPosition} - Earlier mentions get more
                          attention
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Test with more variations to understand your full visibility
                        </span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Your brand wasn't mentioned in this response
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Improve your online presence and authoritative content
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Focus on creating comprehensive guides and comparisons
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-bold mb-3">About Chatbot Visibility Testing</h3>
          <p className="text-gray-700 mb-2">
            This tool asks ChatGPT your question and analyzes:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>Whether your brand is mentioned in the response</li>
            <li>Position of mention (earlier = better visibility)</li>
            <li>Visibility score based on prominence</li>
            <li>Any URLs or sources cited</li>
          </ul>
          <p className="text-gray-600 text-sm mt-4">
            💡 Tip: Test multiple related questions to get a comprehensive view of
            your brand's AI visibility
          </p>
        </div>
      </div>
    </div>
  );
}
