"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bot, ArrowRight, Plus, Brain, CheckCircle2, Clock, XCircle, Loader, Trash2, ChevronDown, ChevronUp, HelpCircle, Sparkles, Lock } from "lucide-react";
import { ProjectModal } from "@/components/project-modal";
import { useTier } from "@/lib/tier";
import { UpgradeModal } from "@/components/UpgradeModal";
import { UpgradeModalTrigger } from "@/lib/tier/types";

// FAQ Data
const FAQ_DATA = [
  {
    question: "How does Velaris measure brand visibility across AI platforms?",
    answer: `Velaris uses advanced technology to understand how AI assistants like ChatGPT, Google Gemini, and Microsoft Copilot discuss your brand. Think of it as market research for the AI age.

Here's how it works: The system discovers real questions that consumers search for about products in your category, combined with strategic questions designed to reveal brand positioning. For example, instead of directly asking "What do you think of [Your Brand]?", it asks questions like "Which brands would you recommend for [category]?" or "What should I consider when buying [product type]?" This approach reveals how AI naturally positions your brand without prompting.

The system then sends these questions to multiple AI platforms simultaneously and analyzes their responses to understand how often your brand is mentioned, in what context, and with what sentiment. You choose which questions to test and which platforms to analyze, giving you full control over your analysis.`
  },
  {
    question: "Which AI platforms does Velaris analyze, and why does this matter?",
    answer: `Velaris currently analyzes the three major AI assistants that consumers use most:
• OpenAI's ChatGPT
• Google's Gemini
• Microsoft's Copilot

This matters because these platforms collectively serve more than one billion users who increasingly rely on AI for product research and purchase decisions. When someone asks ChatGPT "What's the best laptop for graphic design?" or queries Gemini about "reliable car brands", your brand's presence (or absence) in these responses directly impacts purchase decisions.

Our unique approach lets YOU select which platforms to test, ensuring your analysis is focused on the channels that matter most to your audience.`
  },
  {
    question: "What makes Velaris different from traditional SEO or social media monitoring?",
    answer: `Traditional SEO tools tell you how visible your website is in Google search results. Social media monitoring tracks what people say. Velaris does something entirely different: it measures how AI assistants discuss your brand when providing advice to consumers.

What sets us apart:
1. User-Controlled Analysis: You select which questions to test from real search data and strategic questions
2. Multi-Platform Coverage: Test across ChatGPT, Gemini, and Copilot simultaneously
3. Journey Stage Analysis: See how AI portrays your brand at Awareness, Consideration, and Decision stages
4. Data-Driven Recommendations: Get actionable insights based on actual AI response patterns, not generic advice
5. Competitive Positioning: Understand where you stand versus competitors in AI-generated recommendations

It's about understanding how your brand appears in this new, rapidly growing channel for consumer discovery.`
  },
  {
    question: "What insights does Velaris provide, and how can I use them?",
    answer: `Velaris transforms complex AI response data into clear, actionable insights:

Brand Mention Analysis: See how often each AI platform mentions your brand across different types of questions. If your brand appears less frequently than competitors in recommendation queries, you know there's an opportunity to improve.

Sentiment Scoring: Understand whether AI assistants speak positively, negatively, or neutrally about your brand. We show you actual AI response examples so you can see exactly how your brand is being portrayed.

Pattern Recognition: Our system analyzes AI responses to identify common themes, keywords, and descriptors associated with your brand—revealing what AI "thinks" about you.

Funnel Stage Analysis: See how your brand performs at each stage of the customer journey:
• Awareness: Does AI mention your brand when asked about the category?
• Consideration: How does AI compare you to competitors?
• Decision: Does AI recommend your brand for purchase?

Strategic Recommendations: Get specific, justified actions with correlations explaining WHY they'll improve your AI visibility.`
  },
  {
    question: "How reliable and accurate are the results?",
    answer: `Velaris ensures reliable results through several methods:

Multiple AI Platform Analysis: By querying several AI assistants, we reduce the risk of skewed results from any single platform. It's like conducting focus groups with different demographic segments rather than relying on just one.

Statistical Reliability: Each question is tested 3 times per platform (3 × 3 platforms = 9 tests per question), creating a dataset of 81 total AI responses across 9 questions. This repetition accounts for AI response variability.

Why 3 tests per platform works: Unlike human surveys (which need n≥30), AI models are relatively deterministic—the same question yields 80-90% consistent responses. With 3 tests, we can detect clear patterns while keeping analysis fast (~3-5 minutes).

Real Search Data: Questions are sourced from actual search volume data, ensuring you're testing queries real consumers actually ask.

Consistent Methodology: Every brand is evaluated using the same analysis methods, ensuring fair and comparable results. When you see that your competitor scores higher in certain areas, you can trust that this reflects a real difference in AI visibility.

Transparent Results: We show you the actual AI responses, not just scores—so you can verify and understand exactly how conclusions were reached.`
  },
  {
    question: "What types of businesses benefit most from Velaris?",
    answer: `While any brand can benefit from understanding their AI visibility, certain businesses see particularly high value:

Ideal Candidates:
• Consumer brands in competitive categories (electronics, fashion, beauty, automotive)
• B2B companies where buyers research solutions via AI
• E-commerce brands competing for online discovery
• New market entrants trying to build awareness quickly
• Premium brands needing to justify their value proposition
• International brands expanding into new markets

Marketing leaders who recognize that AI assistants are becoming a primary discovery channel for their customers will find Velaris invaluable for maintaining a competitive advantage in this new landscape.`
  }
];

export default function DashboardPage() {
  // Tier management
  const { tier, limits } = useTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<UpgradeModalTrigger>("funnel_stages");

  const openUpgradeModal = (trigger: UpgradeModalTrigger) => {
    setUpgradeModalTrigger(trigger);
    setShowUpgradeModal(true);
  };

  const [projects, setProjects] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const response = await fetch("/api/analysis/clear", { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setAnalyses([]);
        setShowClearConfirm(false);
      } else {
        alert("Failed to clear analyses: " + data.error);
      }
    } catch (error) {
      console.error("Error clearing analyses:", error);
      alert("Failed to clear analyses");
    } finally {
      setClearing(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadAnalyses = async () => {
    try {
      const response = await fetch("/api/analysis/list");
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error("Error loading analyses:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadProjects(), loadAnalyses()]);
      setLoading(false);
    };
    loadData();

    // Poll for running analyses
    const interval = setInterval(() => {
      if (analyses.some((a) => a.status === "running" || a.status === "pending")) {
        loadAnalyses();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = {
    totalProjects: projects.length,
    totalKeywords: projects.reduce((sum, p) => sum + (p._count?.keywords || 0), 0),
    aiOverviewKeywords: projects.reduce((sum, p) => sum + (p._count?.aiOverviews || 0), 0),
    totalQueries: projects.reduce((sum, p) => sum + (p._count?.chatbotQueries || 0), 0),
    totalAnalyses: analyses.length,
    completedAnalyses: analyses.filter((a) => a.status === "completed").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "running":
      case "pending":
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      completed: "bg-green-100 text-green-800",
      running: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes[status as keyof typeof classes] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Velaris
                </h1>
                <p className="text-sm text-gray-600">AI Visibility Analysis Platform</p>
              </div>
              {/* Tier Badge */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                tier === "free" 
                  ? "bg-blue-100 text-blue-700 border border-blue-200" 
                  : "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200"
              }`}>
                {tier === "free" ? (
                  <>
                    <Lock className="w-3 h-3" />
                    Free Tier
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Full Audit
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {tier === "free" && (
                <button
                  onClick={() => openUpgradeModal("funnel_stages")}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-lg flex items-center gap-2 font-semibold shadow-lg transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade
                </button>
              )}
              <Link
                href="/analyze"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 font-semibold shadow-lg"
              >
                <Brain className="w-4 h-4" />
                New Analysis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">AI Visibility Analyses</span>
              <Brain className="w-5 h-5 opacity-75" />
            </div>
            <div className="text-3xl font-bold">{stats.totalAnalyses}</div>
            <div className="text-xs opacity-75 mt-1">{stats.completedAnalyses} completed</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">Questions Tested</span>
              <HelpCircle className="w-5 h-5 opacity-75" />
            </div>
            <div className="text-3xl font-bold">{stats.totalAnalyses * 9}</div>
            <div className="text-xs opacity-75 mt-1">Across all analyses</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">AI Responses Analyzed</span>
              <Bot className="w-5 h-5 opacity-75" />
            </div>
            <div className="text-3xl font-bold">{stats.totalAnalyses * 81}</div>
            <div className="text-xs opacity-75 mt-1">3 tests × 3 platforms × 9 questions</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link
            href="/analyze"
            className="block bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white hover:shadow-xl transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-xl mr-4">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">New Analysis</h2>
                <p className="text-blue-100">You choose the questions & platforms</p>
              </div>
            </div>
            <p className="text-sm text-blue-100 mb-4">
              Select from real search data questions and strategic questions. Test on ChatGPT, Gemini, and Copilot. Get data-driven recommendations.
            </p>
            <div className="flex items-center text-sm font-semibold">
              Start Analysis
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* AI Visibility Analyses */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                Your Analyses
              </h2>
              <p className="text-sm text-gray-600 mt-1">Track how AI platforms mention your brands</p>
            </div>
            <div className="flex items-center gap-3">
              {analyses.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
              <Link
                href="/analyze"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Analysis
              </Link>
            </div>
          </div>

          {/* Clear Confirmation Modal */}
          {showClearConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Clear All Analyses?</h3>
                <p className="text-gray-600 mb-6">
                  This will permanently delete all {analyses.length} analyses and their data. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    disabled={clearing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2"
                  >
                    {clearing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading analyses...</div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-500 mb-4">No analyses yet. Start your first AI visibility analysis!</p>
              <Link
                href="/analyze"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 inline-flex items-center gap-2 font-semibold"
              >
                <Brain className="w-5 h-5" />
                Start Your First Analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(analysis.status)}
                        <h3 className="font-semibold text-lg">{analysis.brandOrKeyword}</h3>
                        {getStatusBadge(analysis.status)}
                      </div>
                      {analysis.domain && (
                        <p className="text-sm text-gray-600 ml-8">{analysis.domain}</p>
                      )}
                      {analysis.status === "running" && (
                        <div className="ml-8 mt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden max-w-xs">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${analysis.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{analysis.progress || 0}%</span>
                          </div>
                          {analysis.currentStep && (
                            <p className="text-xs text-gray-500 mt-1">{analysis.currentStep}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{analysis.questionsCount || 0}</div>
                        <div className="text-gray-500 text-xs">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{analysis.testsCount || 0}</div>
                        <div className="text-gray-500 text-xs">AI Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{analysis.insightsCount || 0}</div>
                        <div className="text-gray-500 text-xs">Insights</div>
                      </div>
                      {analysis.status === "completed" ? (
                        <Link
                          href={`/results/${analysis.id}`}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-1 font-semibold"
                        >
                          View Report
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : analysis.status === "running" || analysis.status === "pending" ? (
                        <Link
                          href={`/results/${analysis.id}`}
                          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                        >
                          View Progress
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          Failed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600">Learn how Velaris helps you understand your brand's presence in AI conversations</p>
          </div>
          
          <div className="space-y-4 max-w-4xl mx-auto">
            {FAQ_DATA.map((faq, index) => (
              <div 
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 py-4 bg-white">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProjects}
      />

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        trigger={upgradeModalTrigger}
      />
    </div>
  );
}
