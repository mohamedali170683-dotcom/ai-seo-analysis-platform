"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Question {
  id: string;
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
  source: "real_data" | "strategic";
}

interface QuestionGroup {
  stage: "awareness" | "consideration" | "decision";
  stageDescription: string;
  brandQuestions: Question[];
  categoryQuestions: Question[];
  requiredSelections: number;
}

type Platform = "ChatGPT" | "Gemini" | "Copilot";

export default function AnalyzePage() {
  // Form state
  const [brandName, setBrandName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [competitors, setCompetitors] = useState("");

  // Phase tracking
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  // Question discovery
  const [loading, setLoading] = useState(false);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, Question[]>>({
    awareness: [],
    consideration: [],
    decision: [],
  });

  // Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["ChatGPT", "Gemini", "Copilot"]);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Analysis state
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("");

  // Countdown timers
  const [discoveryCountdown, setDiscoveryCountdown] = useState(30);
  const [analysisCountdown, setAnalysisCountdown] = useState(240); // 4 minutes
  const [discoveryMessage, setDiscoveryMessage] = useState("");

  // Phase 1: Discover questions with countdown
  const handleDiscoverQuestions = async () => {
    if (!brandName || !category) {
      alert("Please enter brand name and category");
      return;
    }

    setLoading(true);
    setDiscoveryCountdown(30);
    setDiscoveryMessage("Connecting to search data APIs...");

    // Start countdown timer
    const countdownInterval = setInterval(() => {
      setDiscoveryCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Rotate discovery messages
    const messages = [
      "Connecting to search data APIs...",
      "Extracting real search questions...",
      "Analyzing search volumes...",
      "Generating strategic questions...",
      "Categorizing by funnel stage...",
      "Preparing your question selection...",
    ];
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setDiscoveryMessage(messages[messageIndex]);
    }, 4000);

    try {
      const response = await fetch("/api/analysis/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          category,
          competitors: competitors.split(",").map(c => c.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setQuestionGroups(data.questionGroups);
        setPhase(2);
      } else {
        alert(data.error || "Failed to discover questions");
      }
    } catch (error) {
      alert("Error discovering questions");
    } finally {
      clearInterval(countdownInterval);
      clearInterval(messageInterval);
      setLoading(false);
      setDiscoveryMessage("");
    }
  };

  // Toggle question selection (max 6 per stage for flexibility)
  const toggleQuestion = (question: Question, stage: "awareness" | "consideration" | "decision") => {
    setSelectedQuestions(prev => {
      const stageQuestions = prev[stage] || [];
      const exists = stageQuestions.find(q => q.id === question.id);
      
      if (exists) {
        return {
          ...prev,
          [stage]: stageQuestions.filter(q => q.id !== question.id),
        };
      }
      
      // Allow up to 6 per stage for flexibility
      if (stageQuestions.length >= 6) {
        alert(`Maximum 6 questions per stage. Deselect one first.`);
        return prev;
      }
      
      return {
        ...prev,
        [stage]: [...stageQuestions, question],
      };
    });
  };

  // Toggle platform selection
  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        if (prev.length === 1) {
          alert("At least 1 platform required");
          return prev;
        }
        return prev.filter(p => p !== platform);
      }
      return [...prev, platform];
    });
  };

  // Get total selected questions
  const getTotalSelected = () => {
    return Object.values(selectedQuestions).reduce((sum, qs) => sum + qs.length, 0);
  };

  // Check if ready to run (minimum 3 questions total)
  const canRunAnalysis = () => {
    const total = getTotalSelected();
    return total >= 3 && selectedPlatforms.length > 0;
  };

  // Get selection breakdown by stage
  const getSelectionBreakdown = () => {
    return {
      awareness: selectedQuestions.awareness.length,
      consideration: selectedQuestions.consideration.length,
      decision: selectedQuestions.decision.length,
      total: getTotalSelected(),
    };
  };

  // Show confirmation modal before running
  const handleRunClick = () => {
    if (!canRunAnalysis()) {
      alert("Please select at least 3 questions");
      return;
    }
    setShowConfirmModal(true);
  };

  // Phase 2: Run analysis (called after confirmation)
  const handleRunAnalysis = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setPhase(3);
    setAnalysisStartTime(Date.now());
    setElapsedTime(0);
    setCurrentStep("Starting analysis...");
    
    // Set countdown based on number of questions (roughly 20-25 seconds per question)
    const totalQuestions = getTotalSelected();
    const estimatedSeconds = Math.max(120, totalQuestions * 25); // At least 2 minutes
    setAnalysisCountdown(estimatedSeconds);

    const allQuestions = [
      ...selectedQuestions.awareness,
      ...selectedQuestions.consideration,
      ...selectedQuestions.decision,
    ];

    try {
      const response = await fetch("/api/analysis/run-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          domain,
          category,
          competitors: competitors.split(",").map(c => c.trim()).filter(Boolean),
          selectedQuestions: allQuestions.map(q => ({
            question: q.question,
            searchVolume: q.searchVolume,
            category: q.category,
            type: q.type,
          })),
          selectedPlatforms,
          testsPerPlatform: 3,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisId(data.analysisId);
        pollAnalysisStatus(data.analysisId);
      } else {
        alert(data.error || "Failed to start analysis");
        setPhase(2);
        setAnalysisStartTime(null);
      }
    } catch (error) {
      alert("Error starting analysis");
      setPhase(2);
      setAnalysisStartTime(null);
    } finally {
      setLoading(false);
    }
  };

  // Poll for analysis status
  const pollAnalysisStatus = async (id: string) => {
    const startTime = Date.now();
    
    // Timer interval to update elapsed time and countdown every second
    const timerInterval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      setAnalysisCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/analysis/${id}`);
        const data = await response.json();

        setAnalysisStatus(data.currentStep || "Processing...");
        setCurrentStep(data.currentStep || "Processing...");
        setAnalysisProgress(data.progress || 0);

        if (data.status === "completed") {
          clearInterval(timerInterval);
          window.location.href = `/results/${id}`;
        } else if (data.status === "failed") {
          clearInterval(timerInterval);
          alert("Analysis failed: " + data.currentStep);
          setPhase(2);
          setAnalysisStartTime(null);
        } else {
          setTimeout(poll, 2000); // Poll every 2 seconds for more responsive updates
        }
      } catch (error) {
        setTimeout(poll, 3000);
      }
    };
    poll();
  };
  
  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format search volume
  const formatVolume = (vol: number) => {
    if (vol === 0) return "Strategic";
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M/mo`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K/mo`;
    return `${vol}/mo`;
  };

  // Stage labels, icons, and detailed explanations
  const stageInfo: Record<string, {
    label: string;
    color: string;
    icon: string;
    shortDesc: string;
    longDesc: string;
    userMindset: string;
    exampleQuestions: string[];
    whyItMatters: string;
  }> = {
    awareness: { 
      label: "🔍 Awareness", 
      color: "blue",
      icon: "🔍",
      shortDesc: "Discovery & Learning",
      longDesc: "The first stage where potential customers are just learning about a topic or problem. They're gathering information, not yet looking for specific brands.",
      userMindset: "\"I want to understand...\" or \"What is...?\"",
      exampleQuestions: ["What is the best way to...", "How does X work?", "Why should I care about..."],
      whyItMatters: "If AI doesn't mention your brand when users are learning about your category, you miss the chance to be considered from the start."
    },
    consideration: { 
      label: "⚖️ Consideration", 
      color: "yellow",
      icon: "⚖️",
      shortDesc: "Comparing Options",
      longDesc: "Users now know what they need and are actively comparing different brands, products, or solutions. They're looking for the best fit.",
      userMindset: "\"Which one should I choose?\" or \"X vs Y?\"",
      exampleQuestions: ["Best [product] for...", "Compare X and Y", "[Brand] vs competitors"],
      whyItMatters: "This is where AI influences preferences. If competitors are mentioned but you're not, you lose ground at a critical moment."
    },
    decision: { 
      label: "✅ Decision", 
      color: "green",
      icon: "✅",
      shortDesc: "Ready to Act",
      longDesc: "Users are ready to make a purchase or take action. They're looking for final validation, reviews, or the best place to buy.",
      userMindset: "\"Should I buy...?\" or \"Is X worth it?\"",
      exampleQuestions: ["Is [brand] worth buying?", "Where to buy...", "[Brand] reviews"],
      whyItMatters: "The final push. If AI recommends your brand here, it directly drives conversions and sales."
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2">
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold">Velaris Analysis</h1>
          <div className="w-32" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Phase indicator */}
        <div className="flex items-center gap-4 mb-8">
          {[
            { num: 1, label: "Setup" },
            { num: 2, label: "Select Questions" },
            { num: 3, label: "Analyze" },
          ].map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex items-center gap-2 ${phase >= step.num ? "text-purple-400" : "text-gray-600"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  phase >= step.num ? "bg-purple-600" : "bg-gray-700"
                }`}>
                  {step.num}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {i < 2 && <div className="w-8 sm:w-16 h-0.5 bg-gray-700 mx-2" />}
            </div>
          ))}
        </div>

        {/* Phase 1: Setup */}
        {phase === 1 && (
          <div className="space-y-8">
            {/* Value Proposition */}
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/30">
              <h2 className="text-3xl font-bold mb-4">Take Control of Your AI Visibility Analysis</h2>
              <p className="text-xl text-gray-300 mb-6">
                Unlike automated tools, our 2-phase approach lets YOU decide which questions matter most for your brand.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold mb-1">Real Search Data</h3>
                  <p className="text-sm text-gray-400">See actual questions people search with real monthly volumes</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-semibold mb-1">Strategic Questions</h3>
                  <p className="text-sm text-gray-400">AI-crafted questions to understand brand positioning</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="text-3xl mb-2">🔬</div>
                  <h3 className="font-semibold mb-1">Your Choice</h3>
                  <p className="text-sm text-gray-400">Select 9 questions across the customer journey</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white/5 rounded-xl p-6 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Enter Your Brand Details</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Nike"
                    className="w-full bg-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category / Vertical *</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., running shoes, sportswear"
                    className="w-full bg-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Domain (optional)</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g., nike.com"
                    className="w-full bg-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Main Competitors (comma-separated)</label>
                  <input
                    type="text"
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    placeholder="e.g., Adidas, Puma, New Balance"
                    className="w-full bg-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <Button
                onClick={handleDiscoverQuestions}
                disabled={loading || !brandName || !category}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-4 text-lg mt-6 font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Discovering Questions...
                  </span>
                ) : (
                  <span>🔍 Discover Questions for {brandName || "Your Brand"} →</span>
                )}
              </Button>
              <p className="text-center text-xs text-gray-500 mt-2">
                Next: You'll select which questions to test on AI platforms
              </p>
            </div>

            {/* Discovery Loading Overlay */}
            {loading && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-purple-500/30 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🔍</div>
                    <h3 className="text-2xl font-bold mb-2">Discovering Questions</h3>
                    <p className="text-gray-400 mb-6">
                      We're finding real questions people ask about <strong className="text-purple-400">{brandName}</strong> and generating strategic ones for your analysis.
                    </p>
                    
                    {/* Countdown Timer */}
                    <div className="bg-purple-900/50 rounded-xl p-4 mb-6">
                      <div className="text-4xl font-mono font-bold text-purple-400 mb-1">
                        {Math.floor(discoveryCountdown / 60)}:{(discoveryCountdown % 60).toString().padStart(2, '0')}
                      </div>
                      <p className="text-xs text-gray-500">estimated time remaining</p>
                    </div>

                    {/* Current Step */}
                    <div className="bg-black/30 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-300">{discoveryMessage}</span>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="space-y-2 text-left">
                      {[
                        { label: "Connect to DataForSEO API", done: discoveryCountdown < 28 },
                        { label: "Extract real search questions", done: discoveryCountdown < 22 },
                        { label: "Analyze search volumes", done: discoveryCountdown < 16 },
                        { label: "Generate strategic questions", done: discoveryCountdown < 10 },
                        { label: "Categorize by funnel stage", done: discoveryCountdown < 5 },
                      ].map((step, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm ${step.done ? "text-green-400" : "text-gray-500"}`}>
                          <span>{step.done ? "✅" : "⏳"}</span>
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">How It Works</h3>
              <div className="space-y-3 text-gray-300">
                <div className="flex gap-3">
                  <span className="text-purple-400 font-bold">1.</span>
                  <span>We'll discover questions people actually search for about your brand and category</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-purple-400 font-bold">2.</span>
                  <span>Select questions from any funnel stage (minimum 3, you decide the mix)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-purple-400 font-bold">3.</span>
                  <span>Choose which AI chatbots to test (ChatGPT, Gemini, Copilot)</span>
                </div>
                <div className="flex gap-3">
                  <span className="text-purple-400 font-bold">4.</span>
                  <span>Get detailed visibility scores, mention rates, and actionable insights</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Select Questions */}
        {phase === 2 && (
          <div className="space-y-0">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-4 pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Select Questions to Test</h2>
                    <p className="text-gray-300">Choose from any stage (minimum 3 questions)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-5 py-2.5 rounded-xl font-bold text-lg ${
                      getTotalSelected() >= 3 
                        ? "bg-green-600 text-white" 
                        : "bg-white/20 text-white"
                    }`}>
                      {getTotalSelected()} selected {getTotalSelected() >= 3 && "✓"}
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-300">📊 <strong>Real Search Data</strong> - Questions people actually search (with monthly volume)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-gray-300">🎯 <strong>Strategic Questions</strong> - AI-crafted to understand brand positioning</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Educational Section: Understanding the Customer Journey */}
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-6 mt-4 border border-white/10">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Understanding the Customer Journey
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                When people ask AI assistants questions, they're at different stages of their buying journey. 
                By testing questions from each stage, you'll see how AI influences customers <strong>from first discovery to final purchase</strong>.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* Awareness */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔍</span>
                    <span className="font-bold text-blue-400">Awareness</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{stageInfo.awareness.longDesc}</p>
                  <div className="bg-black/20 rounded p-2 mb-2">
                    <p className="text-xs text-blue-300 italic">{stageInfo.awareness.userMindset}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    <strong className="text-blue-400">Why it matters:</strong> {stageInfo.awareness.whyItMatters}
                  </p>
                </div>

                {/* Consideration */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⚖️</span>
                    <span className="font-bold text-amber-400">Consideration</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{stageInfo.consideration.longDesc}</p>
                  <div className="bg-black/20 rounded p-2 mb-2">
                    <p className="text-xs text-amber-300 italic">{stageInfo.consideration.userMindset}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    <strong className="text-amber-400">Why it matters:</strong> {stageInfo.consideration.whyItMatters}
                  </p>
                </div>

                {/* Decision */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✅</span>
                    <span className="font-bold text-green-400">Decision</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{stageInfo.decision.longDesc}</p>
                  <div className="bg-black/20 rounded p-2 mb-2">
                    <p className="text-xs text-green-300 italic">{stageInfo.decision.userMindset}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    <strong className="text-green-400">Why it matters:</strong> {stageInfo.decision.whyItMatters}
                  </p>
                </div>
              </div>

              <div className="mt-4 bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 text-center">
                  💡 <strong>Pro tip:</strong> For a complete picture, select at least one question from each stage. 
                  However, you can focus on specific stages if you have particular concerns (e.g., only Decision stage if you're worried about purchase intent).
                </p>
              </div>
            </div>

            {/* 3-Column Grid for Questions */}
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {questionGroups.map((group) => {
                const stageSelected = selectedQuestions[group.stage]?.length || 0;
                const allQuestions = [...group.brandQuestions, ...group.categoryQuestions];
                const hasSelection = stageSelected > 0;
                
                return (
                  <div 
                    key={group.stage} 
                    className={`rounded-xl border-2 transition-all ${
                      hasSelection 
                        ? "border-purple-500/50 bg-purple-500/5" 
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {/* Column Header */}
                    <div className={`p-4 border-b ${
                      hasSelection ? "border-purple-500/30 bg-purple-500/10" : "border-white/10 bg-white/5"
                    } rounded-t-xl`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold">{stageInfo[group.stage].label}</h3>
                          <p className="text-xs text-gray-400 font-medium">{stageInfo[group.stage].shortDesc}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          hasSelection ? "bg-purple-600 text-white" : "bg-white/20"
                        }`}>
                          {stageSelected} selected
                        </span>
                      </div>
                      <div className="bg-black/20 rounded-lg p-2 mb-2">
                        <p className="text-xs text-gray-300 italic">{stageInfo[group.stage].userMindset}</p>
                      </div>
                      <p className="text-xs text-gray-500">{group.stageDescription}</p>
                    </div>
                    
                    {/* Questions List */}
                    <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                      {/* Real Data Questions Section */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Real Search Data</span>
                        </div>
                        {allQuestions.filter(q => q.source === "real_data").map((q) => {
                          const isSelected = selectedQuestions[group.stage]?.find(sq => sq.id === q.id);
                          
                          return (
                            <div
                              key={q.id}
                              onClick={() => toggleQuestion(q, group.stage)}
                              className={`p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                                isSelected
                                  ? "bg-purple-600/40 border-2 border-purple-400 shadow-lg shadow-purple-500/20"
                                  : "bg-white/5 hover:bg-white/10 border-2 border-transparent hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm ${isSelected ? "text-white font-medium" : "text-gray-200"}`}>
                                  {q.question}
                                </span>
                                {isSelected && (
                                  <span className="text-purple-300 text-lg">✓</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  q.type === "brand" ? "bg-purple-500/30 text-purple-300" : "bg-blue-500/30 text-blue-300"
                                }`}>
                                  {q.type === "brand" ? "Brand" : "Category"}
                                </span>
                                <span className="text-xs text-green-400 font-semibold">
                                  {formatVolume(q.searchVolume)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Strategic Questions Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Strategic Questions</span>
                        </div>
                        {allQuestions.filter(q => q.source === "strategic").map((q) => {
                          const isSelected = selectedQuestions[group.stage]?.find(sq => sq.id === q.id);
                          
                          return (
                            <div
                              key={q.id}
                              onClick={() => toggleQuestion(q, group.stage)}
                              className={`p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                                isSelected
                                  ? "bg-purple-600/40 border-2 border-purple-400 shadow-lg shadow-purple-500/20"
                                  : "bg-white/5 hover:bg-white/10 border-2 border-transparent hover:border-white/20"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm ${isSelected ? "text-white font-medium" : "text-gray-200"}`}>
                                  {q.question}
                                </span>
                                {isSelected && (
                                  <span className="text-purple-300 text-lg">✓</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  q.type === "brand" ? "bg-purple-500/30 text-purple-300" : "bg-blue-500/30 text-blue-300"
                                }`}>
                                  {q.type === "brand" ? "Brand" : "Category"}
                                </span>
                                <span className="text-xs text-amber-400/70">
                                  AI-crafted
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Platform selection */}
            <div className="bg-white/5 rounded-xl p-6 mt-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Select AI Platforms to Test</h3>
              
              <div className="grid grid-cols-3 gap-4">
                {(["ChatGPT", "Gemini", "Copilot"] as Platform[]).map((platform) => (
                  <div
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`p-4 rounded-lg cursor-pointer text-center transition-all ${
                      selectedPlatforms.includes(platform)
                        ? "bg-green-600/30 border-2 border-green-500"
                        : "bg-white/5 border-2 border-transparent hover:bg-white/10"
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {platform === "ChatGPT" && "🤖"}
                      {platform === "Gemini" && "✨"}
                      {platform === "Copilot" && "🔷"}
                    </div>
                    <div className="font-medium">{platform}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions - Also Sticky at Bottom */}
            <div className="sticky bottom-0 z-20 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-6 pb-4 mt-6">
              <div className="flex gap-4">
                <Button
                  onClick={() => setPhase(1)}
                  variant="outline"
                  className="flex-1 py-4 border-gray-600 bg-white/5"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleRunClick}
                  disabled={!canRunAnalysis()}
                  className={`flex-1 py-4 text-lg font-semibold ${
                    canRunAnalysis() 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30" 
                      : "bg-gray-700 cursor-not-allowed"
                  }`}
                >
                  {canRunAnalysis() 
                    ? `🚀 Run Analysis (${getTotalSelected()} questions × ${selectedPlatforms.length} platforms)` 
                    : getTotalSelected() === 0 
                      ? "Select at least 3 questions"
                      : `Select ${Math.max(0, 3 - getTotalSelected())} more questions`
                  }
                </Button>
              </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 border border-purple-500/30 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 text-center">📋 Confirm Your Selection</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      getSelectionBreakdown().awareness > 0 ? "bg-blue-500/20 border border-blue-500/30" : "bg-white/5"
                    }`}>
                      <span className="font-medium">🔍 Awareness</span>
                      <span className={`text-lg font-bold ${
                        getSelectionBreakdown().awareness > 0 ? "text-blue-400" : "text-gray-500"
                      }`}>
                        {getSelectionBreakdown().awareness} questions
                      </span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      getSelectionBreakdown().consideration > 0 ? "bg-amber-500/20 border border-amber-500/30" : "bg-white/5"
                    }`}>
                      <span className="font-medium">⚖️ Consideration</span>
                      <span className={`text-lg font-bold ${
                        getSelectionBreakdown().consideration > 0 ? "text-amber-400" : "text-gray-500"
                      }`}>
                        {getSelectionBreakdown().consideration} questions
                      </span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-3 rounded-lg ${
                      getSelectionBreakdown().decision > 0 ? "bg-green-500/20 border border-green-500/30" : "bg-white/5"
                    }`}>
                      <span className="font-medium">✅ Decision</span>
                      <span className={`text-lg font-bold ${
                        getSelectionBreakdown().decision > 0 ? "text-green-400" : "text-gray-500"
                      }`}>
                        {getSelectionBreakdown().decision} questions
                      </span>
                    </div>
                    
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="text-2xl font-bold text-purple-400">
                          {getSelectionBreakdown().total} questions
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Testing on {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""}: {selectedPlatforms.join(", ")}
                      </div>
                    </div>
                  </div>

                  {/* Warning if any stage is empty */}
                  {(getSelectionBreakdown().awareness === 0 || 
                    getSelectionBreakdown().consideration === 0 || 
                    getSelectionBreakdown().decision === 0) && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                      <p className="text-amber-400 text-sm">
                        ⚠️ Note: Some funnel stages have no questions selected. 
                        Your analysis will only cover the selected stages.
                      </p>
                    </div>
                  )}

                  <p className="text-center text-gray-300 mb-6">
                    Is this your final pick?
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmModal(false)}
                      variant="outline"
                      className="flex-1 py-3 border-gray-600 bg-white/5"
                    >
                      ← Go Back
                    </Button>
                    <Button
                      onClick={handleRunAnalysis}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 font-semibold"
                    >
                      ✓ Yes, Run Analysis
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 3: Running Analysis */}
        {phase === 3 && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Main Progress Card */}
            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-2xl p-8 border border-purple-500/30">
              {/* Header with Timers */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="text-5xl animate-pulse">🔬</div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Analysis Running</h2>
                    <p className="text-gray-400">Testing your questions on AI platforms...</p>
                  </div>
                </div>
                
                {/* Dual Timer Display */}
                <div className="flex gap-4">
                  {/* Countdown */}
                  <div className="text-center bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-xl px-4 py-2 border border-cyan-500/30">
                    <div className="text-3xl font-mono font-bold text-cyan-400">
                      {Math.floor(analysisCountdown / 60)}:{(analysisCountdown % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-cyan-300/70">remaining</div>
                  </div>
                  {/* Elapsed */}
                  <div className="text-center bg-white/5 rounded-xl px-4 py-2">
                    <div className="text-3xl font-mono font-bold text-purple-400">
                      {formatTime(elapsedTime)}
                    </div>
                    <div className="text-xs text-gray-500">elapsed</div>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-purple-400 font-bold">{analysisProgress}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>

              {/* Current Step */}
              <div className="bg-black/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300 font-mono">{currentStep || analysisStatus}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{getTotalSelected()}</div>
                  <div className="text-xs text-gray-500">Questions</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{selectedPlatforms.length}</div>
                  <div className="text-xs text-gray-500">AI Platforms</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-cyan-400">{getTotalSelected() * selectedPlatforms.length * 3}</div>
                  <div className="text-xs text-gray-500">Total Tests</div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Progress */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">ANALYSIS PIPELINE</h3>
              <div className="space-y-3">
                {[
                  { step: "Initialize", icon: "⚡", threshold: 5 },
                  { step: "Website Technical Audit", icon: "🔍", threshold: 10 },
                  { step: "Testing Awareness Questions", icon: "🧠", threshold: 35 },
                  { step: "Testing Consideration Questions", icon: "⚖️", threshold: 60 },
                  { step: "Testing Decision Questions", icon: "✅", threshold: 85 },
                  { step: "Analyzing Patterns", icon: "📊", threshold: 92 },
                  { step: "Generating Recommendations", icon: "💡", threshold: 98 },
                  { step: "Complete!", icon: "🎉", threshold: 100 },
                ].map((item, index) => {
                  const isComplete = analysisProgress >= item.threshold;
                  const isCurrent = analysisProgress >= (index > 0 ? [5, 10, 35, 60, 85, 92, 98, 100][index - 1] : 0) && analysisProgress < item.threshold;
                  
                  return (
                    <div key={item.step} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                      isCurrent ? "bg-purple-500/20 border border-purple-500/50" : 
                      isComplete ? "opacity-100" : "opacity-40"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
                        isComplete ? "bg-green-500/20" : 
                        isCurrent ? "bg-purple-500/20 animate-pulse" : "bg-white/5"
                      }`}>
                        {isComplete ? "✓" : item.icon}
                      </div>
                      <span className={`flex-1 text-sm ${isCurrent ? "text-white font-medium" : ""}`}>
                        {item.step}
                      </span>
                      {isCurrent && (
                        <div className="flex gap-1 items-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
                        </div>
                      )}
                      {isComplete && (
                        <span className="text-green-500 text-sm">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platforms Being Tested */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">PLATFORMS BEING TESTED</h3>
              <div className="flex justify-center gap-6">
                {selectedPlatforms.map((platform) => (
                  <div key={platform} className="flex flex-col items-center gap-2">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-white/10 ${
                      analysisProgress > 10 ? "animate-pulse" : ""
                    }`}>
                      {platform === "ChatGPT" && "🤖"}
                      {platform === "Gemini" && "✨"}
                      {platform === "Copilot" && "🔷"}
                    </div>
                    <span className="text-sm text-gray-400">{platform}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((dot) => (
                        <div 
                          key={dot} 
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            analysisProgress > 10 + (dot * 10) ? "bg-green-500" : "bg-gray-600"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimated Time */}
            <div className="text-center text-sm text-gray-500">
              <p>Estimated completion: 3-5 minutes</p>
              <p className="text-xs text-gray-600 mt-1">
                Each question is tested 3 times per platform (81 total AI responses)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
