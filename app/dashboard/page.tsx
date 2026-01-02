"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Brain, CheckCircle2, Clock, XCircle, Loader, Trash2, ChevronDown, ChevronUp, Sparkles, Lock, BarChart3, MessageSquare, AlertTriangle, Calendar, MoreVertical, Eye, Zap } from "lucide-react";
import { ProjectModal } from "@/components/project-modal";
import { useTier } from "@/lib/tier";
import { UpgradeModal } from "@/components/UpgradeModal";
import { UpgradeModalTrigger } from "@/lib/tier/types";
import { SEMANTIC_COLORS } from "@/lib/theme/colors";

// Type definitions
interface Project {
  id: string;
  brandName: string;
  websiteUrl?: string;
  industry?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    keywords?: number;
    aiOverviews?: number;
    chatbotQueries?: number;
  };
}

interface Analysis {
  id: string;
  brandOrKeyword: string;
  domain?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  createdAt: string;
  completedAt?: string;
  questionsCount?: number;
  testsCount?: number;
  insightsCount?: number;
}

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

Statistical Reliability: Each question is tested 3 times per platform (3 × 4 platforms = 12 tests per question), creating a statistically significant dataset of AI responses. This repetition accounts for AI response variability.

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

  const [projects, setProjects] = useState<Project[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const analysesRef = useRef<Analysis[]>([]);
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

  const handleDeleteAnalysis = async (id: string, brandName: string) => {
    if (!confirm(`Delete analysis for "${brandName}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/analysis/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setAnalyses(analyses.filter(a => a.id !== id));
      } else {
        alert("Failed to delete analysis: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
      alert("Failed to delete analysis");
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

  // Keep ref in sync with state for polling
  useEffect(() => {
    analysesRef.current = analyses;
  }, [analyses]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadProjects(), loadAnalyses()]);
      setLoading(false);
    };
    loadData();

    // Poll for running analyses using ref to avoid stale closure
    const interval = setInterval(() => {
      if (analysesRef.current.some((a) => a.status === "running" || a.status === "pending")) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Modern Header Card */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Velaris Dashboard</h1>
                <p className="text-blue-100 text-sm">AI Visibility Analysis Platform</p>
              </div>
              {/* Tier Badge */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                tier === "free"
                  ? "bg-white/20 text-white border border-white/30"
                  : tier === "professional"
                    ? "bg-gradient-to-r from-cyan-400/30 to-blue-400/30 text-white border border-cyan-300/50"
                    : "bg-gradient-to-r from-amber-400/30 to-yellow-400/30 text-white border border-amber-300/50"
              }`}>
                {tier === "free" ? (
                  <>
                    <Lock className="w-3 h-3" />
                    Free
                  </>
                ) : tier === "professional" ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Professional
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Partner
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pricing"
                className="px-4 py-2 text-white/80 hover:text-white font-medium transition-colors"
              >
                Pricing
              </Link>
              {tier === "free" && (
                <Link
                  href="/pricing"
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg flex items-center gap-2 font-semibold transition-all backdrop-blur-sm border border-white/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade
                </Link>
              )}
              <Link
                href="/analyze"
                className="px-5 py-2.5 bg-white text-blue-600 rounded-lg flex items-center gap-2 font-semibold shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                New Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview - Modern Card Design */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Total Analyses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Analyses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalAnalyses}</p>
              </div>
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                {stats.completedAnalyses} completed
              </span>
            </div>
          </div>

          {/* Questions Tested */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Questions Tested</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalAnalyses * 9}</p>
              </div>
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Across all brand analyses</p>
          </div>

          {/* AI Responses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Responses</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.totalAnalyses * 81}</p>
              </div>
              <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <Brain className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">3 tests × 4 AI platforms</p>
          </div>

          {/* Running Analyses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {analyses.filter(a => a.status === "running" || a.status === "pending").length}
                </p>
              </div>
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Loader className={`w-5 h-5 text-amber-600 dark:text-amber-400 ${analyses.some(a => a.status === "running") ? "animate-spin" : ""}`} />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Currently analyzing</p>
          </div>
        </div>

        {/* Quick Actions - Modern Cards */}
        <div className="mb-8 grid md:grid-cols-3 gap-4">
          <Link
            href="/analyze"
            className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">New AI Analysis</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Test your brand on ChatGPT, Gemini, Copilot, and Perplexity.
            </p>
            <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
              Start Analysis
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/hallucination-detector"
            className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-red-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Misinformation Detector</h2>
                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold uppercase">New</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Detect factual errors and outdated info in AI responses.
            </p>
            <div className="flex items-center text-sm font-semibold text-red-600 group-hover:translate-x-1 transition-transform">
              Check Accuracy
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/automation"
            className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-green-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 transition-colors">
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Automation</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Schedule recurring analyses to track visibility over time.
            </p>
            <div className="flex items-center text-sm font-semibold text-green-600 group-hover:translate-x-1 transition-transform">
              {tier === "free" ? (
                <>
                  <Lock className="mr-1 w-3 h-3" />
                  Professional Feature
                </>
              ) : (
                <>
                  Manage Schedules
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </div>
          </Link>
        </div>

        {/* AI Visibility Analyses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Your Analyses</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track how AI platforms mention your brands</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {analyses.length > 0 && (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
                <Link
                  href="/analyze"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Analysis
                </Link>
              </div>
            </div>
          </div>

          {/* Clear Confirmation Modal */}
          {showClearConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Clear All Analyses?</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This will permanently delete all {analyses.length} analyses and their data. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    disabled={clearing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 transition-colors"
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

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Loading your analyses...</p>
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                  <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No analyses yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Start your first AI visibility analysis to see how your brand appears across AI platforms.</p>
                <Link
                  href="/analyze"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center gap-2 font-semibold transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  Start My First Analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="group border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Status Icon */}
                        <div className={`p-2.5 rounded-lg shrink-0 ${
                          analysis.status === "completed" ? "bg-green-100 dark:bg-green-900/30" :
                          analysis.status === "running" || analysis.status === "pending" ? "bg-blue-100 dark:bg-blue-900/30" :
                          "bg-red-100 dark:bg-red-900/30"
                        }`}>
                          {analysis.status === "completed" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : analysis.status === "running" || analysis.status === "pending" ? (
                            <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>

                        {/* Brand Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{analysis.brandOrKeyword}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              analysis.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" :
                              analysis.status === "running" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                              analysis.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                              "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                            }`}>
                              {analysis.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            {analysis.domain && <span>{analysis.domain}</span>}
                            <span>•</span>
                            <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar for Running */}
                      {(analysis.status === "running" || analysis.status === "pending") && (
                        <div className="hidden md:flex items-center gap-3 w-48">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${analysis.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">{analysis.progress || 0}%</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="hidden lg:flex items-center gap-4 text-sm">
                        <div className="text-center px-3">
                          <div className="font-bold text-gray-900 dark:text-gray-100">{analysis.questionsCount || 0}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
                        </div>
                        <div className="text-center px-3 border-l border-gray-200 dark:border-gray-700">
                          <div className="font-bold text-gray-900 dark:text-gray-100">{analysis.testsCount || 0}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Tests</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {analysis.status === "completed" ? (
                          <Link
                            href={`/results/${analysis.id}`}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Report
                          </Link>
                        ) : analysis.status === "running" || analysis.status === "pending" ? (
                          <Link
                            href={`/results/${analysis.id}`}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-1.5 font-medium text-sm transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Progress
                          </Link>
                        ) : (
                          <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-lg text-sm">
                            Failed
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id, analysis.brandOrKeyword)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Delete analysis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Progress Bar */}
                    {(analysis.status === "running" || analysis.status === "pending") && (
                      <div className="md:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${analysis.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{analysis.progress || 0}%</span>
                        </div>
                        {analysis.currentStep && (
                          <p className="text-xs text-gray-500 mt-1">{analysis.currentStep}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trust Signals Section */}
        <section className="bg-slate-50 rounded-xl p-8 mb-8 border border-slate-200">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-slate-600 mb-4">Trusted by Marketing Teams At:</h3>
            <div className="flex flex-wrap justify-center items-center gap-8 text-slate-500 font-medium">
              <span className="text-lg">Deutsche Telekom</span>
              <span className="text-slate-300">•</span>
              <span className="text-lg">Nestlé</span>
              <span className="text-slate-300">•</span>
              <span className="text-lg">Purina</span>
              <span className="text-slate-300">•</span>
              <span className="text-lg">Henkel</span>
            </div>
          </div>
          <div className="max-w-2xl mx-auto text-center">
            <blockquote className="text-xl italic text-slate-700 mb-3">
              "Velaris helped us increase AI visibility by 34% in 90 days"
            </blockquote>
            <cite className="text-base text-slate-500 not-italic">
              — CMO, Fortune 500 Brand
            </cite>
          </div>
        </section>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h2>
            <p className="text-gray-600 dark:text-gray-400">Learn how Velaris helps you understand your brand's presence in AI conversations</p>
          </div>
          
          <div className="space-y-4 max-w-4xl mx-auto">
            {FAQ_DATA.map((faq, index) => (
              <div 
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
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
                  <div className="px-6 py-4 bg-white dark:bg-gray-800">
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
