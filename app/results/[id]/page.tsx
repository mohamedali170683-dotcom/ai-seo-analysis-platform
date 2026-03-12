"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brain, Users, ShoppingCart, ChevronDown, ChevronUp, ArrowLeft, Lock, Sparkles, Download, FileText, ArrowRight, Calendar, Clock, X, Languages, Loader2, TrendingUp, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useTier } from "@/lib/tier";
import { UpgradeModal, PremiumBadge, BlurredContent, VisibilityGapAlert } from "@/components/UpgradeModal";
import { UpgradeModalTrigger } from "@/lib/tier/types";
// EmailGate removed - users go straight to results
import { LoginGate, InlineLoginPrompt } from "@/components/LoginGate";
import { DashboardHero, SummaryCard, SummaryCardsGrid } from "@/components/Dashboard";
import { BulletGraph, SentimentBar } from "@/components/Charts";
import ReactMarkdown from "react-markdown";

// Sentiment definitions for the report
const SENTIMENT_DEFINITIONS = {
  positive: {
    label: "Positive",
    emoji: "👍",
    color: "green",
    description: "AI recommends or praises your brand with favorable language",
    tone: "Enthusiastic, confident, endorsing",
    keywords: [
      "highly recommend",
      "excellent",
      "best",
      "trusted",
      "top-rated",
      "outstanding",
      "superior",
      "proven",
      "leading",
      "preferred",
    ],
    examples: [
      '"Highly recommended by experts..."',
      '"Excellent choice for your needs..."',
      '"Trusted brand with proven results..."',
    ],
  },
  neutral: {
    label: "Neutral",
    emoji: "😐",
    color: "gray",
    description: "AI mentions your brand factually without endorsement or criticism",
    tone: "Objective, informative, balanced",
    keywords: ["available", "offers", "includes", "provides", "one option", "can be found", "also", "another"],
    examples: [
      '"One option available at most retailers..."',
      '"Offers various product lines including..."',
      '"Can be found at major stores..."',
    ],
  },
  negative: {
    label: "Negative",
    emoji: "👎",
    color: "red",
    description: "AI expresses concerns, criticisms, or warns against your brand",
    tone: "Cautionary, critical, discouraging",
    keywords: [
      "concerns",
      "issues",
      "not recommended",
      "avoid",
      "problems",
      "controversial",
      "recalls",
      "complaints",
      "inferior",
    ],
    examples: [
      '"Some users have concerns about..."',
      '"Not recommended for certain use cases..."',
      '"May have issues with..."',
    ],
  },
};

// Simple markdown to HTML converter for PDF export
function markdownToHtml(text: string): string {
  if (!text) return text;

  return text
    // Convert bullet lists (lines starting with *)
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive list items in ul tags
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Convert **bold**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Convert line breaks
    .replace(/\n/g, '<br>');
}

// Generate strategic insight for competitive analysis
function generateStrategicInsight(
  response: any,
  brandName: string,
  category: string,
  isCompetitorWin: boolean
): { insight: string; recommendation: string } {
  const question = response.question || '';
  const fullResponse = response.fullResponse || '';
  let competitors = response.foundCompetitors || [];
  const sentiment = response.sentiment || 'neutral';
  const sources = [...(response.sources || []), ...(response.citations || [])];

  // Also check the follow-up question for competitor names (in case dynamic detection found one)
  if (competitors.length === 0 && response.followUpQuestion) {
    const followUpMatch = response.followUpQuestion.match(/recommend\s+([A-Z][a-zA-Z\s]+?)\s+instead/i);
    if (followUpMatch && followUpMatch[1]) {
      competitors = [followUpMatch[1].trim()];
    }
  }

  // Also try to extract competitor from response if none found yet
  if (competitors.length === 0 && fullResponse) {
    const brandPatterns = [
      /(?:recommend|suggest|top choice is|stands out is|best (?:option|choice|brand) is)\s+\*?\*?([A-Z][a-zA-Z\s]+?)(?:\*?\*?)(?:\s+(?:because|for|due|as|,|\.))/i,
      /\*?\*?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\*?\*?\s+(?:stands out|is the top|is (?:the )?best|is recommended)/i,
    ];
    for (const pattern of brandPatterns) {
      const match = fullResponse.match(pattern);
      if (match && match[1] && match[1].toLowerCase() !== brandName.toLowerCase()) {
        const extracted = match[1].trim().replace(/\*\*/g, '');
        if (extracted.length > 2 && extracted.length < 30) {
          competitors = [extracted];
          break;
        }
      }
    }
  }

  // Extract a meaningful snippet from the response (first 2 sentences or 150 chars)
  const extractMeaningfulSnippet = (text: string, maxLen: number = 120): string => {
    if (!text) return '';
    const clean = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
    const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 10);
    if (sentences.length > 0) {
      const snippet = sentences[0].trim();
      return snippet.length > maxLen ? snippet.substring(0, maxLen) + '...' : snippet;
    }
    return clean.substring(0, maxLen) + (clean.length > maxLen ? '...' : '');
  };

  // Extract key phrases from response that explain WHY
  const whyPatterns = [
    /known for ([^.]+)/i,
    /stands out (because|for|due to) ([^.]+)/i,
    /popular (because|for|due to) ([^.]+)/i,
    /recommended (because|for|due to) ([^.]+)/i,
    /excels (at|in) ([^.]+)/i,
    /specializes in ([^.]+)/i,
    /leader in ([^.]+)/i,
    /best for ([^.]+)/i,
    /known as ([^.]+)/i,
    /recognized for ([^.]+)/i,
  ];

  let keyReason = '';
  for (const pattern of whyPatterns) {
    const match = fullResponse.match(pattern);
    if (match) {
      keyReason = (match[2] || match[1] || '').trim();
      if (keyReason.length > 10 && keyReason.length < 100) break;
      keyReason = '';
    }
  }

  // Analyze source domains
  const sourceDomains = sources.slice(0, 3).map((s: any) => {
    try {
      const url = typeof s === 'string' ? s : s.url;
      return new URL(url).hostname.replace('www.', '');
    } catch { return null; }
  }).filter(Boolean);

  // Get a unique snippet from this response
  const responseSnippet = extractMeaningfulSnippet(fullResponse);

  if (isCompetitorWin) {
    // Competitor was mentioned instead of brand
    if (competitors.length > 0) {
      const competitorList = competitors.slice(0, 2).join(' and ');
      const sourceNote = sourceDomains.length > 0
        ? ` Sources: ${sourceDomains.slice(0, 2).join(', ')}.`
        : '';

      if (keyReason) {
        return {
          insight: `${response.platform} recommended ${competitorList} for "${question.substring(0, 50)}...", highlighting "${keyReason}".${sourceNote}`,
          recommendation: `Create content demonstrating your ${keyReason.toLowerCase().includes('quality') ? 'quality standards' : keyReason.toLowerCase().includes('price') || keyReason.toLowerCase().includes('value') ? 'value proposition' : keyReason.toLowerCase().includes('sustain') || keyReason.toLowerCase().includes('eco') ? 'sustainability credentials' : 'competitive advantages'}.`
        };
      }
      // Use snippet when no key reason found
      return {
        insight: `${response.platform} recommended ${competitorList}: "${responseSnippet}"${sourceNote}`,
        recommendation: `Research why ${competitorList} ranks higher and create comparable authoritative content.`
      };
    }
    // Brand not mentioned, no specific competitors found - use snippet
    return {
      insight: `${response.platform} answered without mentioning ${brandName}: "${responseSnippet}"`,
      recommendation: `Create expert content addressing this query type to improve visibility.`
    };
  } else {
    // Brand was mentioned (positive case)
    const positionText = response.position === 1 ? '#1' :
                         response.position === 2 ? '#2' :
                         response.position <= 3 ? `#${response.position}` : '';

    if (keyReason) {
      return {
        insight: `${response.platform} ranked ${brandName} ${positionText} for "${question.substring(0, 40)}...", noting "${keyReason}".`,
        recommendation: `Continue emphasizing this strength in your content strategy.`
      };
    }
    // Use snippet for context
    return {
      insight: `${response.platform} included ${brandName} ${positionText}: "${responseSnippet}"`,
      recommendation: `Maintain content presence for similar queries.`
    };
  }
}

// Smart snippet extractor that cuts at sentence boundaries
function extractSmartSnippet(text: string, maxLength: number = 400, focusKeyword?: string): string {
  if (!text) return '';

  // Remove markdown symbols for clean display
  let cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');

  let startPos = 0;

  // If we have a focus keyword, try to center the snippet around it
  if (focusKeyword) {
    const keywordIndex = cleanText.toLowerCase().indexOf(focusKeyword.toLowerCase());
    if (keywordIndex !== -1) {
      // Start a bit before the keyword to provide context
      startPos = Math.max(0, keywordIndex - 100);
    }
  }

  // Extract a chunk of text
  let snippet = cleanText.substring(startPos, startPos + maxLength);

  // Find the last complete sentence within our length
  const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
  let lastSentenceEnd = -1;

  for (const ending of sentenceEndings) {
    const pos = snippet.lastIndexOf(ending);
    if (pos > lastSentenceEnd && pos > 100) { // At least 100 chars for a meaningful snippet
      lastSentenceEnd = pos;
    }
  }

  if (lastSentenceEnd > 0) {
    snippet = snippet.substring(0, lastSentenceEnd + 1);
  }

  // Clean up
  snippet = snippet.trim();

  // Add ellipsis if we're not at the start/end
  if (startPos > 0) snippet = '...' + snippet;
  if (startPos + snippet.length < cleanText.length) snippet = snippet + '...';

  return snippet;
}

// TranslatableContent component for AI responses
interface TranslatableContentProps {
  content: string;
  targetLang: 'en' | 'de';
  className?: string;
}

function TranslatableContent({ content, targetLang, className = '' }: TranslatableContentProps) {
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    if (translatedContent) {
      setShowTranslated(!showTranslated);
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          targetLang: targetLang
        })
      });

      const data = await response.json();
      if (data.success && data.translatedText) {
        setTranslatedContent(data.translatedText);
        setShowTranslated(true);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const displayContent = showTranslated && translatedContent ? translatedContent : content;
  const otherLangLabel = targetLang === 'de' ? 'Auf Deutsch' : 'In English';
  const originalLabel = targetLang === 'de' ? 'Original anzeigen' : 'Show Original';

  return (
    <div className={className}>
      <div className="text-sm text-[#4A5F5F] prose prose-sm max-w-none">
        <ReactMarkdown>{displayContent || 'No response recorded'}</ReactMarkdown>
      </div>
      <button
        onClick={handleTranslate}
        disabled={isTranslating}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#396FFA] hover:text-[#192F80] transition-colors"
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>{targetLang === 'de' ? 'Übersetze...' : 'Translating...'}</span>
          </>
        ) : (
          <>
            <Languages className="w-3 h-3" />
            <span>{showTranslated ? originalLabel : otherLangLabel}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = params.id as string;

  // Analysis config from URL params (passed by analyze page)
  const configQuestions = parseInt(searchParams.get("q") || "0", 10);
  const configPlatforms = parseInt(searchParams.get("p") || "3", 10);
  const configTests = parseInt(searchParams.get("t") || "1", 10);

  // Tier management
  const { tier, limits, isStageAllowed, isPlatformAllowed, userEmail, setUserEmail, isProfessionalOrHigher, isPartner } = useTier();
  const { language } = useI18n();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<UpgradeModalTrigger>("funnel_stages");
  
  // Email gate removed - users go straight to results

  // Login state for gating full results
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("pending");
  const [currentStep, setCurrentStep] = useState<string>("Initializing...");
  const [analysisStartTime] = useState<number>(Date.now());
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedSchemas, setExpandedSchemas] = useState<string[]>([]);

  // Schedule automation state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [scheduleDay, setScheduleDay] = useState(1); // 1 = Monday for weekly, 1 = 1st for monthly
  const [scheduleHour, setScheduleHour] = useState(9);
  const [isScheduling, setIsScheduling] = useState(false);
  const [existingSchedule, setExistingSchedule] = useState<any>(null);

  // Helper to show upgrade modal
  const openUpgradeModal = (trigger: UpgradeModalTrigger) => {
    setUpgradeModalTrigger(trigger);
    setShowUpgradeModal(true);
  };
  
  // Check login status on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setIsLoggedIn(true);
          }
        }
      } catch (err) {
        // Not logged in
      }
    };
    checkLoginStatus();
  }, []);

  // Handle login from gate
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        setShowLoginGate(false);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // Fetch existing schedules
  useEffect(() => {
    const fetchScheduleInfo = async () => {
      try {
        const response = await fetch('/api/automation/scans?userId=demo-user');
        const data = await response.json();
        if (data.success) {
          // Check if this analysis is already scheduled
          const existingScan = data.scans?.find((s: any) =>
            s.description?.includes(analysisId) || s.brandOrKeyword === reportData?.brandOrKeyword
          );
          if (existingScan) {
            setExistingSchedule(existingScan);
          }
        }
      } catch (error) {
        console.error('Error fetching schedule info:', error);
      }
    };

    if (reportData) {
      fetchScheduleInfo();
    }
  }, [reportData, analysisId]);

  // Schedule the analysis
  const scheduleAnalysis = async () => {
    if (!reportData) return;

    setIsScheduling(true);
    try {
      const response = await fetch('/api/automation/scans?userId=demo-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${reportData.brandOrKeyword} - AI Visibility Analysis`,
          brandOrKeyword: reportData.brandOrKeyword,
          domain: reportData.domain,
          frequency: scheduleFrequency,
          hour: scheduleHour,
          dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDay : undefined,
          dayOfMonth: scheduleFrequency === 'monthly' ? scheduleDay : undefined,
          description: JSON.stringify({
            analysisType: 'ai_visibility',
            originalAnalysisId: analysisId,
            personas: reportData.personas || [],
            competitors: reportData.competitors || []
          })
        })
      });

      const data = await response.json();
      if (data.success) {
        setExistingSchedule(data.scan);
        setShowScheduleModal(false);
        alert('Analysis scheduled successfully! View it in the Automation dashboard.');
      } else {
        if (data.requiresUpgrade) {
          alert(data.error || 'Upgrade required to schedule analyses.');
        } else {
          alert(data.error || 'Failed to schedule analysis.');
        }
      }
    } catch (error) {
      console.error('Error scheduling analysis:', error);
      alert('Failed to schedule analysis. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };

  // Compute dynamic time estimate based on analysis config
  // ~12s per question per platform (AI call + follow-up) + 1s delay between questions + 30s overhead for saving/insights
  const estimatedTotalSeconds = configQuestions > 0
    ? Math.ceil(configQuestions * configPlatforms * configTests * 12 / configPlatforms) + configQuestions + 30
    : 180; // fallback 3 min if no config

  // Compute live ETA based on actual progress rate
  const computeETA = (): number => {
    const elapsed = (Date.now() - analysisStartTime) / 1000;

    // If we have progress data, compute rate-based ETA
    if (progress > 5 && elapsed > 5) {
      const progressPerSecond = progress / elapsed;
      if (progressPerSecond > 0) {
        const remainingProgress = 100 - progress;
        return Math.ceil(remainingProgress / progressPerSecond);
      }
    }

    // Before meaningful progress, use config-based estimate minus elapsed
    return Math.max(0, estimatedTotalSeconds - Math.floor(elapsed));
  };

  const [displayETA, setDisplayETA] = useState(estimatedTotalSeconds);

  // Update ETA every second
  useEffect(() => {
    if (!loading) return;

    const etaInterval = setInterval(() => {
      setDisplayETA(computeETA());
    }, 1000);

    return () => clearInterval(etaInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, progress, analysisStartTime]);

  useEffect(() => {
    if (!analysisId) {
      setError("No analysis ID provided");
      setLoading(false);
      return;
    }

    // Poll for analysis status and data
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${analysisId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analysis data");
        }

        const data = await response.json();

        // API returns data nested under 'analysis' key
        const analysis = data.analysis || data;

        const newProgress = analysis.progress || 0;

        setProgress(newProgress);
        setStatus(analysis.status);
        if (analysis.currentStep) {
          setCurrentStep(analysis.currentStep);
        }

        if (analysis.status === "completed") {
          clearInterval(pollInterval);
          setReportData(transformAnalysisData(data));
          setLoading(false);
        } else if (analysis.status === "failed") {
          clearInterval(pollInterval);
          setError(data.error || analysis.currentStep || "Analysis failed");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching analysis:", err);
        setError(err.message);
        clearInterval(pollInterval);
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);

  if (loading) {
    const eta = Math.max(0, displayETA);
    const minutes = Math.floor(eta / 60);
    const seconds = eta % 60;
    const elapsed = Math.floor((Date.now() - analysisStartTime) / 1000);
    const isOverEstimate = eta === 0 && progress < 95;

    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-8 md:p-12 max-w-2xl w-full">
          <div className="text-center">
            {/* Animated Icon */}
            <div className="relative inline-block mb-6">
              <div className="text-6xl animate-pulse">🔬</div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold font-headline text-off-black mb-2">
              Analysis Running
            </h2>
            <p className="text-off-grey mb-8">Testing your brand on AI platforms...</p>

            {/* Countdown Timer */}
            <div className="mb-8">
              <div className="text-5xl font-bold text-[#EB4200] font-mono mb-2">
                {isOverEstimate ? (
                  <span className="text-4xl">Almost done...</span>
                ) : (
                  <>{minutes}:{seconds.toString().padStart(2, '0')}</>
                )}
              </div>
              <p className="text-sm text-off-grey">
                {isOverEstimate
                  ? "Taking a bit longer — finalizing results"
                  : progress >= 90
                    ? "wrapping up"
                    : "estimated time remaining"}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-off-grey">Progress</span>
                <span className="text-[#EB4200] font-bold">{progress}%</span>
              </div>
              <div className="w-full bg-off-white rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#EB4200] h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current Step */}
            <div className="bg-off-white rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-[#4A5F5F]">{currentStep}</span>
              </div>
            </div>

            {/* Step-by-Step Progress */}
            <div className="space-y-2 text-left">
              {[
                { step: "Initialize", icon: "⚡", threshold: 5 },
                { step: "Testing Awareness Questions", icon: "🧠", threshold: 35 },
                { step: "Testing Consideration Questions", icon: "⚖️", threshold: 60 },
                { step: "Testing Decision Questions", icon: "✅", threshold: 85 },
                { step: "Generating Report", icon: "📊", threshold: 95 },
              ].map((item, index) => {
                const isComplete = progress >= item.threshold;
                const isCurrent = progress >= (index > 0 ? [5, 35, 60, 85, 95][index - 1] : 0) && progress < item.threshold;

                return (
                  <div key={item.step} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                    isCurrent ? "bg-[#D0DBF9]/30 border border-[#ACD3C8]" :
                    isComplete ? "" : "opacity-40"
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                      isComplete ? "bg-green-100 text-green-600" :
                      isCurrent ? "bg-[#D0DBF9]/30 text-[#396FFA]" : "bg-off-white"
                    }`}>
                      {isComplete ? "✓" : item.icon}
                    </div>
                    <span className={`flex-1 text-sm ${isCurrent ? "text-off-black font-medium" : "text-[#4A5F5F]"}`}>
                      {item.step}
                    </span>
                    {isCurrent && (
                      <div className="w-2 h-2 bg-[#396FFA] rounded-full animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-12 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-3xl font-bold font-headline text-off-black mb-4">Analysis Failed</h2>
            <p className="text-[#4A5F5F] mb-8">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-[#EB4200] hover:opacity-90 text-white rounded-lg font-semibold"
            >
              Start My New Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#4A5F5F]">No data available</p>
        </div>
      </div>
    );
  }
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Export all answers as PDF
  const handleExportPDF = async () => {
    try {
      // Create a formatted content for PDF
      const content = generatePDFContent();
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export. Please try again.');
    }
  };

  // Generate HTML content for PDF export
  const generatePDFContent = () => {
    const brand = reportData.brandOrKeyword || 'Brand';
    const date = new Date().toLocaleDateString();
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI Visibility Report - ${brand}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; }
          h3 { color: #4b5563; margin-top: 20px; }
          .summary { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
          .summary h2 { color: white; border: none; margin-top: 0; }
          .stage { margin-bottom: 30px; page-break-inside: avoid; }
          .stage-header { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
          .question { margin-bottom: 20px; border-left: 3px solid #3b82f6; padding-left: 15px; }
          .answer { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
          .answer-header { display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: 600; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
          .badge-positive { background: #d1fae5; color: #065f46; }
          .badge-negative { background: #fee2e2; color: #991b1b; }
          .badge-neutral { background: #e5e7eb; color: #374151; }
          .badge-mentioned { background: #dbeafe; color: #1e40af; }
          .response-text { white-space: pre-wrap; font-size: 14px; line-height: 1.6; }
          .response-text ul { margin: 10px 0; padding-left: 20px; }
          .response-text li { margin: 5px 0; }
          .response-text strong { font-weight: 600; color: #1f2937; }
          .response-text em { font-style: italic; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>AI Visibility Analysis Report</h1>
        <p><strong>Brand:</strong> ${brand} | <strong>Date:</strong> ${date}</p>
        
        <div class="summary">
          <h2>Executive Summary</h2>
          <p><strong>Overall Score:</strong> ${reportData.stats?.visibilityScore || 0}%</p>
          ${reportData.executiveSummary ? `
            <p><strong>Key Finding:</strong> ${reportData.executiveSummary.keyFinding}</p>
          ` : ''}
        </div>
    `;

    // Add each stage
    ['awareness', 'consideration', 'decision'].forEach(stage => {
      const stageIcon = stage === 'awareness' ? '🔍' : stage === 'consideration' ? '⚖️' : '✅';
      const stageData = reportData.journeyStages?.find((s: any) => s.stage === stage);
      
      html += `
        <div class="stage">
          <div class="stage-header">
            <h2>${stageIcon} ${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage</h2>
            <p>Visibility: ${stageData?.portrayal?.visibilityScore || 0}% | Mention Rate: ${stageData?.portrayal?.mentionRate || 0}%</p>
          </div>
      `;

      // Get questions and answers for this stage
      const stageQuestions = reportData.discoveredQuestions?.filter(
        (q: any) => q.category === stage
      ) || [];

      stageQuestions.forEach((question: any) => {
        const answers = reportData.aiTestResults?.filter((r: any) => r.question === question.question) || [];
        
        html += `
          <div class="question">
            <h3>${question.question}</h3>
        `;

        answers.forEach((answer: any) => {
          const sentimentClass = answer.sentiment === 'positive' ? 'badge-positive' : 
                                 answer.sentiment === 'negative' ? 'badge-negative' : 'badge-neutral';
          
          html += `
            <div class="answer">
              <div class="answer-header">
                <span>${answer.platform}</span>
                <span>
                  ${answer.brandMentioned ? '<span class="badge badge-mentioned">Mentioned</span>' : ''}
                  <span class="badge ${sentimentClass}">${answer.sentiment}</span>
                </span>
              </div>
              <div class="response-text">${markdownToHtml(answer.fullResponse || answer.context || 'No response recorded')}</div>
            </div>
          `;
        });

        html += '</div>';
      });

      html += '</div>';
    });

    html += '</body></html>';
    return html;
  };

  // Collect all recommendations from all stages with safety checks
  const journeyStages = reportData?.journeyStages || [];
  const allRecommendations = journeyStages.map((stage: any) => ({
    stage: stage?.stageLabel || "Unknown",
    stageIcon: stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅",
    recommendation: stage?.recommendation || null,
    visibilityScore: stage?.portrayal?.visibilityScore || 0,
  }));

  console.log('[Debug] allRecommendations:', allRecommendations);
  console.log('[Debug] journeyStages count:', journeyStages.length);

  return (
    <div className="min-h-screen bg-off-white">
      {/* Analysis Complete Banner */}
      <div className="bg-petrol text-white py-4 px-4">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <span className="font-bold text-lg">{reportData.brandOrKeyword} - Velaris Report</span>
              <div className="text-sm text-white/80">
                {reportData.totalTests} AI responses analyzed across 4 platforms
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {/* PDF Export Button */}
            <button
              onClick={() => limits.allowPdfExport ? alert("PDF export coming soon!") : openUpgradeModal("pdf_export")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                limits.allowPdfExport
                  ? "bg-white text-petrol hover:bg-off-white"
                  : "bg-white/20 text-white/80 cursor-pointer"
              }`}
            >
              {limits.allowPdfExport ? (
                <>
                  <Download className="w-4 h-4" />
                  Export My Report
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Export My Report
                  <span className="text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded">PRO</span>
                </>
              )}
            </button>
            {/* Schedule Button */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                existingSchedule
                  ? "bg-[#ACD3C8] text-petrol hover:bg-[#ACD3C8]/80"
                  : !isProfessionalOrHigher()
                  ? "bg-white/20 text-white/80 cursor-pointer"
                  : "bg-white text-petrol hover:bg-off-white"
              }`}
            >
              {existingSchedule ? (
                <>
                  <Clock className="w-4 h-4" />
                  Scheduled
                </>
              ) : !isProfessionalOrHigher() ? (
                <>
                  <Lock className="w-4 h-4" />
                  Schedule
                  <span className="text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded">PRO</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Schedule
                </>
              )}
            </button>
            {/* Methodology Button */}
            <button
              onClick={() => toggleSection("methodology")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                expandedSection === "methodology"
                  ? "bg-teal-100 text-teal-700"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Methodology
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/analyze"
              className="px-4 py-2 bg-white text-petrol rounded-lg text-sm font-semibold hover:bg-off-white transition-all"
            >
              Run My Next Audit
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN LAYOUT: Overall Score + Funnel Stage Cards */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Overall Visibility Score - LEFT SIDE (1 column) */}
          <div className="bg-white rounded-xl border-2 border-[#ACD3C8] shadow-lg p-6 flex flex-col justify-center">
            <h2 className="text-sm font-semibold text-[#4A5F5F] mb-3 text-center">Overall AI Visibility</h2>
            <div className={`text-6xl font-bold text-center mb-2 ${
              (reportData.overallScore || 0) >= 70 ? 'text-green-600' :
              (reportData.overallScore || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {reportData.overallScore || 0}%
            </div>
            <p className="text-xs text-off-grey text-center">
              Your visibility across all AI platforms
            </p>
          </div>

          {/* Funnel Stage Cards - RIGHT SIDE (3 columns) */}
          {journeyStages.length > 0 && (
            <div className="md:col-span-3">
              <SummaryCardsGrid
                stages={journeyStages.map((stage: any) => ({
                  id: stage?.stage || '',
                  name: stage?.stageLabel || 'Unknown Stage',
                  score: Math.round(stage?.portrayal?.visibilityScore || 0)
                }))}
                expandedStage={expandedSection}
                onStageToggle={(stageId: string) =>
                  setExpandedSection(expandedSection === stageId ? null : stageId)
                }
              />
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* LOGIN GATE - Show prompt if not logged in */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {!isLoggedIn && (
          <div className="mb-8">
            <InlineLoginPrompt onLogin={() => setShowLoginGate(true)} />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TECHNICAL AUDIT & COMPETITOR INTELLIGENCE */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className={`grid md:grid-cols-2 gap-6 mb-8 ${!isLoggedIn ? 'relative' : ''}`}>
          {/* Blur overlay for non-logged-in users */}
          {!isLoggedIn && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
              <div className="text-center p-6">
                <Lock className="w-8 h-8 text-off-grey mx-auto mb-2" />
                <p className="text-[#4A5F5F] font-medium">Login to view detailed audit</p>
              </div>
            </div>
          )}
          {/* Technical Audit - Collapsible */}
          <div
            onClick={() => isLoggedIn && toggleSection("technical")}
            className={`bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg transition-all ${
              isLoggedIn ? 'cursor-pointer hover:shadow-xl' : 'opacity-70'
            } ${expandedSection === "technical" ? "ring-2 ring-[#396FFA]" : ""}`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">🔧</div>
                <h3 className="text-lg font-bold text-off-black">Technical Audit</h3>
              </div>
              <p className="text-sm text-off-grey mb-3">Website optimization for AI crawlers</p>
              <div className="flex items-center justify-between">
                <div className={`text-3xl font-bold ${
                  (reportData.websiteAudit?.technicalScore || 0) >= 70 ? "text-green-600" :
                  (reportData.websiteAudit?.technicalScore || 0) >= 40 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {reportData.websiteAudit?.technicalScore || "N/A"}<span className="text-base text-off-grey">{reportData.websiteAudit ? "/100" : ""}</span>
                </div>
                <span className="flex items-center gap-1 text-[#396FFA] font-medium text-sm">
                  {expandedSection === "technical" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  <span className="ml-1">{expandedSection === "technical" ? "Hide" : "View"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Competitor Intelligence - Collapsible */}
          {(() => {
            // Calculate outperforming count using mention rate vs mention rate (apples to apples)
            const configuredCompetitors = (reportData.competitors || []).map((c: string) => c.toLowerCase());

            // Collect your brand's average mention rate across stages
            const brandMentionRates = journeyStages.map((s: any) => s?.portrayal?.mentionRate || 0);
            const yourMentionRate = brandMentionRates.length > 0
              ? Math.round(brandMentionRates.reduce((a: number, b: number) => a + b, 0) / brandMentionRates.length)
              : 0;

            const allCompetitors = new Map();
            journeyStages.forEach((stage: any) => {
              if (stage?.portrayal?.competitorComparison) {
                stage.portrayal.competitorComparison.forEach((comp: any) => {
                  const name = comp.competitorName || comp.competitor || comp.name;
                  if (name && name !== reportData.brandOrKeyword) {
                    // Filter out noise: only include configured competitors or names that look like real brands
                    const isConfigured = configuredCompetitors.includes(name.toLowerCase());
                    const looksLikeNoise = name.includes(" ") && name.split(" ").length > 3; // "Popular Local Brands" etc.
                    if (!isConfigured && looksLikeNoise) return;

                    if (!allCompetitors.has(name)) {
                      allCompetitors.set(name, { total: 0, count: 0 });
                    }
                    allCompetitors.get(name).total += (comp.mentionRate || 0);
                    allCompetitors.get(name).count += 1;
                  }
                });
              }
            });
            // Compare mention rate vs mention rate (same metric, fair comparison)
            const competitorScores = Array.from(allCompetitors.entries()).map(([name, data]: [string, any]) => ({
              name,
              score: Math.round(data.total / data.count)
            }));
            const beatingCount = competitorScores.filter(c => yourMentionRate > c.score).length;
            const totalCompetitors = competitorScores.length;
            const isWinning = totalCompetitors > 0 && beatingCount >= totalCompetitors / 2;

            return (
              <div
                onClick={() => isLoggedIn && setExpandedSection("competitive")}
                className={`bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg transition-all ${
                  isLoggedIn ? 'cursor-pointer hover:shadow-xl' : 'opacity-70'
                } ${expandedSection === "competitive" ? "ring-2 ring-[#EB4200]" : ""}`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-2xl">🏆</div>
                    <h3 className="text-lg font-bold text-off-black">Competitor Intelligence</h3>
                  </div>
                  <p className="text-sm text-off-grey mb-3">Side-by-side comparison with competitors</p>
                  <div className="flex items-center justify-between">
                    {totalCompetitors > 0 ? (
                      <div className={`flex items-center gap-2 ${isWinning ? "text-green-600" : "text-amber-600"}`}>
                        <span className="text-2xl">{isWinning ? "🏆" : "⚠️"}</span>
                        <div>
                          <div className="text-lg font-bold">
                            {isWinning
                              ? `Outperforming ${beatingCount}/${totalCompetitors}`
                              : `Behind ${totalCompetitors - beatingCount}/${totalCompetitors}`
                            }
                          </div>
                          <div className="text-xs text-off-grey">competitors</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-off-grey text-sm">No competitor data</div>
                    )}
                    <span className="flex items-center gap-1 text-amber-600 font-medium text-sm">
                      {expandedSection === "competitive" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      <span className="ml-1">{expandedSection === "competitive" ? "Hide" : "View"}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* JOURNEY STAGES DETAILED VIEW - PROGRESSIVE DISCLOSURE */}
        {/* Only shows when a stage card is clicked AND user is logged in */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          {/* Journey Stages Detailed View - PROGRESSIVE DISCLOSURE */}
          <div className="space-y-8">
            {journeyStages.length === 0 && (
              <p className="text-off-grey text-center py-8">No journey stage data available</p>
            )}
            {journeyStages.map((stage: any, index: number) => {
              // Only show detailed view if this stage is expanded AND user is logged in
              if (expandedSection !== stage?.stage) return null;

              // If not logged in, show login prompt instead of detailed view
              if (!isLoggedIn) {
                return (
                  <div key={stage?.stage || index} className="border border-[#E5E5E5] bg-white rounded-xl p-8 shadow-sm">
                    <div className="text-center py-8">
                      <Lock className="w-12 h-12 text-off-grey mx-auto mb-4" />
                      <h3 className="text-xl font-bold font-headline text-off-black mb-2">Login Required</h3>
                      <p className="text-off-grey mb-4">Create a free account to view detailed stage analysis</p>
                      <button
                        onClick={() => setShowLoginGate(true)}
                        className="px-6 py-2.5 bg-[#396FFA] hover:opacity-90 text-white font-semibold rounded-lg transition-all"
                      >
                        Login / Sign Up Free
                      </button>
                    </div>
                  </div>
                );
              }

              // Get recommendation for this stage
              const stageRec = allRecommendations.find((r: any) => r.stage === stage?.stageLabel);

              console.log(`[Recommendations Debug] Stage: ${stage?.stage}, Label: ${stage?.stageLabel}`);
              console.log(`[Recommendations Debug] stageRec found:`, stageRec ? 'YES' : 'NO');
              console.log(`[Recommendations Debug] Has recommendation:`, stageRec?.recommendation ? 'YES' : 'NO');

              return (
                <div key={stage?.stage || index} className="border border-[#E5E5E5] bg-white rounded-xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅"}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold font-headline text-off-black">{stage?.stageLabel || "Unknown Stage"}</h3>
                        <p className="text-sm text-off-grey">{stage?.stageDescription || ""}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`text-center px-4 py-2 rounded-xl ${
                        (stage?.portrayal?.visibilityScore || 0) >= 70 ? "bg-green-100" :
                        (stage?.portrayal?.visibilityScore || 0) >= 40 ? "bg-yellow-100" : "bg-red-100"
                      }`}>
                        <div className={`text-3xl font-bold ${
                          (stage?.portrayal?.visibilityScore || 0) >= 70 ? "text-green-700" :
                          (stage?.portrayal?.visibilityScore || 0) >= 40 ? "text-yellow-700" : "text-red-700"
                        }`}>
                          {Math.round(stage?.portrayal?.visibilityScore || 0)}%
                        </div>
                        <div className="text-xs text-[#4A5F5F]">Visibility</div>
                      </div>

                      {/* How is it calculated button - RIGHT NEXT TO SCORE */}
                      <button
                        onClick={() => setExpandedSchemas(prev =>
                          prev.includes(`scoring-${stage?.stage}`)
                            ? prev.filter(s => s !== `scoring-${stage?.stage}`)
                            : [...prev, `scoring-${stage?.stage}`]
                        )}
                        className="text-xs px-3 py-1.5 bg-[#D0DBF9] hover:bg-[#D0DBF9]/40 text-[#192F80] rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        📊 How calculated?
                      </button>
                    </div>
                  </div>

                  {/* Visibility Score Breakdown - SHOWS WHEN BUTTON CLICKED */}
                  {expandedSchemas.includes(`scoring-${stage?.stage}`) && (
                    <div className="mb-4 bg-[#D0DBF9]/20 rounded-lg p-4 border-2 border-[#ACD3C8]">
                      <div className="space-y-3 text-sm">
                        <div className="bg-white rounded-lg p-3">
                          <p className="font-medium text-off-black mb-2">Visibility Score Formula:</p>
                          <div className="bg-[#D0DBF9]/30 rounded p-2 font-mono text-xs mb-2">
                            Visibility = (Mention Rate × 50%) + (Position Score × 30%) + (Sentiment Score × 20%)
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-[#4A5F5F]">Mention Rate (50% weight):</span>
                              <span className="font-bold">{Math.round(stage?.portrayal?.mentionRate || 0)}% × 0.5 = {Math.round((stage?.portrayal?.mentionRate || 0) * 0.5)}pts</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5F5F]">Position Score (30% weight):</span>
                              <span className="font-bold">{Math.round(stage?.portrayal?.positionScore || 50)}% × 0.3 = {Math.round((stage?.portrayal?.positionScore || 50) * 0.3)}pts</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#4A5F5F]">Sentiment Score (20% weight):</span>
                              <span className="font-bold">{Math.round(stage?.portrayal?.sentimentScore || 50)}% × 0.2 = {Math.round((stage?.portrayal?.sentimentScore || 50) * 0.2)}pts</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                              <span className="text-[#192F80]">Total Visibility:</span>
                              <span className="text-[#192F80]">{Math.round(stage?.portrayal?.visibilityScore || 0)}%</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-[#4A5F5F] italic">
                          💡 This formula weights brand mentions most heavily (50%), followed by position in responses (30%), and sentiment (20%).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Questions Analyzed for this Stage */}
                  {stage?.questions && stage.questions.length > 0 && (
                    <div className="mb-6 bg-[#D0DBF9]/30 rounded-lg p-4 border border-[#ACD3C8]">
                      <h4 className="font-semibold text-off-black mb-3">❓ Questions Analyzed ({stage.questions.length})</h4>
                      <div className="space-y-2">
                        {stage.questions.map((q: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-[#396FFA] font-bold flex-shrink-0">{idx + 1}.</span>
                            <span className="text-[#4A5F5F]">{q.question || q}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-[#4A5F5F] mt-3 italic">
                        💡 These questions represent typical {stage?.stageLabel || 'customer'} queries that AI platforms answer.
                      </p>
                    </div>
                  )}

                  {/* Stage Metrics - 3 Main Cards */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {/* Card 1: Mention Rate */}
                    <div className="bg-white rounded-lg p-4 border border-[#E5E5E5]">
                      <h4 className="font-semibold text-off-black mb-3">📢 Mention Rate</h4>
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-2 ${
                          (stage?.portrayal?.mentionRate || 0) >= 70 ? 'text-green-600' :
                          (stage?.portrayal?.mentionRate || 0) >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {Math.round(stage?.portrayal?.mentionRate || 0)}%
                        </div>
                        <p className="text-sm text-[#4A5F5F]">
                          {Math.round((stage?.portrayal?.mentionRate || 0) * (stage?.portrayal?.totalTests || 0) / 100)} of {stage?.portrayal?.totalTests || 0} responses
                        </p>
                      </div>
                      <div className="mt-3">
                        <BulletGraph
                          actual={Math.round(stage?.portrayal?.mentionRate || 0)}
                          target={70}
                          ranges={[
                            { max: 40, label: 'Poor' },
                            { max: 70, label: 'Fair' },
                            { max: 100, label: 'Good' }
                          ]}
                          label=""
                          unit="%"
                        />
                      </div>
                    </div>

                    {/* Card 2: Position */}
                    <div className="bg-white rounded-lg p-4 border border-[#E5E5E5]">
                      <h4 className="font-semibold text-off-black mb-3">📊 Position</h4>
                      {(() => {
                        const stageResponses = reportData.aiTestResults?.filter((r: any) => {
                          const questionObj = reportData.discoveredQuestions?.find((q: any) => q.question === r.question);
                          return (questionObj?.category === stage?.stage || questionObj?.stage === stage?.stage) && r.brandMentioned && r.position;
                        }) || [];

                        if (stageResponses.length === 0) {
                          return (
                            <div className="text-center py-6 text-off-grey">
                              <p className="text-sm">No position data</p>
                            </div>
                          );
                        }

                        const positionCounts: { [key: number]: number } = {};
                        stageResponses.forEach((r: any) => {
                          if (r.position) {
                            positionCounts[r.position] = (positionCounts[r.position] || 0) + 1;
                          }
                        });

                        const totalWithPositions = stageResponses.length;
                        const positionDistribution = Object.entries(positionCounts)
                          .map(([pos, count]) => ({
                            position: parseInt(pos),
                            count,
                            percentage: (count / totalWithPositions) * 100
                          }))
                          .sort((a, b) => a.position - b.position);

                        return (
                          <div className="space-y-2">
                            {positionDistribution.slice(0, 3).map((item) => (
                              <div key={item.position} className="flex items-center gap-2">
                                <span className={`text-sm font-bold w-12 flex-shrink-0 ${
                                  item.position === 1 ? 'text-green-700' :
                                  item.position === 2 ? 'text-[#396FFA]' :
                                  item.position === 3 ? 'text-amber-700' :
                                  'text-[#4A5F5F]'
                                }`}>
                                  {item.position === 1 ? '🥇 1st' :
                                   item.position === 2 ? '🥈 2nd' :
                                   item.position === 3 ? '🥉 3rd' :
                                   `#${item.position}`}
                                </span>
                                <div className="flex-1">
                                  <div className="bg-[#E5E5E5] rounded-full h-5 overflow-hidden">
                                    <div
                                      className={`h-5 rounded-full flex items-center justify-end pr-2 ${
                                        item.position === 1 ? 'bg-green-500' :
                                        item.position === 2 ? 'bg-[#D0DBF9]/30' :
                                        item.position === 3 ? 'bg-amber-500' :
                                        'bg-off-grey'
                                      }`}
                                      style={{ width: `${item.percentage}%` }}
                                    >
                                      {item.percentage >= 20 && (
                                        <span className="text-xs font-bold text-white">
                                          {Math.round(item.percentage)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {item.percentage < 20 && (
                                  <span className="text-xs font-bold text-[#4A5F5F] w-10 text-right">
                                    {Math.round(item.percentage)}%
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Card 3: Tone/Sentiment */}
                    <div className="bg-white rounded-lg p-4 border border-[#E5E5E5]">
                      <h4 className="font-semibold text-off-black mb-3">💭 Tone</h4>
                      <div className="text-center mb-3">
                        <span className={`inline-block text-lg font-bold px-4 py-2 rounded-lg ${
                          stage?.portrayal?.sentiment?.dominant === "positive" ? "bg-green-100 text-green-700" :
                          stage?.portrayal?.sentiment?.dominant === "negative" ? "bg-red-100 text-red-700" :
                          "bg-off-white text-[#4A5F5F]"
                        }`}>
                          {stage?.portrayal?.sentiment?.dominant || "neutral"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#4A5F5F]">😊 Positive</span>
                          <span className="font-bold text-green-700">{Math.round(stage?.portrayal?.sentiment?.positive || 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#4A5F5F]">😐 Neutral</span>
                          <span className="font-bold text-[#4A5F5F]">{Math.round(stage?.portrayal?.sentiment?.neutral || 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#4A5F5F]">😞 Negative</span>
                          <span className="font-bold text-red-700">{Math.round(stage?.portrayal?.sentiment?.negative || 0)}%</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <SentimentBar
                          positive={Math.round(stage?.portrayal?.sentiment?.positive || 0)}
                          neutral={Math.round(stage?.portrayal?.sentiment?.neutral || 0)}
                          negative={Math.round(stage?.portrayal?.sentiment?.negative || 0)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Platform-by-Platform Summary */}
                  <div className="bg-white rounded-lg p-5 border border-[#E5E5E5] mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-off-black">🤖 Platform-by-Platform Summary</h4>
                      <button
                        onClick={() => {
                          // Expand the All AI Responses section for this stage
                          const stageName = stage?.stage;
                          if (stageName && !expandedSchemas.includes(`answers-${stageName}`)) {
                            setExpandedSchemas(prev => [...prev, `answers-${stageName}`]);
                          }
                          // Scroll to it after a brief delay to allow expansion
                          setTimeout(() => {
                            const element = document.querySelector(`#all-ai-responses-${stageName}`);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 100);
                        }}
                        className="text-xs px-3 py-1.5 bg-[#D0DBF9] hover:bg-[#D0DBF9]/40 text-[#192F80] rounded-lg transition-colors flex items-center gap-1"
                      >
                        👁️ View All AI Responses
                      </button>
                    </div>

                    {(() => {
                      const stageResponses = reportData.aiTestResults?.filter((r: any) => {
                        const questionObj = reportData.discoveredQuestions?.find((q: any) => q.question === r.question);
                        return (questionObj?.category === stage?.stage || questionObj?.stage === stage?.stage);
                      }) || [];

                      const platformGroups: { [platform: string]: any[] } = {};
                      stageResponses.forEach((r: any) => {
                        const platform = r.platform.toLowerCase();
                        if (!platformGroups[platform]) {
                          platformGroups[platform] = [];
                        }
                        platformGroups[platform].push(r);
                      });

                      // Always show all 3 platforms, even if they have no data
                      const platformOrder = ['chatgpt', 'gemini', 'perplexity'];

                      return (
                        <div className="space-y-4">
                          {platformOrder.map(platform => {
                            const responses = platformGroups[platform] || [];
                            const brandMentions = responses.filter(r => r.brandMentioned);
                            const mentionRate = responses.length > 0 ? (brandMentions.length / responses.length) * 100 : 0;

                            const positionsWithBrand = brandMentions.filter(r => r.position).map(r => r.position);
                            const avgPosition = positionsWithBrand.length > 0
                              ? positionsWithBrand.reduce((a: number, b: number) => a + b, 0) / positionsWithBrand.length
                              : 0;

                            const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
                            brandMentions.forEach((r: any) => {
                              const sentiment = r.sentiment || 'neutral';
                              sentimentCounts[sentiment as keyof typeof sentimentCounts]++;
                            });
                            const dominantSentiment = Object.entries(sentimentCounts).reduce((a, b) =>
                              a[1] > b[1] ? a : b
                            )[0];

                            const firstSnippet = brandMentions
                              .filter((r: any) => r.context || r.fullResponse)
                              .map((r: any) => r.context || r.fullResponse?.substring(0, 150) || '')[0] || '';

                            return (
                              <div
                                key={platform}
                                className="bg-white border border-[#E5E5E5] rounded-xl p-4"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                      platform === 'chatgpt' ? 'bg-green-100 text-green-700' :
                                      platform === 'gemini' ? 'bg-[#D0DBF9]/30 text-[#396FFA]' :
                                      platform === 'perplexity' ? 'bg-[#D0DBF9] text-[#192F80]' :
                                      'bg-[#ACD3C8]/30 text-[#396FFA]'
                                    }`}>
                                      {platform.toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                {responses.length === 0 ? (
                                  <div className="bg-off-white border border-[#E5E5E5] rounded-lg p-3 text-center">
                                    <p className="text-sm text-[#4A5F5F]">
                                      ℹ️ No {platform.toUpperCase()} responses available for this stage.
                                    </p>
                                  </div>
                                ) : brandMentions.length > 0 ? (
                                  <div className="bg-[#D0DBF9]/30 border border-[#ACD3C8] rounded-lg p-3">
                                    <p className="text-sm text-off-black leading-relaxed">
                                      {(() => {
                                        const platformName = platform.toUpperCase();
                                        const mentionPhrase = brandMentions.length === 1 ? "1 answer" : `${brandMentions.length} answers`;

                                        let positionPhrase = "";
                                        if (avgPosition > 0) {
                                          const positionInt = Math.round(avgPosition);
                                          if (positionInt === 1) {
                                            positionPhrase = " recommending the brand in <strong>1st position</strong>";
                                          } else if (positionInt === 2) {
                                            positionPhrase = " recommending the brand in <strong>2nd position</strong>";
                                          } else if (positionInt === 3) {
                                            positionPhrase = " recommending the brand in <strong>3rd position</strong>";
                                          } else {
                                            positionPhrase = ` mentioning the brand in position <strong>#${positionInt}</strong>`;
                                          }

                                          const stageCompetitors = stage?.portrayal?.competitorComparison || [];
                                          if (stageCompetitors.length > 0 && positionInt > 1) {
                                            const rankedHigher = stageCompetitors
                                              .filter((c: any) => c.avgPosition < avgPosition && c.avgPosition > 0)
                                              .sort((a: any, b: any) => a.avgPosition - b.avgPosition)
                                              .slice(0, 2)
                                              .map((c: any) => c.competitorName || c.competitor || c.name);

                                            if (rankedHigher.length > 0) {
                                              positionPhrase += ` behind ${rankedHigher.join(' and ')}`;
                                            }
                                          }
                                        }

                                        const sentimentPhrase = dominantSentiment === 'positive'
                                          ? "with a <strong>positive tone</strong>"
                                          : dominantSentiment === 'negative'
                                          ? "with a <strong>negative tone</strong>"
                                          : "with a <strong>neutral tone</strong>";

                                        const exampleSnippet = extractSmartSnippet(firstSnippet, 300, reportData.brandOrKeyword);
                                        const snippetPhrase = exampleSnippet
                                          ? ` as shown in this snippet: <em>"${exampleSnippet}"</em>`
                                          : "";

                                        return (
                                          <span dangerouslySetInnerHTML={{
                                            __html: `On <strong>${platformName}</strong>, ${mentionPhrase} mentioned your brand${positionPhrase} ${sentimentPhrase}${snippetPhrase}`
                                          }} />
                                        );
                                      })()}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <p className="text-sm text-orange-900 mb-2">
                                      <strong>⚠️ {platform.toUpperCase()}</strong> provided {responses.length} {responses.length === 1 ? 'response' : 'responses'} for this stage, but <strong>your brand was not mentioned</strong>.
                                    </p>
                                    {(() => {
                                      // Extract competitor mentions from responses
                                      const competitors = reportData.competitors || [];
                                      const competitorMentions: { [key: string]: number } = {};

                                      responses.forEach((r: any) => {
                                        const text = (r.fullResponse || r.context || '').toLowerCase();
                                        competitors.forEach((comp: string) => {
                                          if (text.includes(comp.toLowerCase())) {
                                            competitorMentions[comp] = (competitorMentions[comp] || 0) + 1;
                                          }
                                        });
                                      });

                                      const mentionedCompetitors = Object.entries(competitorMentions)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([name]) => name);

                                      // Get a smart snippet from the first response
                                      const firstResponse = responses[0]?.fullResponse || responses[0]?.context || '';
                                      const snippet = extractSmartSnippet(firstResponse, 500);

                                      return (
                                        <div className="space-y-2 text-sm text-[#4A5F5F]">
                                          {mentionedCompetitors.length > 0 && (
                                            <div className="bg-white rounded p-2 border border-orange-200">
                                              <span className="font-semibold text-orange-800">🎯 Competitors mentioned instead:</span>{' '}
                                              <span className="text-off-black">{mentionedCompetitors.join(', ')}</span>
                                            </div>
                                          )}
                                          {snippet && (
                                            <div className="bg-white rounded p-2 border border-orange-200">
                                              <span className="font-semibold text-orange-800">📝 What they said:</span>{' '}
                                              <span className="text-[#4A5F5F] italic">"{snippet}..."</span>
                                            </div>
                                          )}
                                          <div className="text-xs text-orange-700 mt-2">
                                            💡 <strong>Insight:</strong> This indicates a visibility gap - {platform.toUpperCase()} is recommending alternatives without mentioning your brand.
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* ═══ CITATION ANALYSIS FOR THIS STAGE ═══ */}
                  {stage?.citationAnalysis && stage.citationAnalysis.totalCitations > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedSchemas(prev =>
                          prev.includes(`cite-${stage?.stage}`)
                            ? prev.filter(s => s !== `cite-${stage?.stage}`)
                            : [...prev, `cite-${stage?.stage}`]
                        )}
                        className="w-full flex items-center justify-between p-4 rounded-xl transition-colors bg-purple-50 hover:bg-purple-100 text-purple-900"
                      >
                        <div className="flex items-center gap-2">
                          <span>📚</span>
                          <span className="font-medium">Citation Sources</span>
                          <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                            {stage.citationAnalysis.totalCitations} citations found
                          </span>
                        </div>
                        {expandedSchemas.includes(`cite-${stage?.stage}`) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      {expandedSchemas.includes(`cite-${stage?.stage}`) && (
                        <div className="mt-4 bg-white rounded-xl p-6 border-2 border-purple-200">
                          {/* Brand citation status */}
                          <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 ${stage.citationAnalysis.brandCited ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <span className="text-xl">{stage.citationAnalysis.brandCited ? '✅' : '⚠️'}</span>
                            <div>
                              <p className="font-semibold text-sm text-off-black">
                                {stage.citationAnalysis.brandCited
                                  ? `${reportData.brandOrKeyword} is being cited as a source`
                                  : `${reportData.brandOrKeyword} is not appearing in AI citations`
                                }
                              </p>
                              <p className="text-xs text-[#4A5F5F]">
                                {stage.citationAnalysis.brandCited
                                  ? 'Your website or content is referenced by AI platforms when generating responses.'
                                  : 'AI platforms are not citing your website as a source. Building authority on key platforms can change this.'
                                }
                              </p>
                            </div>
                          </div>

                          {/* Authority sources detected */}
                          {stage.citationAnalysis.authoritySources?.length > 0 && (
                            <div className="mb-4">
                              <h6 className="font-semibold text-sm text-off-black mb-2">Authority Sources Detected</h6>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {stage.citationAnalysis.authoritySources.map((src: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-off-white border border-[#E5E5E5]">
                                    <span className={`w-2 h-2 rounded-full ${src.brandPresent ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    <div>
                                      <p className="text-xs font-medium text-off-black">{src.source}</p>
                                      <p className="text-xs text-off-grey">
                                        {src.count}x cited {src.brandPresent ? '• Brand present' : '• Brand absent'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Citation gaps */}
                          {stage.citationAnalysis.gaps?.length > 0 && (
                            <div>
                              <h6 className="font-semibold text-sm text-off-black mb-2">Citation Gaps</h6>
                              <div className="space-y-2">
                                {stage.citationAnalysis.gaps.map((gap: string, idx: number) => (
                                  <div key={idx} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                    <span className="text-amber-600 mt-0.5 text-sm">⚡</span>
                                    <p className="text-xs text-off-black">{gap}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ RECOMMENDATIONS FOR THIS STAGE ═══ */}
                  {stage?.recommendation && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedSchemas(prev =>
                          prev.includes(`rec-${stage?.stage}`)
                            ? prev.filter(s => s !== `rec-${stage?.stage}`)
                            : [...prev, `rec-${stage?.stage}`]
                        )}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                          stage?.stage === "awareness" ? 'bg-[#D0DBF9]/30 hover:bg-[#D0DBF9]/40 text-[#192F80]' :
                          stage?.stage === "consideration" ? 'bg-[#ACD3C8]/30 hover:bg-[#ACD3C8]/40 text-petrol' :
                          'bg-green-100 hover:bg-green-200 text-green-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>💡</span>
                          <span className="font-medium">Recommendations for {stage?.stageLabel}</span>
                        </div>
                        {expandedSchemas.includes(`rec-${stage?.stage}`) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      {expandedSchemas.includes(`rec-${stage?.stage}`) && (
                        <div className="mt-4 bg-white rounded-xl p-6 border-2 border-amber-200">
                          <div className="space-y-4">
                            {/* Pattern Insight */}
                            {stage.recommendation.commonPattern && (
                              <div className="border-b border-[#E5E5E5] pb-4">
                                <h5 className="font-semibold text-off-black mb-2 flex items-center gap-2">
                                  <span>🔍</span> Key Pattern Detected
                                </h5>
                                <p className="text-sm text-[#4A5F5F] mb-3">{stage.recommendation.commonPattern}</p>
                              </div>
                            )}

                            {/* Content Type Recommendation */}
                            {stage.recommendation.contentType && (
                              <div className="border-b border-[#E5E5E5] pb-4">
                                <h5 className="font-semibold text-off-black mb-2 flex items-center gap-2">
                                  <span>📝</span> Recommended Content Type
                                </h5>
                                <p className="text-sm text-[#4A5F5F] mb-3">{stage.recommendation.contentType}</p>
                              </div>
                            )}

                            {/* Focused Action */}
                            {stage.recommendation.focusedAction && (
                              <div>
                                <h5 className="font-semibold text-off-black mb-2 flex items-center gap-2">
                                  <span>🎯</span> Priority Action
                                </h5>
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                                  <p className="text-sm text-off-black font-medium">{stage.recommendation.focusedAction}</p>
                                </div>
                              </div>
                            )}

                            {/* If insights array exists (for future compatibility) */}
                            {stage.recommendation.insights && stage.recommendation.insights.length > 0 && (
                              <div className="space-y-4 mt-4">
                                {stage.recommendation.insights.map((insight: any, idx: number) => (
                                  <div key={idx} className="border-b border-[#E5E5E5] last:border-0 pb-4 last:pb-0">
                                    <h5 className="font-semibold text-off-black mb-2">{insight.insight || insight.title || `Insight ${idx + 1}`}</h5>
                                    <p className="text-sm text-[#4A5F5F] mb-3">{insight.explanation || insight.description || ''}</p>
                                    {insight.actions && insight.actions.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-xs font-semibold text-[#4A5F5F] uppercase">Action Items:</p>
                                        {insight.actions.map((action: string, aIdx: number) => (
                                          <div key={aIdx} className="flex items-start gap-2 text-sm text-[#4A5F5F]">
                                            <span className="text-green-600 mt-0.5">✓</span>
                                            <span>{action}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Content Action Plan — On-Page + Distribution */}
                            {stage.contentPlan && (stage.contentPlan.onPage?.length > 0 || stage.contentPlan.distribution?.length > 0) && (
                              <div className="mt-6 pt-4 border-t-2 border-[#E5E5E5]">
                                <h5 className="font-bold text-off-black mb-4 flex items-center gap-2 text-base">
                                  <span>📋</span> Content Action Plan
                                </h5>

                                {/* On-Page Actions */}
                                {stage.contentPlan.onPage?.length > 0 && (
                                  <div className="mb-4">
                                    <h6 className="font-semibold text-[#1D5142] mb-3 flex items-center gap-2 text-sm">
                                      <span className="w-2 h-2 bg-[#1D5142] rounded-full"></span> On-Page Content
                                      <span className="text-xs text-off-grey font-normal ml-1">— Changes to make on your website</span>
                                    </h6>
                                    <div className="space-y-3">
                                      {stage.contentPlan.onPage.map((rec: any, idx: number) => (
                                        <div key={`onpage-${idx}`} className={`p-3 rounded-lg border ${rec.priority === 'high' ? 'border-red-200 bg-red-50/50' : rec.priority === 'medium' ? 'border-amber-200 bg-amber-50/50' : 'border-[#E5E5E5] bg-off-white'}`}>
                                          <div className="flex items-start gap-2">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                              {rec.priority === 'high' ? 'HIGH' : rec.priority === 'medium' ? 'MED' : 'LOW'}
                                            </span>
                                            <div className="flex-1">
                                              <p className="text-sm font-semibold text-off-black">{rec.action}</p>
                                              <p className="text-xs text-[#4A5F5F] mt-1">{rec.detail}</p>
                                              {rec.evidenceTier && (
                                                <span className="inline-block text-xs text-off-grey mt-1">Tier {rec.evidenceTier} evidence</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Distribution/PR Actions */}
                                {stage.contentPlan.distribution?.length > 0 && (
                                  <div>
                                    <h6 className="font-semibold text-[#396FFA] mb-3 flex items-center gap-2 text-sm">
                                      <span className="w-2 h-2 bg-[#396FFA] rounded-full"></span> Distribution &amp; PR
                                      <span className="text-xs text-off-grey font-normal ml-1">— External actions to amplify visibility</span>
                                    </h6>
                                    <div className="space-y-3">
                                      {stage.contentPlan.distribution.map((rec: any, idx: number) => (
                                        <div key={`dist-${idx}`} className={`p-3 rounded-lg border ${rec.priority === 'high' ? 'border-blue-200 bg-blue-50/50' : rec.priority === 'medium' ? 'border-indigo-200 bg-indigo-50/30' : 'border-[#E5E5E5] bg-off-white'}`}>
                                          <div className="flex items-start gap-2">
                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded mt-0.5 ${rec.priority === 'high' ? 'bg-blue-100 text-blue-700' : rec.priority === 'medium' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                                              {rec.priority === 'high' ? 'HIGH' : rec.priority === 'medium' ? 'MED' : 'LOW'}
                                            </span>
                                            <div className="flex-1">
                                              <p className="text-sm font-semibold text-off-black">{rec.action}</p>
                                              <p className="text-xs text-[#4A5F5F] mt-1">{rec.detail}</p>
                                              {rec.evidenceTier && (
                                                <span className="inline-block text-xs text-off-grey mt-1">Tier {rec.evidenceTier} evidence</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Fallback if no recommendation data */}
                            {!stage.recommendation.commonPattern && !stage.recommendation.contentType && !stage.recommendation.focusedAction && (
                              <div className="text-center py-4">
                                <p className="text-sm text-off-grey">No recommendations available for this stage yet.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Answers Section - Gated by tier */}
        <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg mb-8">
          <div className="p-6 border-b border-[#E5E5E5]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h2 className="text-xl font-bold font-headline text-off-black">All AI Responses</h2>
                  <p className="text-sm text-off-grey">Full answers from each AI platform per question</p>
                </div>
              </div>
              {(tier === 'partner' || tier === 'professional') ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportPDF()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#396FFA] text-white rounded-lg hover:opacity-90 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Partner/Professional tier</span>
                </div>
              )}
            </div>
          </div>

          {/* Gated content */}
          {(tier === 'partner' || tier === 'professional') ? (
            <div className="p-6">
              {/* Answers by Stage */}
              {['awareness', 'consideration', 'decision'].map((stageName) => {
                const stageIcon = stageName === 'awareness' ? '🔍' : stageName === 'consideration' ? '⚖️' : '✅';
                const stageColor = stageName === 'awareness' ? 'blue' : stageName === 'consideration' ? 'yellow' : 'green';
                
                // Try multiple ways to match questions to stage
                const stageQuestions = reportData.discoveredQuestions?.filter(
                  (q: any) => q.category === stageName || q.stage === stageName
                ) || [];
                
                // Get all AI test results and filter to this stage
                // Try matching by category from discoveredQuestions first, then fallback to direct matching
                const stageAnswers = (reportData.aiTestResults || []).filter((r: any) => {
                  // First try: Find question in discoveredQuestions
                  const questionObj = reportData.discoveredQuestions?.find((q: any) => q.question === r.question);
                  if (questionObj) {
                    return questionObj.category === stageName || questionObj.stage === stageName;
                  }
                  // Fallback: Check if the answer itself has a category/stage
                  return r.category === stageName || r.stage === stageName;
                });
                
                // Group answers by question
                const answersByQuestion: Record<string, any[]> = {};
                stageAnswers.forEach((answer: any) => {
                  const q = answer.question || 'Unknown question';
                  if (!answersByQuestion[q]) {
                    answersByQuestion[q] = [];
                  }
                  answersByQuestion[q].push(answer);
                });
                
                const totalAnswers = stageAnswers.length;
                const questionCount = Object.keys(answersByQuestion).length;

                return (
                  <div key={stageName} id={`all-ai-responses-${stageName}`} className="mb-6 scroll-mt-20">
                    <button
                      onClick={() => setExpandedSchemas(prev => 
                        prev.includes(`answers-${stageName}`) 
                          ? prev.filter(s => s !== `answers-${stageName}`) 
                          : [...prev, `answers-${stageName}`]
                      )}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                        stageColor === 'blue' ? 'bg-[#D0DBF9]/30 hover:bg-[#D0DBF9]/30' :
                        stageColor === 'yellow' ? 'bg-yellow-50 hover:bg-yellow-100' :
                        'bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{stageIcon}</span>
                        <span className="font-semibold text-off-black capitalize">{stageName} Stage</span>
                        <span className="text-sm text-off-grey">({totalAnswers} answers from {questionCount} questions)</span>
                      </div>
                      {expandedSchemas.includes(`answers-${stageName}`) ? (
                        <ChevronUp className="w-5 h-5 text-off-grey" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-off-grey" />
                      )}
                    </button>
                    
                    {/* Expanded answers */}
                    {expandedSchemas.includes(`answers-${stageName}`) && (
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-[#E5E5E5]">
                        {Object.entries(answersByQuestion).length === 0 ? (
                          <div className="text-center py-8 text-off-grey">
                            <p>No AI responses recorded for this stage yet.</p>
                            <p className="text-sm mt-2">Run an analysis to see AI responses here.</p>
                          </div>
                        ) : Object.entries(answersByQuestion).map(([question, answers]) => (
                          <div key={question} className="bg-off-white rounded-xl p-4">
                            <h4 className="font-medium text-off-black mb-3">{question}</h4>
                            <div className="space-y-3">
                              {/* Show one answer per platform in UI */}
                              {['ChatGPT', 'Gemini', 'Perplexity'].map(platform => {
                                const platformAnswer = answers.find((a: any) => a.platform === platform);
                                if (!platformAnswer) return null;
                                
                                return (
                                  <div key={platform} className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-[#4A5F5F]">{platform}</span>
                                      <div className="flex items-center gap-2">
                                        {platformAnswer.brandMentioned && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Mentioned</span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          platformAnswer.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                          platformAnswer.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                          'bg-off-white text-[#4A5F5F]'
                                        }`}>
                                          {platformAnswer.sentiment}
                                        </span>
                                      </div>
                                    </div>
                                    <TranslatableContent
                                      content={platformAnswer.fullResponse || platformAnswer.context || 'No response recorded'}
                                      targetLang={language}
                                    />
                                    {/* Show citations if available */}
                                    {((platformAnswer.citations && platformAnswer.citations.length > 0) || 
                                      (platformAnswer.sources && platformAnswer.sources.length > 0)) && (
                                      <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-medium text-off-grey">🔗 Sources Cited:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {[...(platformAnswer.citations || []), ...(platformAnswer.sources || []).map((s: any) => s.url || s)]
                                            .filter((url: string, idx: number, arr: string[]) => url && arr.indexOf(url) === idx)
                                            .slice(0, 5)
                                            .map((url: string, idx: number) => (
                                              <a 
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs bg-[#D0DBF9]/30 text-[#396FFA] px-2 py-1 rounded hover:bg-[#D0DBF9]/30 transition-colors"
                                              >
                                                <span>🔗</span>
                                                <span className="max-w-32 truncate">
                                                  {url.replace(/^https?:\/\//, '').split('/')[0]}
                                                </span>
                                              </a>
                                            ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Show message if no AI test results at all */}
              {(!reportData.aiTestResults || reportData.aiTestResults.length === 0) && (
                <div className="text-center py-8 text-off-grey bg-off-white rounded-xl">
                  <p className="font-medium">No AI responses recorded yet</p>
                  <p className="text-sm mt-2">Run an analysis to see AI responses from ChatGPT, Gemini, Copilot, and Perplexity.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="bg-off-white rounded-2xl p-8">
                <Lock className="w-12 h-12 text-off-grey mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-off-black mb-2">Full Answers Available in Partner/Professional Tier</h3>
                <p className="text-off-grey mb-4">
                  Upgrade to see all {reportData.aiTestResults?.length || 0} AI responses across all platforms and export them as PDF.
                </p>
                <button
                  onClick={() => openUpgradeModal("funnel_stages")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#EB4200] text-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Section: AI Visibility Details */}
        {expandedSection === "visibility" && (
          <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-headline text-off-black">📊 AI Visibility by Funnel Stage</h2>
              <button onClick={() => setExpandedSection(null)} className="text-off-grey hover:text-[#4A5F5F]">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            {/* Scoring Methodology */}
            <div className="bg-[#D0DBF9]/30 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-[#192F80] mb-3">How We Calculate Your Score</h4>
              
              {/* Overall Stage Weights */}
              <div className="mb-4 p-3 bg-white/50 rounded-lg">
                <p className="text-sm text-[#192F80] font-medium mb-2">Stage Weights (Overall Score)</p>
                <div className="flex gap-4 text-sm">
                  <span className="bg-[#D0DBF9]/30 px-2 py-1 rounded">🔍 Awareness: <strong>20%</strong></span>
                  <span className="bg-yellow-100 px-2 py-1 rounded">⚖️ Consideration: <strong>35%</strong></span>
                  <span className="bg-green-100 px-2 py-1 rounded">✅ Decision: <strong>45%</strong></span>
                </div>
              </div>

              {/* Awareness Stage - Citation Based */}
              <div className="mb-4 p-3 bg-[#D0DBF9]/30 rounded-lg border-l-4 border-[#396FFA]">
                <p className="text-sm text-[#192F80] font-medium mb-2">🔍 Awareness Stage (Citation-Based)</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-bold text-[#396FFA]">60%</span> Citation Rate
                    <p className="text-[#396FFA] text-xs">Is your content cited as a source?</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#396FFA]">25%</span> Mention Rate
                    <p className="text-[#396FFA] text-xs">Is your brand mentioned?</p>
                  </div>
                  <div>
                    <span className="font-bold text-[#396FFA]">15%</span> Sentiment
                    <p className="text-[#396FFA] text-xs">How positively portrayed?</p>
                  </div>
                </div>
              </div>

              {/* Consideration & Decision Stages */}
              <div className="p-3 bg-green-100/50 rounded-lg border-l-4 border-green-400">
                <p className="text-sm text-green-800 font-medium mb-2">⚖️✅ Consideration & Decision Stages (Standard)</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-bold text-green-700">50%</span> Mention Rate
                    <p className="text-green-600 text-xs">How often AI mentions you</p>
                  </div>
                  <div>
                    <span className="font-bold text-green-700">30%</span> Position
                    <p className="text-green-600 text-xs">Where you appear (1st = best)</p>
                  </div>
                  <div>
                    <span className="font-bold text-green-700">20%</span> Sentiment
                    <p className="text-green-600 text-xs">How positively portrayed?</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Performance Breakdown */}
            {reportData.platformBreakdown && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-off-black mb-4 flex items-center gap-2">
                  <span>🤖</span> Visibility Across AI Platforms
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { name: "ChatGPT", icon: "🤖", color: "green" },
                    { name: "Gemini", icon: "✨", color: "blue" },
                    { name: "Perplexity", icon: "🔮", color: "purple" },
                  ].map((platform) => {
                    const data = reportData.platformBreakdown?.[platform.name] || {
                      mentionRate: 0,
                      avgPosition: 0,
                      visibilityShare: 0,
                      totalTests: 0,
                      mentions: 0,
                    };
                    const hasNoData = data.totalTests === 0;
                    const colorClasses = {
                      green: "border-green-200 bg-green-50",
                      blue: "border-[#ACD3C8] bg-[#D0DBF9]/30",
                      cyan: "border-[#ACD3C8] bg-[#ACD3C8]/30",
                      purple: "border-[#ACD3C8] bg-[#D0DBF9]/30",
                    };
                    return (
                      <div key={platform.name} className={`rounded-xl p-4 border-2 ${hasNoData ? 'border-[#E5E5E5] bg-off-white' : colorClasses[platform.color as keyof typeof colorClasses]} relative`}>
                        {/* Warning badge if no data */}
                        {hasNoData && (
                          <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            No data
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{platform.icon}</span>
                          <div>
                            <span className="font-semibold text-off-black">{platform.name}</span>
                            <span className="text-xs text-off-grey ml-1">({data.totalTests} tests)</span>
                          </div>
                        </div>
                        {hasNoData ? (
                          <div className="text-center py-2">
                            <p className="text-xs text-off-grey">
                              No responses received.
                              {platform.name === "Gemini" && " (Check GEMINI_API_KEY)"}
                              {platform.name === "Perplexity" && " (PERPLEXITY_API_KEY not configured)"}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-off-grey">Mention Rate</span>
                              <span className={`font-bold ${data.mentionRate >= 50 ? "text-green-600" : data.mentionRate >= 25 ? "text-yellow-600" : "text-red-600"}`}>
                                {Math.round(data.mentionRate)}%
                              </span>
                            </div>
                            <div className="w-full bg-[#E5E5E5] rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${data.mentionRate >= 50 ? "bg-green-500" : data.mentionRate >= 25 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, data.mentionRate)}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-off-grey">Mentioned</span>
                              <span className="font-semibold text-[#4A5F5F]">
                                {data.mentions || 0} / {data.totalTests}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-off-grey">Avg Position</span>
                              <span className="font-semibold text-[#4A5F5F]">
                                {data.avgPosition > 0 ? `#${data.avgPosition.toFixed(1)}` : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-off-grey">Visibility Share</span>
                              <span className="font-semibold text-[#4A5F5F]">{Math.round(data.visibilityShare)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Overall Platform Summary */}
                <div className="mt-4 bg-off-white rounded-xl p-4">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold font-headline text-off-black">
                        {Math.round(
                          Object.values(reportData.platformBreakdown || {}).reduce((sum: number, p: any) => sum + (p.mentionRate || 0), 0) / 
                          Math.max(Object.keys(reportData.platformBreakdown || {}).length, 1)
                        )}%
                      </div>
                      <div className="text-sm text-off-grey">Avg Mention Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-headline text-off-black">
                        #{(
                          Object.values(reportData.platformBreakdown || {}).reduce((sum: number, p: any) => sum + (p.avgPosition || 0), 0) / 
                          Math.max(Object.values(reportData.platformBreakdown || {}).filter((p: any) => p.avgPosition > 0).length, 1)
                        ).toFixed(1)}
                      </div>
                      <div className="text-sm text-off-grey">Avg Position</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold font-headline text-off-black">
                        {Object.values(reportData.platformBreakdown || {}).reduce((sum: number, p: any) => sum + (p.totalTests || 0), 0)}
                      </div>
                      <div className="text-sm text-off-grey">Total AI Responses</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Journey Stages */}
            <div className="space-y-8">
              {journeyStages.length === 0 && (
                <p className="text-off-grey text-center py-8">No journey stage data available</p>
              )}
              {journeyStages.map((stage: any, index: number) => (
                <div key={stage?.stage || index} className={`border-2 rounded-xl p-8 ${
                  stage?.stage === "awareness" ? "border-[#ACD3C8] bg-[#D0DBF9]/30/30" :
                  stage?.stage === "consideration" ? "border-[#ACD3C8] bg-[#ACD3C8]/30/30" : "border-green-200 bg-green-50/30"
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅"}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold font-headline text-off-black">{stage?.stageLabel || "Unknown Stage"}</h3>
                        <p className="text-sm text-off-grey">{stage?.stageDescription || ""}</p>
                      </div>
                    </div>
                    <div className={`text-center px-4 py-2 rounded-xl ${
                      (stage?.portrayal?.visibilityScore || 0) >= 70 ? "bg-green-100" :
                      (stage?.portrayal?.visibilityScore || 0) >= 40 ? "bg-yellow-100" : "bg-red-100"
                    }`}>
                      <div className={`text-3xl font-bold ${
                        (stage?.portrayal?.visibilityScore || 0) >= 70 ? "text-green-700" :
                        (stage?.portrayal?.visibilityScore || 0) >= 40 ? "text-yellow-700" : "text-red-700"
                      }`}>
                        {Math.round(stage?.portrayal?.visibilityScore || 0)}%
                      </div>
                      <div className="text-xs text-[#4A5F5F]">Visibility</div>
                    </div>
                  </div>

                  {/* Questions Analyzed Section */}
                  {stage?.questions && stage.questions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-off-black mb-3 flex items-center gap-2">
                        <span>❓</span> Questions Analyzed ({stage.questions.length})
                      </h4>
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        {stage.questions.slice(0, 6).map((q: any, qIdx: number) => (
                          <div key={qIdx} className="flex items-start gap-2 text-sm">
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                              stage?.stage === "awareness" ? "bg-[#D0DBF9]/30 text-[#396FFA]" :
                              stage?.stage === "consideration" ? "bg-[#ACD3C8]/30 text-[#396FFA]" : "bg-green-100 text-green-700"
                            }`}>Q{qIdx + 1}</span>
                            <span className="text-[#4A5F5F]">{typeof q === 'string' ? q : q.question || q.text || 'Question'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stage Metrics with Explanations */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* For Awareness Stage: Citation-focused metrics */}
                    {stage?.stage === 'awareness' ? (
                      <div className="bg-[#D0DBF9]/30 rounded-lg p-4 border-l-4 border-[#396FFA]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-[#192F80]">📚 Content Citation Analysis</h4>
                          <span className={`text-2xl font-bold ${
                            (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 50 ? "text-green-600" :
                            (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 25 ? "text-yellow-600" : "text-red-600"
                          }`}>{Math.round(stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0)}%</span>
                        </div>
                        <div className="bg-[#D0DBF9]/30 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-[#192F80] mb-1">Is your brand/content used as a source?</p>
                          <p className="text-xs text-[#396FFA]">
                            When users ask AI for awareness-level information, does the AI cite your content, website, or brand as an authoritative source?
                          </p>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#396FFA]">Citation Rate (60% weight)</span>
                            <span className="font-bold text-[#192F80]">{Math.round(stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0)}%</span>
                          </div>
                          <div className="w-full bg-[#D0DBF9] rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 50 ? "bg-green-500" :
                                (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 25 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#396FFA]">Mention Rate (25% weight)</span>
                            <span className="font-bold text-[#192F80]">{Math.round(stage?.portrayal?.mentionRate || 0)}%</span>
                          </div>
                          <div className="w-full bg-[#D0DBF9] rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-[#D0DBF9]/30`}
                              style={{ width: `${stage?.portrayal?.mentionRate || 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-white/60 rounded p-2">
                          <p className="text-xs text-[#396FFA]">
                            {(() => {
                              const citedSources = stage?.portrayal?.citedSources || [];
                              if (citedSources.length > 0) {
                                return (
                                  <>
                                    <span className="font-semibold">📎 Sources detected: </span>
                                    {citedSources.slice(0, 3).join(', ')}
                                    {citedSources.length > 3 && ` +${citedSources.length - 3} more`}
                                  </>
                                );
                              }
                              return (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 50 
                                ? "✅ Good visibility - Your content is being cited by AI platforms"
                                : (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 25
                                ? "⚠️ Moderate visibility - Some AI platforms cite your content"
                                : "❌ Low visibility - AI platforms are not citing your content as a source";
                            })()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* For Consideration/Decision: Standard Mention Rate */
                      <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-off-black">📢 Mention Rate</h4>
                          <span className={`text-2xl font-bold ${
                            (stage?.portrayal?.mentionRate || 0) >= 70 ? "text-green-600" :
                            (stage?.portrayal?.mentionRate || 0) >= 40 ? "text-yellow-600" : "text-red-600"
                          }`}>{Math.round(stage?.portrayal?.mentionRate || 0)}%</span>
                        </div>
                        <p className="text-sm text-[#4A5F5F] mb-2">
                          Out of {stage?.portrayal?.totalTests || 0} tests across all AI platforms, your brand was mentioned in {Math.round((stage?.portrayal?.mentionRate || 0) * (stage?.portrayal?.totalTests || 0) / 100)} responses.
                        </p>
                        <div className="w-full bg-[#E5E5E5] rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (stage?.portrayal?.mentionRate || 0) >= 70 ? "bg-green-500" :
                              (stage?.portrayal?.mentionRate || 0) >= 40 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${stage?.portrayal?.mentionRate || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-off-grey mt-1">
                          {(stage?.portrayal?.mentionRate || 0) >= 70 ? "✅ Strong presence - AI consistently mentions your brand" :
                           (stage?.portrayal?.mentionRate || 0) >= 40 ? "⚠️ Moderate presence - Room for improvement" : "❌ Low presence - Significant opportunity to improve"}
                        </p>
                      </div>
                    )}

                    {/* Audience Sentiment Explained */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-off-black">💭 Audience Sentiment</h4>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stage?.portrayal?.sentiment?.dominant === "positive" ? "bg-green-100 text-green-700" :
                          stage?.portrayal?.sentiment?.dominant === "negative" ? "bg-red-100 text-red-700" : "bg-off-white text-[#4A5F5F]"
                        }`}>{stage?.portrayal?.sentiment?.dominant || "Neutral"}</span>
                      </div>
                      <div className="space-y-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16">Positive</span>
                          <div className="flex-1 bg-[#E5E5E5] rounded-full h-2">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: `${stage?.portrayal?.sentiment?.positive || 0}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{Math.round(stage?.portrayal?.sentiment?.positive || 0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16">Neutral</span>
                          <div className="flex-1 bg-[#E5E5E5] rounded-full h-2">
                            <div className="h-2 rounded-full bg-off-grey" style={{ width: `${stage?.portrayal?.sentiment?.neutral || 0}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{Math.round(stage?.portrayal?.sentiment?.neutral || 0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16">Negative</span>
                          <div className="flex-1 bg-[#E5E5E5] rounded-full h-2">
                            <div className="h-2 rounded-full bg-red-500" style={{ width: `${stage?.portrayal?.sentiment?.negative || 0}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{Math.round(stage?.portrayal?.sentiment?.negative || 0)}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-off-grey">
                        {stage?.portrayal?.sentiment?.dominant === "positive" ? "AI platforms speak favorably about your brand in this stage." :
                         stage?.portrayal?.sentiment?.dominant === "negative" ? "Attention needed - Some responses portray your brand negatively." : "AI responses are factual without strong positive or negative bias."}
                      </p>
                    </div>
                  </div>

                  {/* Sources Cited by AI - Show for Awareness stage */}
                  {stage?.stage === 'awareness' && (() => {
                    // Collect all citations from AI test results for this stage
                    const stageAnswers = reportData.aiTestResults?.filter((r: any) => {
                      const questionObj = reportData.discoveredQuestions?.find((q: any) => q.question === r.question);
                      return questionObj?.category === 'awareness' || questionObj?.stage === 'awareness';
                    }) || [];
                    
                    // Extract all citations with their platforms
                    const allCitations: { url: string; domain: string; title?: string; platform: string }[] = [];
                    stageAnswers.forEach((answer: any) => {
                      // From citations array
                      (answer.citations || []).forEach((url: string) => {
                        if (url && !allCitations.find(c => c.url === url)) {
                          allCitations.push({
                            url,
                            domain: url.replace(/^https?:\/\//, '').split('/')[0],
                            platform: answer.platform
                          });
                        }
                      });
                      // From sources JSON
                      (answer.sources || []).forEach((source: any) => {
                        const url = source.url || source;
                        if (url && typeof url === 'string' && !allCitations.find(c => c.url === url)) {
                          allCitations.push({
                            url,
                            domain: source.domain || url.replace(/^https?:\/\//, '').split('/')[0],
                            title: source.title,
                            platform: answer.platform
                          });
                        }
                      });
                    });
                    
                    // Check if brand domain is cited
                    const brandDomain = reportData.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || '';
                    const brandCitations = allCitations.filter(c => 
                      brandDomain && c.domain.toLowerCase().includes(brandDomain.toLowerCase())
                    );
                    const otherCitations = allCitations.filter(c => 
                      !brandDomain || !c.domain.toLowerCase().includes(brandDomain.toLowerCase())
                    );
                    
                    return (
                      <div className="mb-6">
                        <h4 className="font-semibold text-off-black mb-3 flex items-center gap-2">
                          <span>🔗</span> Sources Cited by AI Platforms
                        </h4>
                        <div className="bg-[#D0DBF9]/20 rounded-xl p-4 border border-[#ACD3C8]">
                          {/* Brand Citations */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-lg ${brandCitations.length > 0 ? '✅' : '⚠️'}`}>
                                {brandCitations.length > 0 ? '✅' : '⚠️'}
                              </span>
                              <span className="font-medium text-[#192F80]">
                                Your Content as Source: {brandCitations.length > 0 ? `Cited ${brandCitations.length} time(s)` : 'Not cited'}
                              </span>
                            </div>
                            {brandCitations.length > 0 ? (
                              <div className="space-y-2 ml-7">
                                {brandCitations.map((citation, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      citation.platform === 'ChatGPT' ? 'bg-green-100 text-green-700' :
                                      citation.platform === 'Gemini' ? 'bg-[#D0DBF9]/30 text-[#396FFA]' :
                                      citation.platform === 'Perplexity' ? 'bg-[#D0DBF9] text-[#192F80]' :
                                      'bg-[#ACD3C8]/30 text-[#396FFA]'
                                    }`}>{citation.platform}</span>
                                    <a href={citation.url} target="_blank" rel="noopener noreferrer" 
                                       className="text-[#396FFA] hover:underline truncate max-w-md">
                                      {citation.title || citation.domain}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-[#396FFA] ml-7">
                                AI platforms did not cite your website as a source for awareness-level questions. 
                                Consider creating more authoritative, citable content.
                              </p>
                            )}
                          </div>
                          
                          {/* Other Sources */}
                          {otherCitations.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">📚</span>
                                <span className="font-medium text-[#4A5F5F]">
                                  Other Sources Cited ({otherCitations.length})
                                </span>
                              </div>
                              <div className="space-y-2 ml-7 max-h-48 overflow-y-auto">
                                {otherCitations.slice(0, 10).map((citation, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      citation.platform === 'ChatGPT' ? 'bg-green-100 text-green-700' :
                                      citation.platform === 'Gemini' ? 'bg-[#D0DBF9]/30 text-[#396FFA]' :
                                      citation.platform === 'Perplexity' ? 'bg-[#D0DBF9] text-[#192F80]' :
                                      'bg-[#ACD3C8]/30 text-[#396FFA]'
                                    }`}>{citation.platform}</span>
                                    <span className="text-[#4A5F5F]">{citation.domain}</span>
                                    {citation.title && (
                                      <span className="text-off-grey truncate max-w-xs">- {citation.title}</span>
                                    )}
                                  </div>
                                ))}
                                {otherCitations.length > 10 && (
                                  <p className="text-xs text-off-grey">+{otherCitations.length - 10} more sources</p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {allCitations.length === 0 && (
                            <div className="text-center py-4">
                              <p className="text-sm text-[#4A5F5F]">
                                No source citations detected in AI responses for this stage.
                              </p>
                              <p className="text-xs text-off-grey mt-1">
                                Note: ChatGPT typically doesn&apos;t cite sources. Perplexity and Gemini with grounding do.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Competitor Comparison (if available) */}
                  {stage?.portrayal?.competitorComparison && stage.portrayal.competitorComparison.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-off-black mb-3 flex items-center gap-2">
                        <span>🏆</span> Competitor Mentions in This Stage
                      </h4>
                      <div className="bg-white rounded-lg p-4">
                        <div className="space-y-3">
                          {stage.portrayal.competitorComparison.map((comp: any, compIdx: number) => (
                            <div key={compIdx} className="flex items-center gap-3">
                              <span className="font-medium text-off-black w-32 truncate">{comp.competitorName || comp.competitor || comp.name || `Competitor ${compIdx + 1}`}</span>
                              <div className="flex-1 bg-[#E5E5E5] rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full ${compIdx === 0 ? "bg-pink-500" : "bg-off-grey"}`}
                                  style={{ width: `${comp.mentionRate || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-[#4A5F5F] w-12 text-right">{Math.round(comp.mentionRate || 0)}%</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-off-grey mt-3">
                          Shows how often competitors are mentioned by AI when answering {stage?.stageLabel || "this stage"} questions.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* See All Answers Button - replaces sample responses */}
                  {(() => {
                    const stageAnswers = reportData.aiTestResults?.filter((r: any) => {
                      const questionObj = reportData.discoveredQuestions?.find((q: any) => q.question === r.question);
                      return questionObj?.category === stage?.stage;
                    }) || [];
                    const answerCount = stageAnswers.length;
                    
                    return (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            if (tier === 'partner' || tier === 'professional') {
                              setExpandedSchemas(prev => 
                                prev.includes(`stage-answers-${stage?.stage}`) 
                                  ? prev.filter(s => s !== `stage-answers-${stage?.stage}`) 
                                  : [...prev, `stage-answers-${stage?.stage}`]
                              );
                            } else {
                              openUpgradeModal("funnel_stages");
                            }
                          }}
                          className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                            tier === 'partner' || tier === 'professional'
                              ? 'bg-[#D0DBF9]/30 hover:bg-[#D0DBF9]/30 text-[#396FFA]'
                              : 'bg-off-white text-off-grey'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>💬</span>
                            <span className="font-medium">
                              See All {answerCount} AI Answers for {stage?.stageLabel}
                            </span>
                          </div>
                          {tier === 'partner' || tier === 'professional' ? (
                            expandedSchemas.includes(`stage-answers-${stage?.stage}`) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )
                          ) : (
                            <div className="flex items-center gap-1 text-amber-600">
                              <Lock className="w-4 h-4" />
                              <span className="text-xs">Partner/Pro</span>
                            </div>
                          )}
                        </button>
                        
                        {/* Expanded answers for this stage */}
                        {expandedSchemas.includes(`stage-answers-${stage?.stage}`) && (tier === 'partner' || tier === 'professional') && (
                          <div className="mt-4 space-y-4 border-l-2 border-[#ACD3C8] pl-4">
                            {(() => {
                              // Group by question
                              const byQuestion: Record<string, any[]> = {};
                              stageAnswers.forEach((answer: any) => {
                                if (!byQuestion[answer.question]) byQuestion[answer.question] = [];
                                byQuestion[answer.question].push(answer);
                              });
                              
                              return Object.entries(byQuestion).map(([question, answers]) => (
                                <div key={question} className="bg-white rounded-xl p-4 shadow-sm">
                                  <h5 className="font-medium text-off-black mb-3">{question}</h5>
                                  <div className="space-y-3">
                                    {['ChatGPT', 'Gemini', 'Perplexity'].map(platform => {
                                      const platformAnswer = answers.find((a: any) => a.platform === platform);
                                      if (!platformAnswer) return null;
                                      
                                      return (
                                        <div key={platform} className="bg-off-white rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                              platform === "ChatGPT" ? "bg-green-100 text-green-700" :
                                              platform === "Gemini" ? "bg-[#D0DBF9]/30 text-[#396FFA]" :
                                              platform === "Perplexity" ? "bg-[#D0DBF9] text-[#192F80]" : 
                                              "bg-[#ACD3C8]/30 text-[#396FFA]"
                                            }`}>{platform}</span>
                                            <div className="flex items-center gap-2">
                                              {platformAnswer.brandMentioned && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Mentioned</span>
                                              )}
                                              <span className={`text-xs px-2 py-0.5 rounded ${
                                                platformAnswer.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                                platformAnswer.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                                'bg-[#E5E5E5] text-[#4A5F5F]'
                                              }`}>{platformAnswer.sentiment}</span>
                                            </div>
                                          </div>
                                          <TranslatableContent
                                            content={platformAnswer.fullResponse || platformAnswer.context || 'No response'}
                                            targetLang={language}
                                          />
                                          {/* Show citations if available */}
                                          {((platformAnswer.citations && platformAnswer.citations.length > 0) || 
                                            (platformAnswer.sources && platformAnswer.sources.length > 0)) && (
                                            <div className="mt-3 pt-3 border-t border-[#E5E5E5]">
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-off-grey">🔗 Sources Cited:</span>
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                {[...(platformAnswer.citations || []), ...(platformAnswer.sources || []).map((s: any) => s.url || s)]
                                                  .filter((url: string, idx: number, arr: string[]) => url && arr.indexOf(url) === idx)
                                                  .map((url: string, idx: number) => (
                                                    <a 
                                                      key={idx}
                                                      href={url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-1 text-xs bg-[#D0DBF9]/30 text-[#396FFA] px-2 py-1 rounded hover:bg-[#D0DBF9]/30 transition-colors"
                                                    >
                                                      <span>🔗</span>
                                                      <span className="max-w-48 truncate">
                                                        {url.replace(/^https?:\/\//, '').split('/')[0]}
                                                      </span>
                                                    </a>
                                                  ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded Section: Technical Audit */}
        {expandedSection === "technical" && reportData.websiteAudit && (
          <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-headline text-off-black">🔧 Website Technical Audit</h2>
              <button onClick={() => setExpandedSection(null)} className="text-off-grey hover:text-[#4A5F5F]">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 1: STATUS QUO - What We Found */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-[#D0DBF9]/30 rounded-full flex items-center justify-center text-[#396FFA] font-bold text-sm">1</div>
                <h3 className="text-xl font-bold font-headline text-off-black">Status Quo: What We Analyzed</h3>
              </div>

              {/* Crawl Overview Cards */}
              {reportData.websiteAudit.pagesCrawled && reportData.websiteAudit.pagesCrawled.length > 0 && (() => {
                const pages = reportData.websiteAudit.pagesCrawled;
                const productPages = pages.filter((p: any) => {
                  const path = p.url?.replace(/^https?:\/\/[^/]+/, '') || '';
                  return /-\d{5,}$/.test(path) || /\d{8,}/.test(path) || (path.split('-').length >= 3 && path.length > 15);
                });
                const faqPages = pages.filter((p: any) => /faq|help|support/i.test(p.url || ''));
                const pagesWithSchema = pages.filter((p: any) => p.schemas && p.schemas.length > 0);
                
                return (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#D0DBF9]/20 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-[#396FFA]">{pages.length}</div>
                        <div className="text-sm text-[#396FFA] font-medium">Pages Crawled</div>
                      </div>
                      <div className="bg-[#D0DBF9]/30 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-[#192F80]">{productPages.length}</div>
                        <div className="text-sm text-[#192F80] font-medium">Product Pages</div>
                      </div>
                      <div className="bg-[#ACD3C8]/20 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-[#396FFA]">{faqPages.length}</div>
                        <div className="text-sm text-[#396FFA] font-medium">FAQ Pages</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-green-700">{pagesWithSchema.length}</div>
                        <div className="text-sm text-green-600 font-medium">With Schema</div>
                      </div>
                    </div>

                    {/* URLs Analyzed */}
                    <div className="bg-off-white rounded-xl p-5 border border-[#E5E5E5]">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-off-black">🕷️ URLs Analyzed</span>
                        {reportData.websiteAudit.sitemapFound && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            from sitemap
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {pages.map((page: any, i: number) => {
                          const path = page.url?.replace(/^https?:\/\/[^/]+/, '') || '/';
                          const isProduct = /-\d{5,}$/.test(path) || /\d{8,}/.test(path) || (path.split('-').length >= 3 && path.length > 15);
                          const isFaq = /faq|help|support/i.test(path);
                          const hasSchema = page.schemas && page.schemas.length > 0;
                          
                          return (
                            <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 text-sm">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                hasSchema ? 'bg-green-500' : 'bg-[#E5E5E5]'
                              }`} />
                              <span className="text-[#4A5F5F] truncate flex-1" title={page.url}>
                                {path}
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isProduct && (
                                  <span className="text-xs bg-[#D0DBF9] text-[#192F80] px-2 py-0.5 rounded">Product</span>
                                )}
                                {isFaq && (
                                  <span className="text-xs bg-[#ACD3C8]/30 text-[#396FFA] px-2 py-0.5 rounded">FAQ</span>
                                )}
                                {hasSchema && (
                                  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                                    {page.schemas.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Technical Checks */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className={`rounded-xl p-4 border-2 ${
                        reportData.websiteAudit.sitemapFound ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{reportData.websiteAudit.sitemapFound ? '✅' : '⚠️'}</span>
                          <span className="font-semibold text-off-black">Sitemap</span>
                        </div>
                        <p className="text-xs text-[#4A5F5F]">
                          {reportData.websiteAudit.sitemapFound ? 'Found and accessible' : 'Not found or inaccessible'}
                        </p>
                      </div>
                      <div className={`rounded-xl p-4 border-2 ${
                        reportData.websiteAudit.robotsAllowsAI !== false ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{reportData.websiteAudit.robotsAllowsAI !== false ? '✅' : '❌'}</span>
                          <span className="font-semibold text-off-black">AI Bots</span>
                        </div>
                        <p className="text-xs text-[#4A5F5F]">
                          {reportData.websiteAudit.robotsAllowsAI !== false ? 'Allowed to crawl' : 'Blocked in robots.txt'}
                        </p>
                      </div>
                      <div className={`rounded-xl p-4 border-2 ${
                        reportData.websiteAudit.faqContent?.hasFAQSection ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{reportData.websiteAudit.faqContent?.hasFAQSection ? '✅' : '⚠️'}</span>
                          <span className="font-semibold text-off-black">FAQ Content</span>
                        </div>
                        <p className="text-xs text-[#4A5F5F]">
                          {reportData.websiteAudit.faqContent?.hasFAQSection ? 'Detected on pages' : 'No FAQ sections found'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 2: CHALLENGES - What's Missing */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm">2</div>
                <h3 className="text-xl font-bold font-headline text-off-black">Challenges: Schema Gaps Identified</h3>
              </div>

              {/* Schema Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { name: "Organization", has: reportData.websiteAudit.schemas?.hasOrganization, icon: "🏢", impact: "Brand identity" },
                  { name: "Product", has: reportData.websiteAudit.schemas?.hasProduct, icon: "🛍️", impact: "Shopping AI" },
                  { name: "FAQ", has: reportData.websiteAudit.schemas?.hasFAQ, icon: "❓", impact: "3x AI citations" },
                  { name: "Review", has: reportData.websiteAudit.schemas?.hasReview, icon: "⭐", impact: "Trust signals" },
                ].map((schema) => (
                  <div key={schema.name} className={`p-4 rounded-xl text-center transition-all ${
                    schema.has 
                      ? "bg-green-50 border-2 border-green-200" 
                      : "bg-red-50 border-2 border-red-200"
                  }`}>
                    <div className="text-2xl mb-1">{schema.has ? "✅" : "❌"}</div>
                    <div className="font-semibold text-off-black">{schema.name}</div>
                    <div className="text-xs text-off-grey mt-1">{schema.impact}</div>
                  </div>
                ))}
              </div>

              {/* Transparency - Why we reached these conclusions */}
              <div className="bg-off-white rounded-xl p-5 border border-[#E5E5E5]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔍</span>
                  <span className="font-semibold text-off-black">Our Analysis Explained</span>
                </div>
                <div className="space-y-3">
                  {reportData.websiteAudit.robotsAnalysisReason && (
                    <div className="bg-white rounded-lg p-3 border-l-4 border-[#396FFA]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-off-black text-sm">🤖 robots.txt</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          reportData.websiteAudit.robotsAllowsAI !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {reportData.websiteAudit.robotsAllowsAI !== false ? 'OK' : 'Blocked'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A5F5F]">{reportData.websiteAudit.robotsAnalysisReason}</p>
                    </div>
                  )}
                  {reportData.websiteAudit.sitemapAnalysisReason && (
                    <div className="bg-white rounded-lg p-3 border-l-4 border-[#ACD3C8]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-off-black text-sm">🗺️ Sitemap</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          reportData.websiteAudit.sitemapFound ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {reportData.websiteAudit.sitemapFound ? 'Found' : 'Missing'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A5F5F]">{reportData.websiteAudit.sitemapAnalysisReason}</p>
                    </div>
                  )}
                  {reportData.websiteAudit.productSchemaReason && (
                    <div className="bg-white rounded-lg p-3 border-l-4 border-[#ACD3C8]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-off-black text-sm">🛍️ Product Schema</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          reportData.websiteAudit.schemas?.hasProduct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {reportData.websiteAudit.schemas?.hasProduct ? 'Found' : 'Missing'}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A5F5F]">{reportData.websiteAudit.productSchemaReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 3: ACTIONS - What to Do */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {(!reportData.websiteAudit.schemas?.hasOrganization || 
              !reportData.websiteAudit.schemas?.hasProduct || 
              !reportData.websiteAudit.schemas?.hasFAQ) && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">3</div>
                  <h3 className="text-xl font-bold font-headline text-off-black">Actions: Schema Markup to Add</h3>
                </div>

                <p className="text-[#4A5F5F] mb-4 text-sm">
                  Click each schema type below to see the exact code to add. Place these in your HTML <code className="bg-off-white px-1 rounded text-xs">&lt;head&gt;</code> section.
                </p>
                
                <div className="space-y-3">
                  {/* Organization Schema - Expandable */}
                  {!reportData.websiteAudit.schemas?.hasOrganization && (
                    <div className="border border-[#ACD3C8] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSchemas(prev => 
                          prev.includes('organization') 
                            ? prev.filter(s => s !== 'organization')
                            : [...prev, 'organization']
                        )}
                        className="w-full flex items-center justify-between p-4 bg-[#D0DBF9]/20 hover:bg-[#D0DBF9]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏢</span>
                          <div className="text-left">
                            <span className="font-bold text-off-black">Organization Schema</span>
                            <p className="text-xs text-[#4A5F5F]">Helps AI identify your brand • Add to homepage</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-off-grey transition-transform ${
                          expandedSchemas.includes('organization') ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSchemas.includes('organization') && (
                        <div className="p-4 bg-white border-t border-[#ACD3C8]">
                          <p className="text-sm text-[#4A5F5F] mb-3">
                            <strong>Why it matters:</strong> Helps AI understand your brand identity, making it more likely to mention your company correctly in responses.
                          </p>
                          <div className="bg-petrol rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs text-green-400 whitespace-pre-wrap">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${reportData.brandName || 'Your Company Name'}",
  "url": "${reportData.domain ? `https://${reportData.domain}` : 'https://yourwebsite.com'}",
  "logo": "${reportData.domain ? `https://${reportData.domain}/logo.png` : 'https://yourwebsite.com/logo.png'}",
  "description": "Brief description of your company",
  "sameAs": [
    "https://linkedin.com/company/yourcompany",
    "https://twitter.com/yourcompany"
  ]
}
</script>`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Product Schema - Expandable */}
                  {!reportData.websiteAudit.schemas?.hasProduct && (
                    <div className="border border-[#ACD3C8] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSchemas(prev => 
                          prev.includes('product') 
                            ? prev.filter(s => s !== 'product')
                            : [...prev, 'product']
                        )}
                        className="w-full flex items-center justify-between p-4 bg-[#D0DBF9]/20 hover:bg-[#D0DBF9]/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🛍️</span>
                          <div className="text-left">
                            <span className="font-bold text-off-black">Product Schema</span>
                            <p className="text-xs text-[#4A5F5F]">Required for AI shopping recommendations • Add to each product page</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-off-grey transition-transform ${
                          expandedSchemas.includes('product') ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSchemas.includes('product') && (
                        <div className="p-4 bg-white border-t border-[#ACD3C8]">
                          <p className="text-sm text-[#4A5F5F] mb-3">
                            <strong>Why it matters:</strong> When users ask AI "What's the best [product]?", AI platforms look for Product schema. Without it, your products won't appear in recommendations.
                          </p>
                          <div className="bg-petrol rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs text-green-400 whitespace-pre-wrap">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Your Product Name",
  "image": "https://yoursite.com/product.jpg",
  "description": "Product description",
  "brand": { "@type": "Brand", "name": "${reportData.brandName || 'Your Brand'}" },
  "sku": "SKU-123",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "EUR",
    "price": "29.99",
    "availability": "https://schema.org/InStock"
  }
}
</script>`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FAQ Schema - Expandable */}
                  {!reportData.websiteAudit.schemas?.hasFAQ && (
                    <div className="border border-[#ACD3C8] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSchemas(prev => 
                          prev.includes('faq') 
                            ? prev.filter(s => s !== 'faq')
                            : [...prev, 'faq']
                        )}
                        className="w-full flex items-center justify-between p-4 bg-[#ACD3C8]/20 hover:bg-[#ACD3C8]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">❓</span>
                          <div className="text-left">
                            <span className="font-bold text-off-black">FAQ Schema</span>
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Highest Impact!</span>
                            <p className="text-xs text-[#4A5F5F]">3x more likely to be cited by AI • Add to FAQ & landing pages</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-off-grey transition-transform ${
                          expandedSchemas.includes('faq') ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSchemas.includes('faq') && (
                        <div className="p-4 bg-white border-t border-[#ACD3C8]">
                          <p className="text-sm text-[#4A5F5F] mb-3">
                            <strong>Why it matters:</strong> AI platforms directly cite FAQ schema content. Pages with FAQ schema are <strong>3x more likely</strong> to be referenced in AI responses.
                          </p>
                          <div className="bg-petrol rounded-lg p-4 overflow-x-auto">
                            <pre className="text-xs text-green-400 whitespace-pre-wrap">
{`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is ${reportData.brandName || 'your product'}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Clear answer with key differentiators."
      }
    },
    {
      "@type": "Question",
      "name": "How does it compare to alternatives?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your unique value proposition."
      }
    }
  ]
}
</script>`}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Implementation Tips */}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <a href="https://validator.schema.org/" target="_blank" rel="noopener noreferrer" 
                     className="inline-flex items-center gap-1 bg-off-white hover:bg-[#E5E5E5] text-[#4A5F5F] px-3 py-1.5 rounded-full transition-colors">
                    🔗 Validate Schema
                  </a>
                  <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 bg-off-white hover:bg-[#E5E5E5] text-[#4A5F5F] px-3 py-1.5 rounded-full transition-colors">
                    🔗 Google Rich Results Test
                  </a>
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">
                    ⏱️ Takes 2-4 weeks to index
                  </span>
                </div>
              </div>
            )}

            {/* Issues Found */}
            {reportData.websiteAudit.issues?.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-off-black mb-4">⚠️ Additional Issues</h3>
                <div className="space-y-2">
                  {reportData.websiteAudit.issues.map((issue: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border-l-4 ${
                      issue.severity === "critical" ? "bg-red-50 border-red-500" :
                      issue.severity === "warning" ? "bg-yellow-50 border-yellow-500" : "bg-[#D0DBF9]/30 border-[#396FFA]"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          issue.severity === "critical" ? "bg-red-200 text-red-800" :
                          issue.severity === "warning" ? "bg-yellow-200 text-yellow-800" : "bg-[#D0DBF9] text-[#192F80]"
                        }`}>
                          {issue.severity?.toUpperCase()}
                        </span>
                        <span className="font-medium text-off-black text-sm">{issue.issue}</span>
                      </div>
                      <p className="text-xs text-[#4A5F5F] mt-1 ml-16">{issue.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expanded Section: Recommendations */}
        {expandedSection === "recommendations" && (
          <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-headline text-off-black">💡 All Recommendations</h2>
              <button onClick={() => setExpandedSection(null)} className="text-off-grey hover:text-[#4A5F5F]">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            <p className="text-[#4A5F5F] mb-6">
              Based on your AI visibility analysis, here are personalized recommendations for each stage of the customer journey.
            </p>

            <div className="space-y-6">
              {allRecommendations.map((rec: any, i: number) => {
                const isLocked = !limits.showDetailedRecommendations && i > 0;
                
                return (
                  <div key={i} className={`rounded-xl p-8 border-2 relative ${
                    rec.stage === "Awareness" ? "bg-[#D0DBF9]/30 border-[#ACD3C8]" :
                    rec.stage === "Consideration" ? "bg-[#ACD3C8]/30 border-[#ACD3C8]" : "bg-green-50 border-green-200"
                  } ${isLocked ? "opacity-60" : ""}`}>
                    {/* Lock overlay for additional recommendations on free tier */}
                    {isLocked && (
                      <div 
                        className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => openUpgradeModal("recommendations")}
                      >
                        <Lock className="w-6 h-6 text-off-grey mb-2" />
                        <span className="text-sm font-medium text-[#4A5F5F]">Unlock Full Recommendations</span>
                        <span className="text-xs text-amber-500 mt-1">Click to upgrade</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{rec.stageIcon}</span>
                      <div>
                        <h3 className="text-xl font-bold font-headline text-off-black">{rec.stage} Stage</h3>
                        <div className="text-sm text-off-grey">Current visibility: {Math.round(rec.visibilityScore)}%</div>
                      </div>
                    </div>

                    {rec.recommendation && (
                      <div className="space-y-4">
                        {/* Pattern Identified */}
                        {rec.recommendation.commonPattern && (
                          <div className="bg-white rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🔍</span>
                              <span className="font-semibold text-off-black">Pattern Identified</span>
                            </div>
                            <p className="text-[#4A5F5F]">{rec.recommendation.commonPattern}</p>
                          </div>
                        )}

                        {/* Content Type Needed */}
                        {rec.recommendation.contentType && (
                          <div className="bg-white rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">📚</span>
                              <span className="font-semibold text-off-black">Content Type Needed</span>
                            </div>
                            <p className="text-[#4A5F5F]">{rec.recommendation.contentType}</p>
                          </div>
                        )}

                        {/* Recommended Action */}
                        {rec.recommendation.focusedAction && (
                          <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">✅</span>
                              <span className="font-semibold text-off-black">Recommended Action</span>
                            </div>
                            <p className="text-[#4A5F5F] font-medium">{rec.recommendation.focusedAction}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Upgrade CTA for free tier */}
            {!limits.showDetailedRecommendations && (
              <div className="mt-6 bg-off-white border-2 border-amber-200 rounded-xl p-8 text-center">
                <h3 className="text-lg font-bold text-off-black mb-2">
                  🔒 {allRecommendations.length - 1} More Recommendations Available
                </h3>
                <p className="text-[#4A5F5F] mb-4">
                  Get detailed action items with implementation guides for all funnel stages.
                </p>
                <button
                  onClick={() => openUpgradeModal("recommendations")}
                  className="bg-[#EB4200] hover:opacity-90 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2 mx-auto"
                >
                  <Sparkles className="w-5 h-5" />
                  Unlock All Recommendations
                </button>
              </div>
            )}

            {/* Technical Recommendations if available */}
            {reportData.websiteAudit?.recommendations?.length > 0 && (
              <div className="mt-8 pt-8 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold font-headline text-off-black">🔧 Technical Recommendations</h3>
                  {!limits.showDetailedRecommendations && (
                    <PremiumBadge size="md" />
                  )}
                </div>
                <div className="space-y-4">
                  {reportData.websiteAudit.recommendations.slice(0, limits.showDetailedRecommendations ? undefined : 1).map((rec: any, i: number) => (
                    <div key={i} className="bg-off-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-off-black">{rec.title}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          rec.priority === "high" ? "bg-red-100 text-red-700" :
                          rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-[#D0DBF9]/30 text-[#396FFA]"
                        }`}>
                          {rec.priority?.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-sm text-[#4A5F5F] mb-2">{rec.description}</p>
                      {rec.expectedImpact && limits.showDetailedRecommendations && (
                        <p className="text-xs text-green-600">Expected impact: {rec.expectedImpact}</p>
                      )}
                    </div>
                  ))}
                  {!limits.showDetailedRecommendations && reportData.websiteAudit.recommendations.length > 1 && (
                    <div 
                      className="bg-off-white rounded-lg p-4 text-center cursor-pointer hover:bg-[#E5E5E5] transition-colors"
                      onClick={() => openUpgradeModal("technical_audit")}
                    >
                      <Lock className="w-5 h-5 text-off-grey mx-auto mb-2" />
                      <p className="text-sm text-[#4A5F5F]">
                        +{reportData.websiteAudit.recommendations.length - 1} more technical recommendations
                      </p>
                      <p className="text-xs text-amber-500 mt-1">Click to unlock</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expanded Section: Competitive Landscape - Redesigned */}
        {expandedSection === "competitive" && (
          <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-headline text-off-black">🏆 Competitive Analysis</h2>
              <button onClick={() => setExpandedSection(null)} className="text-off-grey hover:text-[#4A5F5F]">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Status Banner */}
            {(() => {
              const yourScore = reportData.overallScore || 0;
              const allCompetitors = new Map();
              journeyStages.forEach((stage: any) => {
                if (stage?.portrayal?.competitorComparison) {
                  stage.portrayal.competitorComparison.forEach((comp: any) => {
                    const name = comp.competitorName || comp.competitor || comp.name;
                    if (name && name !== reportData.brandOrKeyword) {
                      if (!allCompetitors.has(name)) {
                        allCompetitors.set(name, { total: 0, count: 0 });
                      }
                      allCompetitors.get(name).total += (comp.mentionRate || 0);
                      allCompetitors.get(name).count += 1;
                    }
                  });
                }
              });
              const competitorScores = Array.from(allCompetitors.entries()).map(([name, data]: [string, any]) => ({
                name,
                score: Math.round(data.total / data.count)
              }));
              const beatingCount = competitorScores.filter(c => yourScore > c.score).length;
              const totalCompetitors = competitorScores.length;

              if (totalCompetitors === 0) return null;

              const isWinning = beatingCount > totalCompetitors / 2;

              return (
                <div className={`rounded-xl p-6 mb-8 ${isWinning ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`text-5xl ${isWinning ? 'text-green-500' : 'text-amber-500'}`}>
                      {isWinning ? '🏆' : '⚠️'}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold font-headline ${isWinning ? 'text-green-800' : 'text-amber-800'}`}>
                        {isWinning
                          ? `You're outperforming ${beatingCount} of ${totalCompetitors} competitors`
                          : `${totalCompetitors - beatingCount} of ${totalCompetitors} competitors have higher visibility`
                        }
                      </h3>
                      <p className={`text-sm ${isWinning ? 'text-green-600' : 'text-amber-600'}`}>
                        {isWinning
                          ? 'Keep optimizing to maintain your competitive advantage in AI recommendations.'
                          : 'There\'s opportunity to improve your AI visibility and capture more market share.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Leaderboard - Who's Winning? */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-off-black">📊 AI Visibility Leaderboard</h3>
                <details className="text-xs relative">
                  <summary className="text-off-grey cursor-pointer hover:text-[#4A5F5F]:text-off-grey">
                    How to read this?
                  </summary>
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg p-4 border border-[#E5E5E5] z-10">
                    <p className="text-[#4A5F5F] font-medium mb-2">
                      📊 Mentions = Times AI recommended the brand
                    </p>
                    <p className="text-[#4A5F5F] text-xs mb-3">
                      We tested multiple AI platforms with buyer questions. This shows how many times each brand was mentioned.
                    </p>
                    <div className="bg-off-white rounded p-3 text-xs space-y-2">
                      <p className="text-[#4A5F5F]">
                        <strong>Example:</strong> <span className="font-bold text-[#396FFA]">5/9 mentions</span> means the brand was recommended in 5 out of 9 AI responses.
                      </p>
                      <p className="text-off-grey">
                        <span className="text-green-600 font-medium">You: +2</span> = You were mentioned 2 more times<br/>
                        <span className="text-red-600 font-medium">They: +1</span> = Competitor mentioned 1 more time
                      </p>
                    </div>
                  </div>
                </details>
              </div>
              <div className="bg-off-white rounded-xl overflow-hidden">
                {(() => {
                  const yourScore = reportData.overallScore || 0;
                  const totalTests = reportData.aiTestResults?.length || 9; // Total AI queries tested
                  const allCompetitors = new Map();
                  journeyStages.forEach((stage: any) => {
                    if (stage?.portrayal?.competitorComparison) {
                      stage.portrayal.competitorComparison.forEach((comp: any) => {
                        const name = comp.competitorName || comp.competitor || comp.name;
                        if (name && name !== reportData.brandOrKeyword) {
                          if (!allCompetitors.has(name)) {
                            allCompetitors.set(name, { total: 0, count: 0, stages: {} });
                          }
                          const data = allCompetitors.get(name);
                          data.total += (comp.mentionRate || 0);
                          data.count += 1;
                          data.stages[stage?.stage] = comp.mentionRate || 0;
                        }
                      });
                    }
                  });

                  // Calculate mention counts from percentage
                  const getMentionCount = (score: number) => Math.round((score / 100) * totalTests);
                  const yourMentions = getMentionCount(yourScore);

                  // Build leaderboard with you included
                  const leaderboard = [
                    {
                      name: reportData.brandOrKeyword || 'Your Brand',
                      score: yourScore,
                      mentions: yourMentions,
                      isYou: true,
                      stages: journeyStages.reduce((acc: any, s: any) => {
                        acc[s?.stage] = s?.portrayal?.mentionRate || 0;
                        return acc;
                      }, {})
                    },
                    ...Array.from(allCompetitors.entries()).map(([name, data]: [string, any]) => {
                      const score = Math.round(data.total / data.count);
                      return {
                        name,
                        score,
                        mentions: getMentionCount(score),
                        isYou: false,
                        stages: data.stages
                      };
                    })
                  ].sort((a, b) => b.score - a.score);

                  if (leaderboard.length <= 1) {
                    return (
                      <div className="text-center py-8 text-off-grey">
                        <p className="text-lg mb-2">No competitor data available</p>
                        <p className="text-sm">Add competitors when starting your analysis to see comparison data.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-[#E5E5E5]">
                      {leaderboard.map((entry, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-4 p-4 ${entry.isYou ? 'bg-[#D0DBF9]/30' : ''}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                            idx === 1 ? 'bg-[#E5E5E5] text-[#4A5F5F]' :
                            idx === 2 ? 'bg-amber-600 text-white' : 'bg-[#E5E5E5] text-[#4A5F5F]'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${entry.isYou ? 'text-[#396FFA]' : 'text-off-black'}`}>
                                {entry.name}
                              </span>
                              {entry.isYou && (
                                <span className="text-xs bg-[#396FFA] text-white px-2 py-0.5 rounded-full">YOU</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex-1 bg-[#E5E5E5] rounded-full h-2 max-w-xs">
                                <div
                                  className={`h-2 rounded-full ${entry.isYou ? 'bg-[#D0DBF9]/30' : 'bg-off-grey'}`}
                                  style={{ width: `${entry.score}%` }}
                                />
                              </div>
                              <span className={`text-sm ${entry.isYou ? 'text-[#396FFA]' : 'text-[#4A5F5F]'}`}>
                                <span className="font-bold">{entry.mentions}</span>
                                <span className="text-xs text-off-grey">/{totalTests} mentions</span>
                              </span>
                            </div>
                          </div>
                          {!entry.isYou && (
                            <div className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                              yourMentions > entry.mentions
                                ? 'bg-green-100 text-green-700'
                                : yourMentions < entry.mentions
                                ? 'bg-red-100 text-red-700'
                                : 'bg-off-white text-[#4A5F5F]'
                            }`}>
                              {yourMentions > entry.mentions
                                ? `You: +${yourMentions - entry.mentions}`
                                : yourMentions < entry.mentions
                                ? `They: +${entry.mentions - yourMentions}`
                                : 'Tied'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Evidence: When Competitors Get Recommended Instead */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-off-black mb-4">📝 Evidence: When AI Recommends Competitors Over You</h3>
              <p className="text-sm text-[#4A5F5F] mb-4">
                Strategic analysis of AI responses where competitors were mentioned instead of your brand.
              </p>
              {(() => {
                const allResponses = reportData.aiTestResults || [];
                const competitors = reportData.competitors || [];
                const brandName = reportData.brandOrKeyword || '';
                const category = reportData.category || reportData.subcategory || 'this category';
                const discoveredQuestions = reportData.discoveredQuestions || [];

                // Helper to find the funnel stage for a question
                const getQuestionStage = (questionText: string): { stage: string; label: string; icon: string } | null => {
                  const questionObj = discoveredQuestions.find((q: any) => q.question === questionText);
                  if (!questionObj) return null;
                  const cat = questionObj.category?.toLowerCase() || '';
                  if (cat.includes('awareness')) return { stage: 'awareness', label: 'Awareness', icon: '🔍' };
                  if (cat.includes('consideration')) return { stage: 'consideration', label: 'Consideration', icon: '⚖️' };
                  if (cat.includes('decision')) return { stage: 'decision', label: 'Decision', icon: '✅' };
                  return null;
                };

                // Helper to find competitors mentioned in response text
                const findCompetitorsInText = (text: string): string[] => {
                  if (!text || competitors.length === 0) return [];
                  const lowerText = text.toLowerCase();
                  return competitors.filter((comp: string) =>
                    lowerText.includes(comp.toLowerCase())
                  );
                };

                // AGGREGATE by question+platform to avoid showing duplicate evidence
                // For each question, show ONE representative response per platform
                const questionPlatformGroups: Record<string, { responses: any[], brandMentionCount: number, totalCount: number }> = {};

                allResponses.forEach((r: any) => {
                  const key = `${r.question}|||${r.platform}`;
                  if (!questionPlatformGroups[key]) {
                    questionPlatformGroups[key] = { responses: [], brandMentionCount: 0, totalCount: 0 };
                  }
                  questionPlatformGroups[key].responses.push(r);
                  questionPlatformGroups[key].totalCount++;
                  if (r.brandMentioned) questionPlatformGroups[key].brandMentionCount++;
                });

                // Find question+platform combos where brand was NOT mentioned in majority (< 50%)
                // Pick the best representative response (one with competitors mentioned, or longest)
                const competitorWins: any[] = [];

                Object.entries(questionPlatformGroups).forEach(([key, data]) => {
                  const mentionRate = data.brandMentionCount / data.totalCount;
                  // Only show if brand was NOT mentioned in majority of responses for this question
                  if (mentionRate < 0.5) {
                    // Pick best representative: prefer one with competitors, then with follow-up
                    const bestResponse = data.responses
                      .filter((r: any) => !r.brandMentioned && r.fullResponse)
                      .map((r: any) => ({
                        ...r,
                        foundCompetitors: findCompetitorsInText(r.fullResponse),
                        hasFollowUp: !!(r.followUpQuestion && r.followUpResponse)
                      }))
                      .sort((a: any, b: any) => {
                        // Prefer responses with follow-ups
                        if (a.hasFollowUp && !b.hasFollowUp) return -1;
                        if (b.hasFollowUp && !a.hasFollowUp) return 1;
                        // Then prefer those with competitors
                        if (a.foundCompetitors.length > b.foundCompetitors.length) return -1;
                        if (b.foundCompetitors.length > a.foundCompetitors.length) return 1;
                        // Then by response length
                        return (b.fullResponse?.length || 0) - (a.fullResponse?.length || 0);
                      })[0];

                    if (bestResponse && (bestResponse.foundCompetitors.length > 0 || bestResponse.fullResponse.length > 100)) {
                      bestResponse._aggregateStats = {
                        testedCount: data.totalCount,
                        brandMentionCount: data.brandMentionCount
                      };
                      competitorWins.push(bestResponse);
                    }
                  }
                });

                // Deduplicate by question (show only one platform per question for cleaner display)
                const seenQuestions = new Set<string>();
                const uniqueCompetitorWins = competitorWins
                  .sort((a: any, b: any) => {
                    // Prefer those with follow-ups first
                    if (a.hasFollowUp && !b.hasFollowUp) return -1;
                    if (b.hasFollowUp && !a.hasFollowUp) return 1;
                    return b.foundCompetitors.length - a.foundCompetitors.length;
                  })
                  .filter((r: any) => {
                    if (seenQuestions.has(r.question)) return false;
                    seenQuestions.add(r.question);
                    return true;
                  })
                  .slice(0, 4);

                if (uniqueCompetitorWins.length === 0) {
                  const missedOpportunities = allResponses
                    .filter((r: any) => !r.brandMentioned && r.fullResponse && r.fullResponse.length > 50)
                    .slice(0, 3);

                  if (missedOpportunities.length === 0) {
                    return (
                      <div className="bg-green-50 rounded-xl p-6 text-center">
                        <span className="text-4xl mb-3 block">🎉</span>
                        <p className="text-green-800 font-medium">
                          Excellent! Your brand was mentioned in all AI responses analyzed.
                        </p>
                      </div>
                    );
                  }

                  // Show missed opportunities with strategic insights
                  return (
                    <div className="space-y-4">
                      {missedOpportunities.map((response: any, idx: number) => {
                        const insight = generateStrategicInsight(response, brandName, category, true);
                        const questionStage = getQuestionStage(response.question);
                        return (
                          <div key={idx} className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                  <span className="text-amber-600 font-bold text-sm">
                                    {response.platform?.substring(0, 2).toUpperCase() || 'AI'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                                    {response.platform || 'AI Platform'}
                                  </span>
                                  {/* Funnel Stage Badge */}
                                  {questionStage && (
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                                      questionStage.stage === 'awareness' ? 'bg-[#D0DBF9]/30 text-[#396FFA]' :
                                      questionStage.stage === 'consideration' ? 'bg-[#D0DBF9] text-[#192F80]' :
                                      'bg-green-100 text-green-700'
                                    }`}>
                                      <span>{questionStage.icon}</span>
                                      <span>{questionStage.label}</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-[#4A5F5F] mb-2">
                                  <span className="font-medium">Query:</span> &quot;{response.question}&quot;
                                </p>

                                {/* Strategic Insight */}
                                <div className="bg-white rounded-lg p-4 border-l-4 border-amber-400 mb-3">
                                  <p className="text-sm font-medium text-off-black mb-2">
                                    🔍 {insight.insight}
                                  </p>
                                  <p className="text-xs text-amber-700 italic">
                                    💡 {insight.recommendation}
                                  </p>
                                </div>

                                {/* Supporting snippet */}
                                <details className="group">
                                  <summary className="text-xs text-off-grey cursor-pointer hover:text-[#4A5F5F]">
                                    View AI response snippet →
                                  </summary>
                                  <div className="mt-2 bg-off-white rounded p-3 text-xs text-[#4A5F5F] italic">
                                    &quot;{extractSmartSnippet(response.fullResponse, 300)}&quot;
                                  </div>
                                </details>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {uniqueCompetitorWins.map((response: any, idx: number) => {
                      const insight = generateStrategicInsight(response, brandName, category, true);
                      const stats = response._aggregateStats;
                      const questionStage = getQuestionStage(response.question);
                      return (
                        <div key={idx} className="bg-red-50 rounded-xl p-5 border border-red-200">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="text-red-600 font-bold text-sm">
                                  {response.platform?.substring(0, 2).toUpperCase() || 'AI'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded">
                                  {response.platform || 'AI Platform'}
                                </span>
                                {/* Funnel Stage Badge */}
                                {questionStage && (
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                                    questionStage.stage === 'awareness' ? 'bg-[#D0DBF9]/30 text-[#396FFA]' :
                                    questionStage.stage === 'consideration' ? 'bg-[#D0DBF9] text-[#192F80]' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    <span>{questionStage.icon}</span>
                                    <span>{questionStage.label}</span>
                                  </span>
                                )}
                                {stats && (
                                  <span className="text-xs text-off-grey">
                                    (missed {stats.testedCount - stats.brandMentionCount}/{stats.testedCount} tests)
                                  </span>
                                )}
                                {response.foundCompetitors?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {response.foundCompetitors.slice(0, 3).map((comp: string, cIdx: number) => (
                                      <span key={cIdx} className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                                        {comp}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <p className="text-sm text-[#4A5F5F] mb-2">
                                <span className="font-medium">Query:</span> &quot;{response.question}&quot;
                              </p>

                              {/* Strategic Insight */}
                              <div className="bg-white rounded-lg p-4 border-l-4 border-red-400 mb-3">
                                <p className="text-sm font-medium text-off-black mb-2">
                                  🔍 {insight.insight}
                                </p>
                                <p className="text-xs text-red-700 italic">
                                  💡 {insight.recommendation}
                                </p>
                              </div>

                              {/* Follow-up Question & Response - WHY wasn't brand mentioned */}
                              {response.followUpQuestion && response.followUpResponse && (
                                <div className="mt-3 bg-[#D0DBF9]/30 rounded-lg p-4 border border-[#ACD3C8]">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[#192F80]">🤔</span>
                                    <span className="text-sm font-medium text-[#192F80]">
                                      We asked: &quot;{response.followUpQuestion}&quot;
                                    </span>
                                  </div>
                                  <div className="text-sm text-[#192F80] leading-relaxed whitespace-pre-wrap">
                                    {response.followUpResponse}
                                  </div>
                                  {response.followUpSources && (response.followUpSources as any[]).length > 0 && (
                                    <div className="mt-3 flex flex-wrap items-center gap-1">
                                      <span className="text-xs text-[#192F80]">Sources cited:</span>
                                      {(response.followUpSources as any[]).slice(0, 3).map((src: any, sIdx: number) => (
                                        <span key={sIdx} className="text-xs bg-[#D0DBF9] text-[#192F80] px-2 py-0.5 rounded">
                                          {src.domain || 'source'}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* View full AI response - collapsible */}
                              <details className="group mt-3">
                                <summary className="text-xs text-off-grey cursor-pointer hover:text-[#4A5F5F]:text-off-grey">
                                  View full AI response →
                                </summary>
                                <div className="mt-2 bg-off-white rounded-lg p-4 text-sm text-[#4A5F5F] leading-relaxed max-h-64 overflow-y-auto">
                                  {response.fullResponse}
                                </div>
                              </details>

                              {/* Sources - important for understanding why */}
                              {(response.sources?.length > 0 || response.citations?.length > 0) && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-off-grey">🔗 AI cited:</span>
                                  {[...(response.sources || []), ...(response.citations || [])].slice(0, 3).map((src: any, sIdx: number) => {
                                    try {
                                      const url = typeof src === 'string' ? src : src.url;
                                      const hostname = new URL(url).hostname.replace('www.', '');
                                      return (
                                        <a
                                          key={sIdx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs bg-red-100 text-red-700 hover:underline px-2 py-1 rounded"
                                        >
                                          {hostname}
                                        </a>
                                      );
                                    } catch {
                                      return null;
                                    }
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Summary Stats */}
            <div className="bg-[#D0DBF9]/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-off-black mb-4">📊 Analysis Summary</h3>
              {(() => {
                const allResponses = reportData.aiTestResults || [];
                const competitors = reportData.competitors || [];
                const totalResponses = allResponses.length;
                const brandMentions = allResponses.filter((r: any) => r.brandMentioned).length;

                // Calculate missed opportunities (brand not mentioned when response exists)
                const missedOpportunities = allResponses.filter((r: any) => !r.brandMentioned && r.fullResponse).length;

                const positiveMentions = allResponses.filter((r: any) =>
                  r.brandMentioned && r.sentiment === 'positive'
                ).length;
                const firstPositions = allResponses.filter((r: any) =>
                  r.brandMentioned && r.position === 1
                ).length;

                // Calculate mention rate
                const mentionRate = totalResponses > 0 ? Math.round((brandMentions / totalResponses) * 100) : 0;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-petrol">{totalResponses}</div>
                        <div className="text-xs text-off-grey mt-1">AI Responses Analyzed</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{brandMentions}</div>
                        <div className="text-xs text-off-grey mt-1">Brand Mentions</div>
                        <div className="text-xs text-green-600 font-medium mt-1">{mentionRate}% rate</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-amber-600">{missedOpportunities}</div>
                        <div className="text-xs text-off-grey mt-1">Missed Opportunities</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center">
                        <div className="text-3xl font-bold text-[#396FFA]">{positiveMentions}</div>
                        <div className="text-xs text-off-grey mt-1">Positive Mentions</div>
                      </div>
                    </div>

                    {/* Quick insight */}
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm text-[#4A5F5F]">
                        {mentionRate >= 70 ? (
                          <>🎯 <strong>Strong visibility!</strong> Your brand appears in {mentionRate}% of AI responses.</>
                        ) : mentionRate >= 40 ? (
                          <>📈 <strong>Room for growth.</strong> Your brand appears in {mentionRate}% of responses. Target: 70%+</>
                        ) : (
                          <>⚠️ <strong>Visibility gap detected.</strong> Only {mentionRate}% mention rate. AI platforms are recommending alternatives.</>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Visibility Gap Alert (for free tier with low scores) */}
        {tier === "free" && (reportData.overallScore || 0) < 70 && (
          <VisibilityGapAlert
            brandName={reportData.brandOrKeyword || "Your Brand"}
            brandScore={reportData.overallScore || 0}
            competitorName={reportData.competitors?.[0]}
            competitorScore={(() => {
              // Calculate competitor's average visibility if available
              let total = 0, count = 0;
              journeyStages.forEach((stage: any) => {
                if (stage?.portrayal?.competitorComparison?.[0]?.mentionRate) {
                  total += stage.portrayal.competitorComparison[0].mentionRate;
                  count++;
                }
              });
              return count > 0 ? Math.round(total / count) : undefined;
            })()}
            issuesFound={allRecommendations.length}
            onUpgrade={() => openUpgradeModal("recommendations")}
          />
        )}

        {/* Expanded Section: Methodology & FAQ */}
        {expandedSection === "methodology" && (
          <div className="bg-white rounded-xl border-2 border-[#E5E5E5] shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-headline text-off-black">❓ How It Works - Methodology & Transparency</h2>
              <button onClick={() => setExpandedSection(null)} className="text-off-grey hover:text-[#4A5F5F]">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* How is the AI Visibility Score calculated? */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-off-black mb-3 flex items-center gap-2">
                  <span className="text-[#396FFA]">📊</span> How is the AI Visibility Score calculated?
                </h3>
                <p className="text-[#4A5F5F] mb-3">
                  Your AI Visibility Score (0-100) is a weighted combination of three key metrics:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-[#D0DBF9]/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-[#396FFA] mb-1">50%</div>
                    <div className="font-semibold text-off-black">Mention Rate</div>
                    <p className="text-sm text-[#4A5F5F]">How often AI platforms mention your brand when answering relevant questions.</p>
                  </div>
                  <div className="bg-[#ACD3C8]/30 rounded-lg p-4">
                    <div className="text-2xl font-bold text-[#396FFA] mb-1">30%</div>
                    <div className="font-semibold text-off-black">Position</div>
                    <p className="text-sm text-[#4A5F5F]">Where your brand appears in responses. Being mentioned first is better than being listed third.</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700 mb-1">20%</div>
                    <div className="font-semibold text-off-black">Sentiment</div>
                    <p className="text-sm text-[#4A5F5F]">Whether AI speaks positively, neutrally, or negatively about your brand.</p>
                  </div>
                </div>
              </div>

              {/* What is the audit process? */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-off-black mb-3 flex items-center gap-2">
                  <span className="text-[#396FFA]">🔬</span> What is the audit process?
                </h3>
                <p className="text-[#4A5F5F] mb-3">
                  Our analysis follows a rigorous, multi-step process:
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="bg-[#ACD3C8]/30 text-[#396FFA] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div>
                      <span className="font-semibold text-off-black">Question Discovery</span>
                      <p className="text-sm text-[#4A5F5F]">We pull real questions from search data (DataForSEO) and generate strategic questions based on your industry.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-[#ACD3C8]/30 text-[#396FFA] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div>
                      <span className="font-semibold text-off-black">Multi-Platform Testing</span>
                      <p className="text-sm text-[#4A5F5F]">Each question is sent to all 4 AI platforms: ChatGPT (OpenAI), Google Gemini, Microsoft Copilot, and Perplexity. We run multiple tests per platform for statistical reliability.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-[#ACD3C8]/30 text-[#396FFA] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <span className="font-semibold text-off-black">Response Analysis</span>
                      <p className="text-sm text-[#4A5F5F]">We analyze each response for brand mentions, positioning, sentiment, and competitor references using pattern matching and NLP.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-[#ACD3C8]/30 text-[#396FFA] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <div>
                      <span className="font-semibold text-off-black">Technical Audit</span>
                      <p className="text-sm text-[#4A5F5F]">If you provided a domain, we scan your website for schema markup, content structure, FAQ sections, and robots.txt settings that affect AI visibility.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How are recommendations generated? */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-off-black mb-3 flex items-center gap-2">
                  <span className="text-amber-500">💡</span> How are recommendations generated?
                </h3>
                <p className="text-[#4A5F5F] mb-3">
                  Our recommendations are data-driven and specific to your results:
                </p>
                <ul className="space-y-2 text-[#4A5F5F]">
                  <li className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Pattern Analysis:</strong> We identify common themes across AI responses - what topics trigger mentions, what questions lead to competitor recommendations, etc.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Gap Identification:</strong> We flag funnel stages where your visibility is low compared to others, indicating content opportunities.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Technical Issues:</strong> Missing schema markup or blocked AI crawlers directly impact how AI platforms understand your brand.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span><strong>Actionable Steps:</strong> Each recommendation includes the &quot;what&quot; and &quot;why&quot; - specific actions you can take and the expected impact.</span>
                  </li>
                </ul>
              </div>

              {/* What makes this analysis reliable? */}
              <div>
                <h3 className="text-lg font-semibold text-off-black mb-3 flex items-center gap-2">
                  <span className="text-green-500">✅</span> What makes this analysis reliable?
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-off-white rounded-lg p-4">
                    <div className="font-semibold text-off-black mb-1">Real API Calls</div>
                    <p className="text-sm text-[#4A5F5F]">We use actual ChatGPT (OpenAI) and Gemini (Google) APIs - not simulations or scraping. You see real AI responses.</p>
                  </div>
                  <div className="bg-off-white rounded-lg p-4">
                    <div className="font-semibold text-off-black mb-1">Statistical Significance</div>
                    <p className="text-sm text-[#4A5F5F]">3 tests per question per platform reduces noise from AI variability. More tests = more reliable patterns.</p>
                  </div>
                  <div className="bg-off-white rounded-lg p-4">
                    <div className="font-semibold text-off-black mb-1">Full Funnel Coverage</div>
                    <p className="text-sm text-[#4A5F5F]">Testing across Awareness, Consideration, and Decision stages gives a complete picture of the customer journey.</p>
                  </div>
                  <div className="bg-off-white rounded-lg p-4">
                    <div className="font-semibold text-off-black mb-1">Transparent Methodology</div>
                    <p className="text-sm text-[#4A5F5F]">You see the actual questions tested, the real AI responses, and exactly how scores are calculated.</p>
                  </div>
                </div>
              </div>
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

      {/* Login Gate Modal */}
      {showLoginGate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <LoginGate
            brandName={reportData?.brandOrKeyword || "Your Brand"}
            overallScore={reportData?.overallScore || 0}
            onLogin={handleLogin}
            onSkip={() => setShowLoginGate(false)}
          />
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-off-black">
                Schedule AI Visibility Analysis
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-off-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-off-grey" />
              </button>
            </div>

            <div className="p-6">
              {!isProfessionalOrHigher() ? (
                // Free tier - show upgrade prompt
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-amber-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-off-black mb-2">
                    Upgrade to Schedule
                  </h4>
                  <p className="text-[#4A5F5F] mb-6">
                    Automated scheduling is available on Professional and Partner tiers.
                    Get regular AI visibility reports delivered automatically.
                  </p>
                  <div className="space-y-3">
                    <button className="w-full py-2 px-4 bg-[#396FFA] text-white rounded-lg hover:opacity-90 transition-colors">
                      Upgrade to Professional
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="w-full py-2 px-4 border border-[#E5E5E5] text-[#4A5F5F] rounded-lg hover:bg-off-white transition-colors"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              ) : existingSchedule ? (
                // Already scheduled
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-off-black mb-2">
                    Already Scheduled
                  </h4>
                  <p className="text-[#4A5F5F] mb-4">
                    This analysis is scheduled to run <span className="font-medium">{existingSchedule.frequency}</span>.
                  </p>
                  <p className="text-sm text-off-grey mb-6">
                    Next run: {new Date(existingSchedule.nextRun).toLocaleDateString()}
                  </p>
                  <div className="space-y-3">
                    <Link
                      href="/automation"
                      className="block w-full py-2 px-4 bg-[#396FFA] text-white rounded-lg hover:opacity-90 transition-colors text-center"
                    >
                      Manage in Automation Dashboard
                    </Link>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="w-full py-2 px-4 border border-[#E5E5E5] text-[#4A5F5F] rounded-lg hover:bg-off-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                // Schedule form
                <div>
                  <p className="text-[#4A5F5F] mb-6">
                    Schedule automated AI visibility checks for <span className="font-medium">{reportData?.brandOrKeyword}</span>
                    with the same setup as this analysis.
                  </p>

                  <div className="space-y-4">
                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-[#4A5F5F] mb-2">
                        Frequency
                      </label>
                      <select
                        value={scheduleFrequency}
                        onChange={(e) => setScheduleFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                        className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white text-off-black"
                      >
                        {isPartner() && <option value="daily">Daily</option>}
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    {/* Day selection */}
                    {scheduleFrequency === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-[#4A5F5F] mb-2">
                          Day of Week
                        </label>
                        <select
                          value={scheduleDay}
                          onChange={(e) => setScheduleDay(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white text-off-black"
                        >
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                          <option value={0}>Sunday</option>
                        </select>
                      </div>
                    )}

                    {scheduleFrequency === 'monthly' && (
                      <div>
                        <label className="block text-sm font-medium text-[#4A5F5F] mb-2">
                          Day of Month
                        </label>
                        <select
                          value={scheduleDay}
                          onChange={(e) => setScheduleDay(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white text-off-black"
                        >
                          {[1, 5, 10, 15, 20, 25].map(day => (
                            <option key={day} value={day}>{day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Time */}
                    <div>
                      <label className="block text-sm font-medium text-[#4A5F5F] mb-2">
                        Time (UTC)
                      </label>
                      <select
                        value={scheduleHour}
                        onChange={(e) => setScheduleHour(parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg bg-white text-off-black"
                      >
                        {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                          <option key={hour} value={hour}>{hour}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button
                      onClick={scheduleAnalysis}
                      disabled={isScheduling}
                      className="w-full py-2 px-4 bg-[#396FFA] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isScheduling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          Schedule Analysis
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(false)}
                      className="w-full py-2 px-4 border border-[#E5E5E5] text-[#4A5F5F] rounded-lg hover:bg-off-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Transform database analysis data to report format
function transformAnalysisData(data: any) {
  // API returns data nested under 'analysis' key
  const analysis = data.analysis || data;
  const insights = analysis.aiInsights || [];
  
  // Extract website audit insight
  const websiteAuditInsight = insights.find((i: any) => i.category === "website_audit");
  const websiteAudit = websiteAuditInsight?.expectedImpact || null;
  
  // Extract journey stage insights
  const journeyStageInsights = insights.filter((i: any) => i.category === "journey_stage");
  
  // Sort by priority (awareness=1, consideration=2, decision=3)
  journeyStageInsights.sort((a: any, b: any) => a.priority - b.priority);

  // Transform journey stages
  const journeyStages = journeyStageInsights.map((insight: any) => {
    const stageData = insight.expectedImpact;
    
    // Map icon names
    const iconMap: any = {
      awareness: "Brain",
      consideration: "Users",
      decision: "ShoppingCart",
    };

    return {
      stage: stageData.stage || insight.title.toLowerCase(),
      stageLabel: stageData.stageLabel || insight.title.split(" ")[0],
      stageDescription: stageData.stageDescription || insight.finding,
      icon: iconMap[stageData.stage] || "Brain",
      color: 
        stageData.stage === "awareness" ? "from-blue-500 to-blue-600" :
        stageData.stage === "consideration" ? "from-[#1D5142] to-[#173D32]" :
        "from-pink-500 to-pink-600",
      questions: stageData.questions || [],
      portrayal: stageData.portrayal || {
        mentionRate: 0,
        totalQuestions: 0,
        totalTests: 0,
        totalAnswersAnalyzed: 0,
        visibilityScore: 0,
        averagePosition: 0,
        sentiment: { positive: 0, negative: 0, neutral: 0, dominant: "neutral" },
        aiAnswerExamples: [],
        competitorComparison: [],
      },
      recommendation: stageData.recommendation || {
        commonPattern: insight.finding,
        contentType: insight.aiReasoning,
        focusedAction: insight.actions[0] || "Continue monitoring AI visibility",
      },
      contentPlan: stageData.contentPlan || null,
      citationAnalysis: stageData.citationAnalysis || null,
    };
  });

  // Calculate overall metrics
  const totalTests = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.totalTests || 0), 0);
  const totalQuestions = journeyStages.reduce((sum: number, stage: any) => sum + (stage.questions?.length || 0), 0);
  
  // Calculate overall scores
  const avgMentionRate = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.mentionRate || 0), 0) / Math.max(journeyStages.length, 1);
  const avgPosition = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.averagePosition || 0), 0) / Math.max(journeyStages.length, 1);
  const avgSentimentPositive = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.sentiment.positive || 0), 0) / Math.max(journeyStages.length, 1);
  const avgSentimentNegative = journeyStages.reduce((sum: number, stage: any) => sum + (stage.portrayal.sentiment.negative || 0), 0) / Math.max(journeyStages.length, 1);
  
  // Calculate position score (1st = 100pts, 5th = 20pts)
  // IMPORTANT: If brand is NOT mentioned, position doesn't matter - use 0
  const positionScore = avgMentionRate > 0 && avgPosition > 0 
    ? Math.max(0, 100 - (avgPosition - 1) * 20) 
    : (avgMentionRate > 0 ? 50 : 0);  // Only default to 50 if mentioned but no position
  
  // Calculate sentiment score (-100 to +100, normalized to 0-100)
  // IMPORTANT: If brand is NOT mentioned, sentiment is meaningless - use 0
  const sentimentDiff = avgSentimentPositive - avgSentimentNegative;
  const normalizedSentimentScore = avgMentionRate > 0
    ? Math.max(0, Math.min(100, ((sentimentDiff + 100) / 2)))
    : 0;  // Sentiment is 0 if brand not mentioned

  // Overall visibility score with proper weights
  // If not mentioned at all (avgMentionRate = 0), score MUST be 0
  const overallScore = avgMentionRate > 0
    ? Math.round((avgMentionRate * 0.50) + (positionScore * 0.30) + (normalizedSentimentScore * 0.20))
    : 0;

  const scoringMethodology = {
    mentionRate: {
      weight: 50,
      description: "How often your brand appears in AI responses",
      yourScore: Math.round(avgMentionRate),
      calculation: "(Mentions ÷ Total Tests) × 100",
    },
    averagePosition: {
      weight: 30,
      description: "Where your brand is mentioned (1st = 100pts, 5th = 20pts)",
      yourScore: Math.round(positionScore),
      calculation: "100 - ((Avg Position - 1) × 20)",
    },
    sentiment: {
      weight: 20,
      description: "How positively your brand is portrayed",
      yourScore: Math.round(normalizedSentimentScore),
      calculation: "(Positive% - Negative%) normalized to 0-100",
    },
  };

  // Extract competitors if available
  const competitors = analysis.competitor 
    ? [analysis.competitor] 
    : (analysis.competitors || []);

  // Calculate platform breakdown from AI test results
  const platformBreakdown: Record<string, {
    mentionRate: number;
    avgPosition: number;
    visibilityShare: number;
    totalTests: number;
    mentions: number;
  }> = {};

  // Initialize platforms
  const platforms = ["ChatGPT", "Gemini", "Perplexity"];
  platforms.forEach(p => {
    platformBreakdown[p] = {
      mentionRate: 0,
      avgPosition: 0,
      visibilityShare: 0,
      totalTests: 0,
      mentions: 0,
    };
  });

  // Aggregate data from journey stages (which contain AI response data)
  let totalMentionsAcrossAll = 0;
  journeyStages.forEach((stage: any) => {
    const examples = stage.portrayal?.aiAnswerExamples || [];
    examples.forEach((example: any) => {
      const platform = example.platform;
      if (platform && platformBreakdown[platform]) {
        platformBreakdown[platform].totalTests++;
        if (example.sentiment !== "not_mentioned") {
          platformBreakdown[platform].mentions++;
          totalMentionsAcrossAll++;
          if (example.brandPosition > 0) {
            // Accumulate positions for averaging later
            platformBreakdown[platform].avgPosition += example.brandPosition;
          }
        }
      }
    });
  });

  // Also check AI test results directly if available
  const aiTestResults = analysis.aiTestResults || [];
  aiTestResults.forEach((result: any) => {
    const platform = result.platform;
    if (platform && platformBreakdown[platform]) {
      platformBreakdown[platform].totalTests++;
      if (result.brandMentioned) {
        platformBreakdown[platform].mentions++;
        totalMentionsAcrossAll++;
        if (result.position > 0) {
          platformBreakdown[platform].avgPosition += result.position;
        }
      }
    }
  });

  // Calculate final metrics for each platform
  platforms.forEach(p => {
    const pd = platformBreakdown[p];
    if (pd.totalTests > 0) {
      pd.mentionRate = (pd.mentions / pd.totalTests) * 100;
      // Average position (only if there were mentions with positions)
      if (pd.mentions > 0) {
        pd.avgPosition = pd.avgPosition / pd.mentions;
      }
    }
    // Visibility share = what % of total mentions came from this platform
    if (totalMentionsAcrossAll > 0) {
      pd.visibilityShare = (pd.mentions / totalMentionsAcrossAll) * 100;
    }
  });

  // Use executive summary score (weighted by stage) as the main score if available
  // This ensures consistency between executive summary and visibility card
  const finalScore = analysis.executiveSummary?.overallScore ?? overallScore;

  return {
    brandOrKeyword: analysis.brandOrKeyword,
    domain: analysis.domain,
    competitors: competitors,
    overallScore: finalScore,  // Use consistent score from executive summary
    totalTests: totalTests || 18, // Default to 18 (9 questions × 2 tests)
    totalQuestions: totalQuestions || 9, // Default to 9
    scoringMethodology,
    journeyStages,
    websiteAudit,
    platformBreakdown,
    // Include raw data for detailed answers display
    aiTestResults: analysis.aiTestResults || [],
    discoveredQuestions: analysis.discoveredQuestions || [],
    // Executive summary and patterns
    executiveSummary: analysis.executiveSummary || null,
    patterns: analysis.patterns || null,
    stageWeights: analysis.stageWeights || { awareness: 0.20, consideration: 0.35, decision: 0.45 },
  };
}
