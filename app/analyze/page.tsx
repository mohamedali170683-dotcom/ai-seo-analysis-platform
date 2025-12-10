"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Question {
  id: string;
  question: string;
  searchVolume: number;
  category: "awareness" | "consideration" | "decision";
  type: "brand" | "category";
}

interface QuestionGroup {
  stage: "awareness" | "consideration" | "decision";
  brandQuestions: Question[];
  categoryQuestions: Question[];
}

type Platform = "ChatGPT" | "Gemini" | "Copilot";

export default function AnalyzePage() {
  // Form state
  const [brandName, setBrandName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [competitors, setCompetitors] = useState("");

  // Phase tracking
  const [phase, setPhase] = useState<1 | 2 | 3>(1); // 1=setup, 2=select questions, 3=select platforms & run

  // Question discovery
  const [loading, setLoading] = useState(false);
  const [questionGroups, setQuestionGroups] = useState<QuestionGroup[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

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

  // Toggle question selection
  const toggleQuestion = (question: Question) => {
    setSelectedQuestions(prev => {
      const exists = prev.find(q => q.id === question.id);
      if (exists) {
        return prev.filter(q => q.id !== question.id);
      }
      if (prev.length >= 4) {
        alert("Maximum 4 questions allowed");
        return prev;
      }
      return [...prev, question];
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

  // Phase 2: Run analysis
  const handleRunAnalysis = async () => {
    if (selectedQuestions.length === 0) {
      alert("Please select at least 1 question");
      return;
    }

    setLoading(true);
    setPhase(3);

    try {
      const response = await fetch("/api/analysis/run-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName,
          domain,
          category,
          competitors: competitors.split(",").map(c => c.trim()).filter(Boolean),
          selectedQuestions: selectedQuestions.map(q => ({
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
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(1)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  // Stage labels
  const stageLabels = {
    awareness: "🔍 Awareness",
    consideration: "⚖️ Consideration",
    decision: "✅ Decision",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">AI Visibility Analysis</h1>
        <p className="text-gray-400 mb-8">Measure your brand's visibility in AI chatbots</p>

        {/* Phase indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${phase >= 1 ? "text-purple-400" : "text-gray-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase >= 1 ? "bg-purple-600" : "bg-gray-700"}`}>1</div>
            <span>Setup</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-700" />
          <div className={`flex items-center gap-2 ${phase >= 2 ? "text-purple-400" : "text-gray-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase >= 2 ? "bg-purple-600" : "bg-gray-700"}`}>2</div>
            <span>Select Questions</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-700" />
          <div className={`flex items-center gap-2 ${phase >= 3 ? "text-purple-400" : "text-gray-600"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${phase >= 3 ? "bg-purple-600" : "bg-gray-700"}`}>3</div>
            <span>Analyze</span>
          </div>
        </div>

        {/* Phase 1: Setup */}
        {phase === 1 && (
          <div className="bg-white/5 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Enter Brand Details</h2>
            
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
              <label className="block text-sm text-gray-400 mb-1">Competitors (comma-separated)</label>
              <input
                type="text"
                value={competitors}
                onChange={(e) => setCompetitors(e.target.value)}
                placeholder="e.g., Adidas, Puma"
                className="w-full bg-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <Button
              onClick={handleDiscoverQuestions}
              disabled={loading || !brandName || !category}
              className="w-full bg-purple-600 hover:bg-purple-700 py-3 mt-4"
            >
              {loading ? "Discovering Questions..." : "Discover Questions →"}
            </Button>
          </div>
        )}

        {/* Phase 2: Select Questions */}
        {phase === 2 && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select Questions to Test</h2>
                <span className="text-purple-400">{selectedQuestions.length}/4 selected</span>
              </div>
              <p className="text-gray-400 mb-6">Choose up to 4 questions. We recommend mixing brand and category questions.</p>

              {questionGroups.map((group) => (
                <div key={group.stage} className="mb-8">
                  <h3 className="text-lg font-medium mb-3">{stageLabels[group.stage]}</h3>
                  
                  {/* Brand questions */}
                  {group.brandQuestions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-purple-400 mb-2">Brand Questions</p>
                      <div className="space-y-2">
                        {group.brandQuestions.map((q) => (
                          <div
                            key={q.id}
                            onClick={() => toggleQuestion(q)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedQuestions.find(sq => sq.id === q.id)
                                ? "bg-purple-600/30 border border-purple-500"
                                : "bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="flex-1">{q.question}</span>
                              <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                                {formatVolume(q.searchVolume)}/mo
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category questions */}
                  {group.categoryQuestions.length > 0 && (
                    <div>
                      <p className="text-sm text-blue-400 mb-2">Category Questions</p>
                      <div className="space-y-2">
                        {group.categoryQuestions.map((q) => (
                          <div
                            key={q.id}
                            onClick={() => toggleQuestion(q)}
                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                              selectedQuestions.find(sq => sq.id === q.id)
                                ? "bg-blue-600/30 border border-blue-500"
                                : "bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="flex-1">{q.question}</span>
                              <span className="text-sm text-gray-400 ml-4 whitespace-nowrap">
                                {formatVolume(q.searchVolume)}/mo
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Platform selection */}
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Select AI Chatbots</h2>
              <p className="text-gray-400 mb-4">Choose which AI platforms to test your questions on.</p>
              
              <div className="flex gap-4">
                {(["ChatGPT", "Gemini", "Copilot"] as Platform[]).map((platform) => (
                  <div
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`flex-1 p-4 rounded-lg cursor-pointer text-center transition-all ${
                      selectedPlatforms.includes(platform)
                        ? "bg-green-600/30 border border-green-500"
                        : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {platform === "ChatGPT" && "🤖"}
                      {platform === "Gemini" && "✨"}
                      {platform === "Copilot" && "🔷"}
                    </div>
                    <div className="font-medium">{platform}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setPhase(1)}
                variant="outline"
                className="flex-1 py-3"
              >
                ← Back
              </Button>
              <Button
                onClick={handleRunAnalysis}
                disabled={selectedQuestions.length === 0 || selectedPlatforms.length === 0}
                className="flex-1 bg-purple-600 hover:bg-purple-700 py-3"
              >
                Run Analysis ({selectedQuestions.length} questions × {selectedPlatforms.length} platforms) →
              </Button>
            </div>
          </div>
        )}

        {/* Phase 3: Running Analysis */}
        {phase === 3 && (
          <div className="bg-white/5 rounded-xl p-8 text-center">
            <div className="text-6xl mb-6">🔬</div>
            <h2 className="text-2xl font-semibold mb-4">Analyzing AI Visibility</h2>
            <p className="text-gray-400 mb-6">{analysisStatus}</p>
            
            <div className="w-full bg-white/10 rounded-full h-4 mb-4">
              <div
                className="bg-purple-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <p className="text-purple-400">{analysisProgress}% complete</p>

            <div className="mt-8 text-sm text-gray-500">
              Testing {selectedQuestions.length} questions on {selectedPlatforms.join(", ")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
