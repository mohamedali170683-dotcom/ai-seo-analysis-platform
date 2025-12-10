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

  // Analysis state
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>("");
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Phase 1: Discover questions
  const handleDiscoverQuestions = async () => {
    if (!brandName || !category) {
      alert("Please enter brand name and category");
      return;
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  // Toggle question selection (max 3 per stage)
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
      
      if (stageQuestions.length >= 3) {
        alert(`Maximum 3 questions per stage. Deselect one first.`);
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

  // Check if ready to run
  const canRunAnalysis = () => {
    return selectedQuestions.awareness.length === 3 &&
           selectedQuestions.consideration.length === 3 &&
           selectedQuestions.decision.length === 3 &&
           selectedPlatforms.length > 0;
  };

  // Phase 2: Run analysis
  const handleRunAnalysis = async () => {
    if (!canRunAnalysis()) {
      alert("Please select 3 questions per stage (9 total)");
      return;
    }

    setLoading(true);
    setPhase(3);

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
          testsPerPlatform: 5,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisId(data.analysisId);
        pollAnalysisStatus(data.analysisId);
      } else {
        alert(data.error || "Failed to start analysis");
        setPhase(2);
      }
    } catch (error) {
      alert("Error starting analysis");
      setPhase(2);
    } finally {
      setLoading(false);
    }
  };

  // Poll for analysis status
  const pollAnalysisStatus = async (id: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/analysis/${id}`);
        const data = await response.json();

        setAnalysisStatus(data.currentStep || "Processing...");
        setAnalysisProgress(data.progress || 0);

        if (data.status === "completed") {
          window.location.href = `/results/${id}`;
        } else if (data.status === "failed") {
          alert("Analysis failed: " + data.currentStep);
          setPhase(2);
        } else {
          setTimeout(poll, 3000);
        }
      } catch (error) {
        setTimeout(poll, 5000);
      }
    };
    poll();
  };

  // Format search volume
  const formatVolume = (vol: number) => {
    if (vol === 0) return "Strategic";
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M/mo`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K/mo`;
    return `${vol}/mo`;
  };

  // Stage labels and icons
  const stageInfo = {
    awareness: { label: "🔍 Awareness", color: "blue" },
    consideration: { label: "⚖️ Consideration", color: "yellow" },
    decision: { label: "✅ Decision", color: "green" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2">
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold">Vercel Analysis</h1>
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
              <h2 className="text-3xl font-bold mb-4">Take Control of Your Vercel Analysis</h2>
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
                className="w-full bg-purple-600 hover:bg-purple-700 py-4 text-lg mt-6"
              >
                {loading ? "Discovering Questions..." : "Discover Questions →"}
              </Button>
            </div>

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
                  <span>You'll see search volumes and select 3 questions per funnel stage (9 total)</span>
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
                    <p className="text-gray-300">Choose 3 questions per funnel stage (9 total)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-5 py-2.5 rounded-xl font-bold text-lg ${
                      getTotalSelected() === 9 
                        ? "bg-green-600 text-white" 
                        : "bg-white/20 text-white"
                    }`}>
                      {getTotalSelected()}/9 selected
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

            {/* 3-Column Grid for Questions */}
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {questionGroups.map((group) => {
                const stageSelected = selectedQuestions[group.stage]?.length || 0;
                const allQuestions = [...group.brandQuestions, ...group.categoryQuestions];
                const isComplete = stageSelected === 3;
                
                return (
                  <div 
                    key={group.stage} 
                    className={`rounded-xl border-2 transition-all ${
                      isComplete 
                        ? "border-green-500/50 bg-green-500/5" 
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    {/* Column Header */}
                    <div className={`p-4 border-b ${
                      isComplete ? "border-green-500/30 bg-green-500/10" : "border-white/10 bg-white/5"
                    } rounded-t-xl`}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold">{stageInfo[group.stage].label}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isComplete ? "bg-green-600 text-white" : "bg-white/20"
                        }`}>
                          {stageSelected}/3
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{group.stageDescription}</p>
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
                  onClick={handleRunAnalysis}
                  disabled={!canRunAnalysis()}
                  className={`flex-1 py-4 text-lg font-semibold ${
                    canRunAnalysis() 
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/30" 
                      : "bg-gray-700 cursor-not-allowed"
                  }`}
                >
                  {canRunAnalysis() 
                    ? `🚀 Run Analysis (9 questions × ${selectedPlatforms.length} platforms)` 
                    : `Select ${9 - getTotalSelected()} more questions`
                  }
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3: Running Analysis */}
        {phase === 3 && (
          <div className="bg-white/5 rounded-xl p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🔬</div>
            <h2 className="text-2xl font-bold mb-4">Vercel Analysis in Progress</h2>
            <p className="text-gray-400 mb-6">{analysisStatus}</p>
            
            <div className="w-full bg-white/10 rounded-full h-4 mb-4">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <p className="text-purple-400 text-lg font-semibold">{analysisProgress}% complete</p>

            <div className="mt-8 text-sm text-gray-500 space-y-1">
              <p>Testing 9 questions across {selectedPlatforms.join(", ")}</p>
              <p>Each question tested 5 times per platform for statistical reliability</p>
              <p className="text-xs text-gray-400">Total: 135 AI responses analyzed</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
