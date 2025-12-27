"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Lock, Sparkles, ChevronDown, Loader2, User, Wand2 } from "lucide-react";
import { useTier } from "@/lib/tier";
import { UpgradeModal, PremiumBadge } from "@/components/UpgradeModal";
import { UpgradeModalTrigger } from "@/lib/tier/types";
import { useI18n } from "@/lib/i18n-context";

// Suggested persona interface
interface SuggestedPersona {
  id: string;
  name: string;
  motivation: string;
  characteristics: string[];
}

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

type Platform = "ChatGPT" | "Gemini" | "Perplexity";

export default function AnalyzePage() {
  // Tier management
  const { tier, limits, isStageAllowed, isPlatformAllowed } = useTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<UpgradeModalTrigger>("funnel_stages");

  // i18n
  const { t } = useI18n();

  // Form state
  const [brandName, setBrandName] = useState("");
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState("");
  const [targetCountry, setTargetCountry] = useState("US");
  const [questionLanguage, setQuestionLanguage] = useState("en");
  const [competitors, setCompetitors] = useState("");
  
  // AI Persona suggestions - simplified approach
  const [suggestedPersonas, setSuggestedPersonas] = useState<SuggestedPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState("");
  const [customPersona, setCustomPersona] = useState("");
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [showCustomPersona, setShowCustomPersona] = useState(false);
  
  // Generate AI persona suggestions when category changes
  const generatePersonaSuggestions = useCallback(async (categoryValue: string) => {
    if (!categoryValue || categoryValue.length < 3) {
      setSuggestedPersonas([]);
      return;
    }
    
    setLoadingPersonas(true);
    try {
      const response = await fetch("/api/analysis/suggest-personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryValue, brandName }),
      });
      
      const data = await response.json();
      if (data.success && data.personas) {
        setSuggestedPersonas(data.personas);
      }
    } catch (error) {
      console.error("Failed to get persona suggestions:", error);
    } finally {
      setLoadingPersonas(false);
    }
  }, [brandName]);
  
  // Debounced category change handler
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSelectedPersona("");
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      generatePersonaSuggestions(value);
    }, 800);
    return () => clearTimeout(timeoutId);
  };
  
  // Get effective persona (selected or custom)
  const getEffectivePersona = () => {
    if (showCustomPersona && customPersona) {
      return customPersona;
    }
    return selectedPersona;
  };

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
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["ChatGPT", "Gemini", "Perplexity"]);

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

  // Helper to show upgrade modal
  const openUpgradeModal = (trigger: UpgradeModalTrigger) => {
    setUpgradeModalTrigger(trigger);
    setShowUpgradeModal(true);
  };

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
          targetCountry, // Add country for geo-specific responses
          questionLanguage, // Language for questions and responses
          competitors: limits.maxCompetitors > 0 ? competitors.split(",").map(c => c.trim()).filter(Boolean).slice(0, limits.maxCompetitors) : [],
          tier, // Pass tier to control real data vs strategic questions
          // Persona context for question generation (simplified)
          subcategory: category, // Use category as subcategory
          buyerPersona: getEffectivePersona(),
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

  // Toggle question selection with tier limits
  const toggleQuestion = (question: Question, stage: "awareness" | "consideration" | "decision") => {
    // Check if stage is allowed for this tier
    if (!isStageAllowed(stage)) {
      openUpgradeModal(stage as UpgradeModalTrigger);
      return;
    }

    // Real search data is now available for ALL tiers (including free)

    setSelectedQuestions(prev => {
      const stageQuestions = prev[stage] || [];
      const exists = stageQuestions.find(q => q.id === question.id);
      
      if (exists) {
        return {
          ...prev,
          [stage]: stageQuestions.filter(q => q.id !== question.id),
        };
      }
      
      // Check tier limit for total questions
      const currentTotal = getTotalSelected();
      if (currentTotal >= limits.maxQuestions) {
        openUpgradeModal("question_limit");
        return prev;
      }
      
      // Allow up to 6 per stage for paid, 3 total for free
      const maxPerStage = tier === "free" ? limits.maxQuestions : 6;
      if (stageQuestions.length >= maxPerStage) {
        if (tier === "free") {
          openUpgradeModal("question_limit");
        } else {
          alert(`Maximum ${maxPerStage} questions per stage. Deselect one first.`);
        }
        return prev;
      }
      
      return {
        ...prev,
        [stage]: [...stageQuestions, question],
      };
    });
  };

  // Toggle platform selection with tier limits
  const togglePlatform = (platform: Platform) => {
    // Check if platform is allowed for this tier
    if (!isPlatformAllowed(platform)) {
      openUpgradeModal(platform.toLowerCase() as UpgradeModalTrigger);
      return;
    }

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
          targetCountry, // Add country for geo-specific analysis
          questionLanguage, // Language for questions and responses
          competitors: limits.maxCompetitors > 0 ? competitors.split(",").map(c => c.trim()).filter(Boolean).slice(0, limits.maxCompetitors) : [],
          selectedQuestions: allQuestions.map(q => ({
            question: q.question,
            searchVolume: q.searchVolume,
            category: q.category,
            type: q.type,
          })),
          selectedPlatforms: selectedPlatforms.filter(p => isPlatformAllowed(p)),
          testsPerPlatform: limits.testsPerQuestion,
          tier, // Pass tier for backend validation
          // Persona context (simplified)
          subcategory: category,
          buyerPersona: getEffectivePersona(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Redirect immediately to results page instead of polling here
        window.location.href = `/results/${data.analysisId}`;
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
        
        // API returns data nested under 'analysis' key
        const analysis = data.analysis || data;
        
        setAnalysisStatus(analysis.currentStep || "Processing...");
        setCurrentStep(analysis.currentStep || "Processing...");
        setAnalysisProgress(analysis.progress || 0);

        if (analysis.status === "completed") {
          clearInterval(timerInterval);
          window.location.href = `/results/${id}`;
        } else if (analysis.status === "failed") {
          clearInterval(timerInterval);
          alert("Analysis failed: " + (analysis.currentStep || "Unknown error"));
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
    if (vol === 0) return "AI-Generated";
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
    <div className="min-h-screen bg-[#F5F5F7] text-gray-900 dark:text-gray-100">
      {/* Header - Apple Style */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 flex items-center gap-2 transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Velaris</h1>
          <div className="w-32" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Phase indicator - Apple Style */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { num: 1, label: "Setup" },
            { num: 2, label: "Select Questions" },
            { num: 3, label: "Analyze" },
          ].map((step, i) => (
            <div key={step.num} className="flex items-center">
              <div className={`flex items-center gap-2 ${phase >= step.num ? "text-blue-600" : "text-gray-400"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  phase >= step.num ? "bg-blue-500" : "bg-gray-300"
                }`}>
                  {phase > step.num ? "✓" : step.num}
                </div>
                <span className="hidden sm:inline font-medium">{step.label}</span>
              </div>
              {i < 2 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${phase > step.num ? "bg-blue-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Phase 1: Setup */}
        {phase === 1 && (
          <div className="space-y-8">
            {/* Tier Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                tier === "free" 
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" 
                  : "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {tier === "free" ? (
                  <>🔍 AI Visibility Check (Free)</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Full AI Visibility Audit</>
                )}
              </div>
              {tier === "free" && (
                <button
                  onClick={() => openUpgradeModal("funnel_stages")}
                  className="text-sm text-cyan-400 hover:text-cyan-300 underline"
                >
                  Upgrade to Full Audit →
                </button>
              )}
            </div>

            {/* Value Proposition - Apple Style */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                {tier === "free" ? "Get Your AI Visibility Check" : "Take Control of Your AI Visibility"}
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                See how AI platforms discuss your brand across ChatGPT, Gemini, Copilot & Perplexity.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">Real Search Data</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Questions people actually search
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">4 AI Platforms</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ChatGPT, Gemini, Copilot & Perplexity
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="text-3xl mb-3">🔬</div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">You Choose</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tier === "free" 
                      ? "Up to 3 questions • Awareness stage" 
                      : "Unlimited questions across the journey"
                    }
                  </p>
                </div>
              </div>
              
              {/* Free tier limitations notice */}
              {tier === "free" && (
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-amber-800">Free Tier</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Full visibility scores included. Upgrade to unlock detailed recommendations & all funnel stages.
                  </p>
                </div>
              )}
            </div>

            {/* Form - Apple Style */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 space-y-6 max-w-xl mx-auto shadow-lg border border-gray-100">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Enter Your Brand Details</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{ t('form.subtitle')}</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('form.brandName')} *</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder={t('form.brandPlaceholder')}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  />
                </div>

                {/* Category / Vertical - Simple text input with AI suggestions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("form.category")} *</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    placeholder={t("form.categoryPlaceholder")}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {t('form.categoryHelp')}
                  </p>
                </div>

                {/* AI-Generated Persona Suggestions */}
                {(loadingPersonas || suggestedPersonas.length > 0) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-purple-500" />
                      Suggested Buyer Personas
                      {loadingPersonas && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    </label>

                    {loadingPersonas ? (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                        Generating AI persona suggestions...
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {suggestedPersonas.map((persona) => (
                          <button
                            key={persona.id}
                            type="button"
                            onClick={() => {
                              setSelectedPersona(persona.name);
                              setShowCustomPersona(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                              selectedPersona === persona.name
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <User className={`w-4 h-4 ${selectedPersona === persona.name ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`} />
                              <span className="font-medium text-gray-900 dark:text-gray-100">{persona.name}</span>
                              {selectedPersona === persona.name && (
                                <span className="ml-auto text-blue-600 dark:text-blue-400 text-xs font-semibold">Selected</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{persona.motivation}</p>
                          </button>
                        ))}
                        
                        {/* Option to use no persona or custom */}
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPersona("");
                              setShowCustomPersona(false);
                            }}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${
                              !selectedPersona && !showCustomPersona
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                            }`}
                          >
                            All personas
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomPersona(true);
                              setSelectedPersona("");
                            }}
                            className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${
                              showCustomPersona
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                            }`}
                          >
                            Custom persona
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Persona Input (shown when user clicks "Custom persona") */}
                {showCustomPersona && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Custom Persona</label>
                    <input
                      type="text"
                      value={customPersona}
                      onChange={(e) => setCustomPersona(e.target.value)}
                      placeholder="e.g., Budget-conscious first-time buyer"
                      className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Describe the buyer persona you want to focus on
                    </p>
                  </div>
                )}

                {/* Country / Target Market */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("form.country")} *</label>
                  <select
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="GB">🇬🇧 United Kingdom</option>
                    <option value="CA">🇨🇦 Canada</option>
                    <option value="AU">🇦🇺 Australia</option>
                    <option value="DE">🇩🇪 Germany</option>
                    <option value="FR">🇫🇷 France</option>
                    <option value="ES">🇪🇸 Spain</option>
                    <option value="IT">🇮🇹 Italy</option>
                    <option value="NL">🇳🇱 Netherlands</option>
                    <option value="SE">🇸🇪 Sweden</option>
                    <option value="JP">🇯🇵 Japan</option>
                    <option value="KR">🇰🇷 South Korea</option>
                    <option value="SG">🇸🇬 Singapore</option>
                    <option value="IN">🇮🇳 India</option>
                    <option value="BR">🇧🇷 Brazil</option>
                    <option value="MX">🇲🇽 Mexico</option>
                    <option value="AE">🇦🇪 United Arab Emirates</option>
                    <option value="SA">🇸🇦 Saudi Arabia</option>
                  </select>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {t('form.countryHelp')}
                  </p>
                </div>

                {/* Question Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("form.questionLanguage")} *</label>
                  <select
                    value={questionLanguage}
                    onChange={(e) => setQuestionLanguage(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="de">🇩🇪 German (Deutsch)</option>
                    <option value="fr">🇫🇷 French (Français)</option>
                    <option value="es">🇪🇸 Spanish (Español)</option>
                    <option value="it">🇮🇹 Italian (Italiano)</option>
                    <option value="pt">🇵🇹 Portuguese (Português)</option>
                    <option value="nl">🇳🇱 Dutch (Nederlands)</option>
                    <option value="ja">🇯🇵 Japanese (日本語)</option>
                    <option value="ko">🇰🇷 Korean (한국어)</option>
                    <option value="zh">🇨🇳 Chinese (中文)</option>
                  </select>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {t('form.questionLanguageHelp')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t("form.domain")} ({t("common.optional")})</label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder={t("form.domainPlaceholder")}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('form.domainHelp')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('form.competitors')} ({t('common.optional')})
                    {tier === "free" && <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-2">1 in Free tier</span>}
                  </label>
                  <input
                    type="text"
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    placeholder={tier === "free" ? t('form.competitorsFree') : t('form.competitorsPlaceholder')}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {tier === "free"
                      ? "Compare with 1 competitor. Upgrade for more."
                      : t('form.competitorsHelp', { max: limits.maxCompetitors.toString() })
                    }
                  </p>
                </div>
              </div>

              <Button
                onClick={handleDiscoverQuestions}
                disabled={loading || !brandName || !category}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg mt-6 font-semibold rounded-xl transition-all hover:scale-[1.02] shadow-lg"
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
                  <span>Find My Brand's Questions →</span>
                )}
              </Button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Takes about 30 seconds
              </p>
            </div>

            {/* Discovery Loading Overlay - Apple Style */}
            {loading && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                  <div className="text-5xl mb-4">{discoveryCountdown <= 0 ? "🤔" : "🔍"}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {discoveryCountdown <= 0 ? "Still Working..." : "Finding Questions"}
                  </h3>
                  
                  <p className="text-gray-500 mb-6">
                    Discovering questions for <strong className="text-blue-600">{brandName}</strong>
                  </p>
                  
                  {/* Simple Countdown */}
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-blue-500 font-mono">
                      {discoveryCountdown > 0 ? `${discoveryCountdown}s` : "Almost done..."}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex justify-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}

            {/* How it works - Apple Style */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">How It Works</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Discover real search questions</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Select questions to test</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Test on 4 AI platforms</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">4</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get visibility scores</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase 2: Select Questions - Apple Style */}
        {phase === 2 && (
          <div className="space-y-6">
            {/* Sticky Header */}
            <div className="sticky top-16 z-20 bg-[#F5F5F7]/95 backdrop-blur-xl pb-4 pt-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Select Questions to Test</h2>
                    <p className="text-gray-500 dark:text-gray-400">Minimum 3 questions from any stage</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-5 py-2.5 rounded-full font-bold text-lg transition-all ${
                      getTotalSelected() >= 3 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-100 text-gray-600 dark:text-gray-400"
                    }`}>
                      {getTotalSelected()} / 3 minimum {getTotalSelected() >= 3 && "✓"}
                    </div>
                  </div>
                </div>
                
                {/* Simple Legend */}
                <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Real Search Data (with volume)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI-Generated Questions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified Stage Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold text-purple-800">Awareness</h4>
                <p className="text-xs text-purple-600">"What is...?"</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">⚖️</div>
                <h4 className="font-semibold text-orange-800 dark:text-orange-200">Consideration</h4>
                <p className="text-xs text-orange-600">"Best...?"</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <div className="text-2xl mb-2">✅</div>
                <h4 className="font-semibold text-green-800">Decision</h4>
                <p className="text-xs text-green-600">"Should I buy...?"</p>
              </div>
            </div>

            {/* 3-Column Grid for Questions - Apple Style */}
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {questionGroups.map((group) => {
                const stageSelected = selectedQuestions[group.stage]?.length || 0;
                const allQuestions = [...group.brandQuestions, ...group.categoryQuestions];
                const hasSelection = stageSelected > 0;
                const isLocked = !isStageAllowed(group.stage);
                
                const stageColors = {
                  awareness: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", accent: "text-purple-600", selected: "bg-purple-100 border-purple-400" },
                  consideration: { bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-800", accent: "text-orange-600", selected: "bg-orange-100 border-orange-400" },
                  decision: { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800", accent: "text-green-600", selected: "bg-green-100 border-green-400" },
                };
                const colors = stageColors[group.stage];
                
                return (
                  <div 
                    key={group.stage} 
                    className={`rounded-2xl border transition-all relative bg-white shadow-sm ${
                      isLocked 
                        ? "border-gray-200 dark:border-gray-700 opacity-60" 
                        : hasSelection 
                          ? `${colors.border} shadow-md` 
                          : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {/* Locked Overlay for restricted stages */}
                    {isLocked && (
                      <div 
                        className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 rounded-2xl flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => openUpgradeModal(group.stage as UpgradeModalTrigger)}
                      >
                        <div className="bg-gray-100 rounded-full p-4 mb-3">
                          <Lock className="w-6 h-6 text-gray-400" />
                        </div>
                        <span className="text-base font-semibold text-gray-700 mb-1">
                          {group.stage === "consideration" ? "Consideration" : "Decision"}
                        </span>
                        <span className="text-sm text-gray-500 mb-3">Upgrade to unlock</span>
                        <span className="text-xs text-blue-500 flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3" /> Unlock now
                        </span>
                      </div>
                    )}
                    {/* Column Header */}
                    <div className={`p-4 border-b border-gray-100 ${colors.bg} rounded-t-2xl`}>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-base font-bold ${colors.accent}`}>{stageInfo[group.stage].label}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          hasSelection ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500 dark:text-gray-400"
                        }`}>
                          {stageSelected}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stageInfo[group.stage].userMindset}</p>
                    </div>
                    
                    {/* Questions List */}
                    <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                      {/* Real Data Questions Section */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Real Search Data</span>
                        </div>
                        {allQuestions.filter(q => q.source === "real_data").map((q) => {
                          const isSelected = selectedQuestions[group.stage]?.find(sq => sq.id === q.id);
                          
                          return (
                            <div
                              key={q.id}
                              onClick={() => toggleQuestion(q, group.stage)}
                              className={`p-3 rounded-xl cursor-pointer transition-all mb-2 border ${
                                isSelected
                                  ? `${colors.selected} border-2`
                                  : "bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm ${isSelected ? "text-gray-900 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                                  {q.question}
                                </span>
                                {isSelected && (
                                  <span className="text-blue-500 text-base">✓</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-green-600 font-medium">
                                  {formatVolume(q.searchVolume)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* AI-Generated Questions Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">AI-Generated</span>
                        </div>
                        {allQuestions.filter(q => q.source === "strategic").map((q) => {
                          const isSelected = selectedQuestions[group.stage]?.find(sq => sq.id === q.id);
                          
                          return (
                            <div
                              key={q.id}
                              onClick={() => toggleQuestion(q, group.stage)}
                              className={`p-3 rounded-xl cursor-pointer transition-all mb-2 border ${
                                isSelected
                                  ? `${colors.selected} border-2`
                                  : "bg-gray-50 border-gray-100 hover:bg-gray-100 hover:border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm ${isSelected ? "text-gray-900 font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                                  {q.question}
                                </span>
                                {isSelected && (
                                  <span className="text-blue-500 text-base">✓</span>
                                )}
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

            {/* Platform selection - Apple Style */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mt-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">AI Platforms to Test</h3>
              
              <div className="grid grid-cols-3 gap-4">
                {(["ChatGPT", "Gemini", "Perplexity"] as Platform[]).map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  
                  return (
                    <div
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`p-4 rounded-xl cursor-pointer text-center transition-all border ${
                        isSelected
                          ? "bg-green-50 border-2 border-green-400 shadow-sm"
                          : "bg-gray-50 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-3xl mb-2">
                        {platform === "ChatGPT" && "🤖"}
                        {platform === "Gemini" && "✨"}
                        {platform === "Perplexity" && "🔮"}
                      </div>
                      <div className="font-medium text-gray-700 dark:text-gray-300">{platform}</div>
                      {isSelected && (
                        <div className="text-xs text-green-600 mt-1 font-medium">✓ Selected</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                All 4 platforms included. Test on all for complete visibility.
              </p>
            </div>

            {/* FAQ Section - Questions Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mt-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 font-medium hover:text-gray-900 list-none flex items-center justify-between">
                    Why select questions from different funnel stages?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-2 text-sm text-gray-500 pl-4 border-l-2 border-gray-100">
                    Users ask AI different questions at each stage of their buying journey. Awareness questions like "What is...?" help you get discovered. 
                    Consideration questions like "Best...?" determine if you're being compared. Decision questions like "Should I buy...?" directly influence purchases.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 font-medium hover:text-gray-900 list-none flex items-center justify-between">
                    What's the difference between Real Search and AI-Generated questions?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-2 text-sm text-gray-500 pl-4 border-l-2 border-gray-100">
                    Real Search Data comes from actual search queries with monthly volume data. AI-Generated questions are intelligently crafted to probe specific brand positioning aspects that users might not search directly but AI considers when forming opinions.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-gray-700 font-medium hover:text-gray-900 list-none flex items-center justify-between">
                    How many questions should I select?
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-2 text-sm text-gray-500 pl-4 border-l-2 border-gray-100">
                    Minimum 3 questions are required. For a complete picture, we recommend 2-3 questions from each stage (6-9 total). 
                    You can also focus on a single stage if that's your priority.
                  </p>
                </details>
              </div>
            </div>

            {/* Actions - Apple Style Sticky Bottom */}
            <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#F5F5F7] via-[#F5F5F7]/95 to-transparent pt-6 pb-4 mt-6">
              <div className="flex gap-4">
                <Button
                  onClick={() => setPhase(1)}
                  variant="outline"
                  className="flex-1 py-4 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  ← Back
                </Button>
                <Button
                  onClick={handleRunClick}
                  disabled={!canRunAnalysis()}
                  className={`flex-1 py-4 text-lg font-semibold rounded-xl transition-all ${
                    canRunAnalysis() 
                      ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:scale-[1.02]" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {canRunAnalysis() 
                    ? `Run My Analysis →` 
                    : getTotalSelected() === 0 
                      ? "Select at least 3 questions"
                      : `Select ${Math.max(0, 3 - getTotalSelected())} more`
                  }
                </Button>
              </div>
            </div>

            {/* Confirmation Modal - Apple Style */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 text-center text-gray-900 dark:text-gray-100">Confirm Your Selection</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className={`flex justify-between items-center p-3 rounded-xl ${
                      getSelectionBreakdown().awareness > 0 ? "bg-purple-50 border border-purple-200 dark:border-purple-800" : "bg-gray-50"
                    }`}>
                      <span className="font-medium text-gray-700 dark:text-gray-300">🔍 Awareness</span>
                      <span className={`text-lg font-bold ${
                        getSelectionBreakdown().awareness > 0 ? "text-purple-600" : "text-gray-400"
                      }`}>
                        {getSelectionBreakdown().awareness} questions
                      </span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-3 rounded-xl ${
                      getSelectionBreakdown().consideration > 0 ? "bg-orange-50 border border-orange-200 dark:border-orange-800" : "bg-gray-50"
                    }`}>
                      <span className="font-medium text-gray-700 dark:text-gray-300">⚖️ Consideration</span>
                      <span className={`text-lg font-bold ${
                        getSelectionBreakdown().consideration > 0 ? "text-orange-600" : "text-gray-400"
                      }`}>
                        {getSelectionBreakdown().consideration} questions
                      </span>
                    </div>
                    
                    <div className={`flex justify-between items-center p-3 rounded-xl ${
                      getSelectionBreakdown().decision > 0 ? "bg-green-50 border border-green-200 dark:border-green-800" : "bg-gray-50"
                    }`}>
                      <span className="font-medium text-gray-700 dark:text-gray-300">✅ Decision</span>
                      <span className={`text-lg font-bold ${
                        getSelectionBreakdown().decision > 0 ? "text-green-600" : "text-gray-400"
                      }`}>
                        {getSelectionBreakdown().decision} questions
                      </span>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">Total</span>
                        <span className="text-2xl font-bold text-blue-500">
                          {getSelectionBreakdown().total} questions
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Testing on {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? "s" : ""}: {selectedPlatforms.join(", ")}
                      </div>
                    </div>
                  </div>

                  {/* Warning if any stage is empty */}
                  {(getSelectionBreakdown().awareness === 0 || 
                    getSelectionBreakdown().consideration === 0 || 
                    getSelectionBreakdown().decision === 0) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <p className="text-amber-700 text-sm">
                        ⚠️ Note: Some funnel stages have no questions selected.
                      </p>
                    </div>
                  )}

                  <p className="text-center text-gray-500 mb-6">
                    Ready to run your analysis?
                  </p>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowConfirmModal(false)}
                      variant="outline"
                      className="flex-1 py-3 border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      ← Go Back
                    </Button>
                    <Button
                      onClick={handleRunAnalysis}
                      className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl"
                    >
                      ✓ Yes, Run Analysis
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 3: Running Analysis - Apple Style */}
        {phase === 3 && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Main Progress Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              {/* Animated Icon */}
              <div className="relative inline-block mb-6">
                <div className="text-6xl animate-pulse">🔬</div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Running</h2>
              <p className="text-gray-500 mb-8">Testing your brand on AI platforms...</p>
              
              {/* Single Countdown */}
              <div className="mb-8">
                <div className="text-5xl font-bold text-blue-500 font-mono mb-2">
                  {Math.floor(analysisCountdown / 60)}:{(analysisCountdown % 60).toString().padStart(2, '0')}
                </div>
                <p className="text-sm text-gray-400">estimated time remaining</p>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="text-blue-500 font-bold">{analysisProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>

              {/* Current Step */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{currentStep || analysisStatus}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getTotalSelected()}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Questions</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedPlatforms.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Platforms</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getTotalSelected() * selectedPlatforms.length * limits.testsPerQuestion}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Tests</div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Analysis Pipeline</h3>
              <div className="space-y-2">
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
                    <div key={item.step} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isCurrent ? "bg-blue-50 border border-blue-200 dark:border-blue-800" : 
                      isComplete ? "" : "opacity-40"
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        isComplete ? "bg-green-100 text-green-600" : 
                        isCurrent ? "bg-blue-100 text-blue-600" : "bg-gray-100"
                      }`}>
                        {isComplete ? "✓" : item.icon}
                      </div>
                      <span className={`flex-1 text-sm ${isCurrent ? "text-gray-900 font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                        {item.step}
                      </span>
                      {isCurrent && (
                        <div className="flex gap-1 items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platforms Being Tested */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Platforms Being Tested</h3>
              <div className="flex justify-center gap-6 flex-wrap">
                {selectedPlatforms.map((platform) => (
                  <div key={platform} className="flex flex-col items-center gap-2">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gray-50 ${
                      analysisProgress > 10 ? "animate-pulse" : ""
                    }`}>
                      {platform === "ChatGPT" && "🤖"}
                      {platform === "Gemini" && "✨"}
                      {platform === "Perplexity" && "🔮"}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{platform}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((dot) => (
                        <div 
                          key={dot} 
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            analysisProgress > 10 + (dot * 15) ? "bg-green-500" : "bg-gray-200"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estimated Time */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Estimated completion: 3-5 minutes</p>
              <p className="text-xs text-gray-600 mt-1">
                Each question is tested 3 times per platform (81 total AI responses)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        trigger={upgradeModalTrigger}
      />
    </div>
  );
}
