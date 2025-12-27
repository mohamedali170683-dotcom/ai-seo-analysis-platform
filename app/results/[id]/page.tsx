"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Users, ShoppingCart, ChevronDown, ChevronUp, ArrowLeft, Lock, Sparkles, Download, FileText, ArrowRight } from "lucide-react";
import { useTier } from "@/lib/tier";
import { UpgradeModal, PremiumBadge, BlurredContent, VisibilityGapAlert, AgencyCTA } from "@/components/UpgradeModal";
import { UpgradeModalTrigger } from "@/lib/tier/types";
import { EmailGate } from "@/components/EmailGate";
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

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.id as string;

  // Tier management
  const { tier, limits, isStageAllowed, isPlatformAllowed, userEmail, setUserEmail } = useTier();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalTrigger, setUpgradeModalTrigger] = useState<UpgradeModalTrigger>("funnel_stages");
  
  // Email gate for free tier
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [hasSubmittedEmail, setHasSubmittedEmail] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("pending");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedSchemas, setExpandedSchemas] = useState<string[]>([]);

  // Helper to show upgrade modal
  const openUpgradeModal = (trigger: UpgradeModalTrigger) => {
    setUpgradeModalTrigger(trigger);
    setShowUpgradeModal(true);
  };
  
  // Handle email submission
  const handleEmailSubmit = (email: string) => {
    setUserEmail(email);
    setHasSubmittedEmail(true);
    setShowEmailGate(false);
  };

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
        
        setProgress(analysis.progress || 0);
        setStatus(analysis.status);

        if (analysis.status === "completed") {
          clearInterval(pollInterval);
          setReportData(transformAnalysisData(data));
          setLoading(false);
          
          // Show email gate for free tier users who haven't submitted email
          if (tier === "free" && !userEmail && !hasSubmittedEmail) {
            setShowEmailGate(true);
          }
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
  }, [analysisId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full mb-6 animate-pulse">
                <Brain className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {status === "running" ? "Analyzing Your Brand..." : "Preparing Analysis..."}
            </h2>
            <p className="text-gray-600 mb-8">
              {status === "running"
                ? "Testing your brand across AI platforms and user journey stages"
                : "Setting up your analysis..."}
            </p>
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div className={progress >= 10 ? "text-green-600 font-semibold" : ""}>
                ✓ Questions Generated
              </div>
              <div className={progress >= 50 ? "text-green-600 font-semibold" : ""}>
                ✓ AI Testing
              </div>
              <div className={progress >= 90 ? "text-green-600 font-semibold" : ""}>
                ✓ Analysis Complete
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Failed</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-cyan-600"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }
  
  // Show email gate for free tier
  if (showEmailGate) {
    return (
      <EmailGate
        brandName={reportData.brandOrKeyword || "Your Brand"}
        competitorName={reportData.competitors?.[0]}
        onEmailSubmit={handleEmailSubmit}
        onSkip={() => {
          setHasSubmittedEmail(true);
          setShowEmailGate(false);
        }}
      />
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
    <div className="min-h-screen bg-gray-50">
      {/* Analysis Complete Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-4">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <span className="font-bold text-lg">{reportData.brandOrKeyword} - Velaris Report</span>
              <div className="text-sm text-green-100">
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
                  ? "bg-white text-green-600 hover:bg-green-50" 
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
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/analyze"
              className="px-4 py-2 bg-white text-green-600 rounded-lg text-sm font-semibold hover:bg-green-50 transition-all"
            >
              Run My Next Audit
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* Executive Summary Section - ENHANCED WITH PLATFORM & COMPETITIVE DATA */}
        {reportData.executiveSummary && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📋</span>
                  <h2 className="text-2xl font-bold">Executive Summary</h2>
                </div>
                <p className="text-indigo-200">{reportData.executiveSummary.headline}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold">{reportData.executiveSummary.overallScore}%</div>
                <div className="text-indigo-200 text-sm">Overall Visibility Score</div>
              </div>
            </div>

            {/* Key Finding */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-indigo-100 mb-2">🎯 Key Finding</h3>
              <p className="text-white">{reportData.executiveSummary.keyFinding}</p>
            </div>

            {/* Platform Performance & Competitive Position */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Mention Rate */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold text-indigo-100 mb-3">📊 Brand Mention Rate</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">{Math.round(reportData.scoringMethodology?.mentionRate?.yourScore || 0)}%</span>
                  <span className="text-sm text-indigo-200">across all platforms</span>
                </div>
                <p className="text-xs text-indigo-200">Your brand mentioned in {Math.round(reportData.scoringMethodology?.mentionRate?.yourScore || 0)}% of AI responses</p>
              </div>

              {/* Visibility Share by Platform */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold text-indigo-100 mb-3">🤖 Visibility by AI Platform</h3>
                <div className="space-y-2">
                  {reportData.platformBreakdown && Object.entries(reportData.platformBreakdown).map(([platform, data]: [string, any]) => (
                    data.totalTests > 0 && (
                      <div key={platform} className="flex items-center justify-between text-sm">
                        <span className="text-indigo-100">{platform}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{Math.round(data.mentionRate)}%</span>
                          <span className="text-xs text-indigo-200">({Math.round(data.visibilityShare)}% share)</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Top Actions */}
            {reportData.executiveSummary.topActions && reportData.executiveSummary.topActions.length > 0 && (
              <div>
                <h3 className="font-semibold text-indigo-100 mb-3">🚀 Priority Actions</h3>
                <div className="space-y-2">
                  {reportData.executiveSummary.topActions.slice(0, 3).map((action: any, i: number) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-start gap-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        action.priority === 'high' ? 'bg-red-500' :
                        action.priority === 'medium' ? 'bg-yellow-500 text-yellow-900' : 'bg-green-500'
                      }`}>
                        {action.priority?.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium">{action.action}</p>
                        <p className="text-xs text-indigo-200 mt-1">{action.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* MAIN LAYOUT: Overall Score + Funnel Stage Cards */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Overall Visibility Score - LEFT SIDE (1 column) */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-indigo-200 flex flex-col justify-center">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 text-center">Overall AI Visibility</h2>
            <div className={`text-6xl font-bold text-center mb-2 ${
              (reportData.overallScore || 0) >= 70 ? 'text-green-600' :
              (reportData.overallScore || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {reportData.overallScore || 0}%
            </div>
            <p className="text-xs text-gray-500 text-center">
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
        {/* METHODOLOGY & TECHNICAL AUDIT */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Technical Audit - Collapsible */}
          <div
            onClick={() => toggleSection("technical")}
            className={`bg-white rounded-2xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              expandedSection === "technical" ? "ring-2 ring-cyan-500" : ""
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">🔧</div>
                <h3 className="text-lg font-bold text-gray-900">Technical Audit</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">Website optimization for AI crawlers</p>
              <div className="flex items-center justify-between">
                <div className={`text-3xl font-bold ${
                  (reportData.websiteAudit?.technicalScore || 0) >= 70 ? "text-green-600" :
                  (reportData.websiteAudit?.technicalScore || 0) >= 40 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {reportData.websiteAudit?.technicalScore || "N/A"}<span className="text-base text-gray-400">{reportData.websiteAudit ? "/100" : ""}</span>
                </div>
                <span className="flex items-center gap-1 text-cyan-600 font-medium text-sm">
                  {expandedSection === "technical" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  <span className="ml-1">{expandedSection === "technical" ? "Hide" : "View"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Methodology - Collapsible */}
          <div
            onClick={() => toggleSection("methodology")}
            className={`bg-white rounded-2xl shadow-lg cursor-pointer transition-all hover:shadow-xl ${
              expandedSection === "methodology" ? "ring-2 ring-teal-500" : ""
            }`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">❓</div>
                <h3 className="text-lg font-bold text-gray-900">Methodology</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3">How we calculate your scores</p>
              <div className="flex items-center justify-end">
                <span className="flex items-center gap-1 text-teal-600 font-medium text-sm">
                  {expandedSection === "methodology" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  <span className="ml-1">{expandedSection === "methodology" ? "Hide" : "View"}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* JOURNEY STAGES DETAILED VIEW - PROGRESSIVE DISCLOSURE */}
        {/* Only shows when a stage card is clicked */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          {/* Journey Stages Detailed View - PROGRESSIVE DISCLOSURE */}
          <div className="space-y-8">
            {journeyStages.length === 0 && (
              <p className="text-gray-500 text-center py-8">No journey stage data available</p>
            )}
            {journeyStages.map((stage: any, index: number) => {
              // Only show detailed view if this stage is expanded
              if (expandedSection !== stage?.stage) return null;

              // Get recommendation for this stage
              const stageRec = allRecommendations.find((r: any) => r.stage === stage?.stageLabel);

              console.log(`[Recommendations Debug] Stage: ${stage?.stage}, Label: ${stage?.stageLabel}`);
              console.log(`[Recommendations Debug] stageRec found:`, stageRec ? 'YES' : 'NO');
              console.log(`[Recommendations Debug] Has recommendation:`, stageRec?.recommendation ? 'YES' : 'NO');

              return (
                <div key={stage?.stage || index} className="border border-gray-200 bg-white rounded-xl p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅"}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{stage?.stageLabel || "Unknown Stage"}</h3>
                        <p className="text-sm text-gray-500">{stage?.stageDescription || ""}</p>
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
                        <div className="text-xs text-gray-600">Visibility</div>
                      </div>

                      {/* How is it calculated button - RIGHT NEXT TO SCORE */}
                      <button
                        onClick={() => setExpandedSchemas(prev =>
                          prev.includes(`scoring-${stage?.stage}`)
                            ? prev.filter(s => s !== `scoring-${stage?.stage}`)
                            : [...prev, `scoring-${stage?.stage}`]
                        )}
                        className="text-xs px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        📊 How calculated?
                      </button>
                    </div>
                  </div>

                  {/* Visibility Score Breakdown - SHOWS WHEN BUTTON CLICKED */}
                  {expandedSchemas.includes(`scoring-${stage?.stage}`) && (
                    <div className="mb-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                      <div className="space-y-3 text-sm">
                        <div className="bg-white rounded-lg p-3">
                          <p className="font-medium text-gray-900 mb-2">Visibility Score Formula:</p>
                          <div className="bg-purple-50 rounded p-2 font-mono text-xs mb-2">
                            Visibility = (Mention Rate × 50%) + (Position Score × 30%) + (Sentiment Score × 20%)
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mention Rate (50% weight):</span>
                              <span className="font-bold">{Math.round(stage?.portrayal?.mentionRate || 0)}% × 0.5 = {Math.round((stage?.portrayal?.mentionRate || 0) * 0.5)}pts</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Position Score (30% weight):</span>
                              <span className="font-bold">{Math.round(stage?.portrayal?.positionScore || 50)}% × 0.3 = {Math.round((stage?.portrayal?.positionScore || 50) * 0.3)}pts</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sentiment Score (20% weight):</span>
                              <span className="font-bold">{Math.round(stage?.portrayal?.sentimentScore || 50)}% × 0.2 = {Math.round((stage?.portrayal?.sentimentScore || 50) * 0.2)}pts</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                              <span className="text-purple-900">Total Visibility:</span>
                              <span className="text-purple-600">{Math.round(stage?.portrayal?.visibilityScore || 0)}%</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 italic">
                          💡 This formula weights brand mentions most heavily (50%), followed by position in responses (30%), and sentiment (20%).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Questions Analyzed for this Stage */}
                  {stage?.questions && stage.questions.length > 0 && (
                    <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-3">❓ Questions Analyzed ({stage.questions.length})</h4>
                      <div className="space-y-2">
                        {stage.questions.map((q: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600 font-bold flex-shrink-0">{idx + 1}.</span>
                            <span className="text-gray-700">{q.question || q}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 mt-3 italic">
                        💡 These questions represent typical {stage?.stageLabel || 'customer'} queries that AI platforms answer.
                      </p>
                    </div>
                  )}

                  {/* Stage Metrics - 3 Main Cards */}
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {/* Card 1: Mention Rate */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">📢 Mention Rate</h4>
                      <div className="text-center">
                        <div className={`text-5xl font-bold mb-2 ${
                          (stage?.portrayal?.mentionRate || 0) >= 70 ? 'text-green-600' :
                          (stage?.portrayal?.mentionRate || 0) >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {Math.round(stage?.portrayal?.mentionRate || 0)}%
                        </div>
                        <p className="text-sm text-gray-600">
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
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">📊 Position</h4>
                      {(() => {
                        const stageResponses = reportData.aiTestResults?.filter((r: any) => {
                          const questionObj = reportData.discoveredQuestions?.find((q: any) => q.question === r.question);
                          return (questionObj?.category === stage?.stage || questionObj?.stage === stage?.stage) && r.brandMentioned && r.position;
                        }) || [];

                        if (stageResponses.length === 0) {
                          return (
                            <div className="text-center py-6 text-gray-500">
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
                                  item.position === 2 ? 'text-blue-700' :
                                  item.position === 3 ? 'text-amber-700' :
                                  'text-gray-600'
                                }`}>
                                  {item.position === 1 ? '🥇 1st' :
                                   item.position === 2 ? '🥈 2nd' :
                                   item.position === 3 ? '🥉 3rd' :
                                   `#${item.position}`}
                                </span>
                                <div className="flex-1">
                                  <div className="bg-gray-200 rounded-full h-5 overflow-hidden">
                                    <div
                                      className={`h-5 rounded-full flex items-center justify-end pr-2 ${
                                        item.position === 1 ? 'bg-green-500' :
                                        item.position === 2 ? 'bg-blue-500' :
                                        item.position === 3 ? 'bg-amber-500' :
                                        'bg-gray-400'
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
                                  <span className="text-xs font-bold text-gray-600 w-10 text-right">
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
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3">💭 Tone</h4>
                      <div className="text-center mb-3">
                        <span className={`inline-block text-lg font-bold px-4 py-2 rounded-lg ${
                          stage?.portrayal?.sentiment?.dominant === "positive" ? "bg-green-100 text-green-700" :
                          stage?.portrayal?.sentiment?.dominant === "negative" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {stage?.portrayal?.sentiment?.dominant || "neutral"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">😊 Positive</span>
                          <span className="font-bold text-green-700">{Math.round(stage?.portrayal?.sentiment?.positive || 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">😐 Neutral</span>
                          <span className="font-bold text-gray-700">{Math.round(stage?.portrayal?.sentiment?.neutral || 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">😞 Negative</span>
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
                  <div className="bg-white rounded-lg p-5 border border-gray-200 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">🤖 Platform-by-Platform Summary</h4>
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
                        className="text-xs px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors flex items-center gap-1"
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
                                className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                                      platform === 'chatgpt' ? 'bg-green-100 text-green-700' :
                                      platform === 'gemini' ? 'bg-blue-100 text-blue-700' :
                                      platform === 'perplexity' ? 'bg-purple-100 text-purple-700' :
                                      'bg-cyan-100 text-cyan-700'
                                    }`}>
                                      {platform.toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                {responses.length === 0 ? (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                                    <p className="text-sm text-gray-600">
                                      ℹ️ No {platform.toUpperCase()} responses available for this stage.
                                    </p>
                                  </div>
                                ) : brandMentions.length > 0 ? (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-gray-800 leading-relaxed">
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
                                        <div className="space-y-2 text-sm text-gray-700">
                                          {mentionedCompetitors.length > 0 && (
                                            <div className="bg-white rounded p-2 border border-orange-200">
                                              <span className="font-semibold text-orange-800">🎯 Competitors mentioned instead:</span>{' '}
                                              <span className="text-gray-800">{mentionedCompetitors.join(', ')}</span>
                                            </div>
                                          )}
                                          {snippet && (
                                            <div className="bg-white rounded p-2 border border-orange-200">
                                              <span className="font-semibold text-orange-800">📝 What they said:</span>{' '}
                                              <span className="text-gray-700 italic">"{snippet}..."</span>
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
                          stage?.stage === "awareness" ? 'bg-blue-100 hover:bg-blue-200 text-blue-900' :
                          stage?.stage === "consideration" ? 'bg-cyan-100 hover:bg-cyan-200 text-cyan-900' :
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
                              <div className="border-b border-gray-200 pb-4">
                                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <span>🔍</span> Key Pattern Detected
                                </h5>
                                <p className="text-sm text-gray-700 mb-3">{stage.recommendation.commonPattern}</p>
                              </div>
                            )}

                            {/* Content Type Recommendation */}
                            {stage.recommendation.contentType && (
                              <div className="border-b border-gray-200 pb-4">
                                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <span>📝</span> Recommended Content Type
                                </h5>
                                <p className="text-sm text-gray-700 mb-3">{stage.recommendation.contentType}</p>
                              </div>
                            )}

                            {/* Focused Action */}
                            {stage.recommendation.focusedAction && (
                              <div>
                                <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <span>🎯</span> Priority Action
                                </h5>
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
                                  <p className="text-sm text-gray-900 font-medium">{stage.recommendation.focusedAction}</p>
                                </div>
                              </div>
                            )}

                            {/* If insights array exists (for future compatibility) */}
                            {stage.recommendation.insights && stage.recommendation.insights.length > 0 && (
                              <div className="space-y-4 mt-4">
                                {stage.recommendation.insights.map((insight: any, idx: number) => (
                                  <div key={idx} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                                    <h5 className="font-semibold text-gray-900 mb-2">{insight.insight || insight.title || `Insight ${idx + 1}`}</h5>
                                    <p className="text-sm text-gray-700 mb-3">{insight.explanation || insight.description || ''}</p>
                                    {insight.actions && insight.actions.length > 0 && (
                                      <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-600 uppercase">Action Items:</p>
                                        {insight.actions.map((action: string, aIdx: number) => (
                                          <div key={aIdx} className="flex items-start gap-2 text-sm text-gray-700">
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

                            {/* Fallback if no recommendation data */}
                            {!stage.recommendation.commonPattern && !stage.recommendation.contentType && !stage.recommendation.focusedAction && (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">No recommendations available for this stage yet.</p>
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
        <div className="bg-white rounded-2xl shadow-lg mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">All AI Responses</h2>
                  <p className="text-sm text-gray-500">Full answers from each AI platform per question</p>
                </div>
              </div>
              {(tier === 'partner' || tier === 'professional') ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportPDF()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                        stageColor === 'blue' ? 'bg-blue-50 hover:bg-blue-100' :
                        stageColor === 'yellow' ? 'bg-yellow-50 hover:bg-yellow-100' :
                        'bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{stageIcon}</span>
                        <span className="font-semibold text-gray-900 capitalize">{stageName} Stage</span>
                        <span className="text-sm text-gray-500">({totalAnswers} answers from {questionCount} questions)</span>
                      </div>
                      {expandedSchemas.includes(`answers-${stageName}`) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    {/* Expanded answers */}
                    {expandedSchemas.includes(`answers-${stageName}`) && (
                      <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-200">
                        {Object.entries(answersByQuestion).length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p>No AI responses recorded for this stage yet.</p>
                            <p className="text-sm mt-2">Run an analysis to see AI responses here.</p>
                          </div>
                        ) : Object.entries(answersByQuestion).map(([question, answers]) => (
                          <div key={question} className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-medium text-gray-900 mb-3">{question}</h4>
                            <div className="space-y-3">
                              {/* Show one answer per platform in UI */}
                              {['ChatGPT', 'Gemini', 'Perplexity'].map(platform => {
                                const platformAnswer = answers.find((a: any) => a.platform === platform);
                                if (!platformAnswer) return null;
                                
                                return (
                                  <div key={platform} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-700">{platform}</span>
                                      <div className="flex items-center gap-2">
                                        {platformAnswer.brandMentioned && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Mentioned</span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          platformAnswer.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                          platformAnswer.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {platformAnswer.sentiment}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                                      <ReactMarkdown>
                                        {platformAnswer.fullResponse || platformAnswer.context || 'No response recorded'}
                                      </ReactMarkdown>
                                    </div>
                                    {/* Show citations if available */}
                                    {((platformAnswer.citations && platformAnswer.citations.length > 0) || 
                                      (platformAnswer.sources && platformAnswer.sources.length > 0)) && (
                                      <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-medium text-gray-500">🔗 Sources Cited:</span>
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
                                                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
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
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                  <p className="font-medium">No AI responses recorded yet</p>
                  <p className="text-sm mt-2">Run an analysis to see AI responses from ChatGPT, Gemini, Copilot, and Perplexity.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="bg-gray-50 rounded-2xl p-8">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Answers Available in Partner/Professional Tier</h3>
                <p className="text-gray-500 mb-4">
                  Upgrade to see all {reportData.aiTestResults?.length || 0} AI responses across all platforms and export them as PDF.
                </p>
                <button
                  onClick={() => openUpgradeModal("funnel_stages")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:opacity-90 transition-opacity"
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
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">📊 AI Visibility by Funnel Stage</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            {/* Scoring Methodology */}
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">How We Calculate Your Score</h4>
              
              {/* Overall Stage Weights */}
              <div className="mb-4 p-3 bg-white/50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Stage Weights (Overall Score)</p>
                <div className="flex gap-4 text-sm">
                  <span className="bg-blue-100 px-2 py-1 rounded">🔍 Awareness: <strong>20%</strong></span>
                  <span className="bg-yellow-100 px-2 py-1 rounded">⚖️ Consideration: <strong>35%</strong></span>
                  <span className="bg-green-100 px-2 py-1 rounded">✅ Decision: <strong>45%</strong></span>
                </div>
              </div>

              {/* Awareness Stage - Citation Based */}
              <div className="mb-4 p-3 bg-blue-100/50 rounded-lg border-l-4 border-blue-400">
                <p className="text-sm text-blue-800 font-medium mb-2">🔍 Awareness Stage (Citation-Based)</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-bold text-blue-700">60%</span> Citation Rate
                    <p className="text-blue-600 text-xs">Is your content cited as a source?</p>
                  </div>
                  <div>
                    <span className="font-bold text-blue-700">25%</span> Mention Rate
                    <p className="text-blue-600 text-xs">Is your brand mentioned?</p>
                  </div>
                  <div>
                    <span className="font-bold text-blue-700">15%</span> Sentiment
                    <p className="text-blue-600 text-xs">How positively portrayed?</p>
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
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                      blue: "border-blue-200 bg-blue-50",
                      cyan: "border-cyan-200 bg-cyan-50",
                      purple: "border-purple-200 bg-purple-50",
                    };
                    return (
                      <div key={platform.name} className={`rounded-xl p-4 border-2 ${hasNoData ? 'border-gray-200 bg-gray-50' : colorClasses[platform.color as keyof typeof colorClasses]} relative`}>
                        {/* Warning badge if no data */}
                        {hasNoData && (
                          <div className="absolute -top-2 -right-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                            No data
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{platform.icon}</span>
                          <div>
                            <span className="font-semibold text-gray-900">{platform.name}</span>
                            <span className="text-xs text-gray-400 ml-1">({data.totalTests} tests)</span>
                          </div>
                        </div>
                        {hasNoData ? (
                          <div className="text-center py-2">
                            <p className="text-xs text-gray-500">
                              No responses received.
                              {platform.name === "Gemini" && " (Check GEMINI_API_KEY)"}
                              {platform.name === "Perplexity" && " (PERPLEXITY_API_KEY not configured)"}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Mention Rate</span>
                              <span className={`font-bold ${data.mentionRate >= 50 ? "text-green-600" : data.mentionRate >= 25 ? "text-yellow-600" : "text-red-600"}`}>
                                {Math.round(data.mentionRate)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${data.mentionRate >= 50 ? "bg-green-500" : data.mentionRate >= 25 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, data.mentionRate)}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Mentioned</span>
                              <span className="font-semibold text-gray-700">
                                {data.mentions || 0} / {data.totalTests}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Avg Position</span>
                              <span className="font-semibold text-gray-700">
                                {data.avgPosition > 0 ? `#${data.avgPosition.toFixed(1)}` : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500">Visibility Share</span>
                              <span className="font-semibold text-gray-700">{Math.round(data.visibilityShare)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Overall Platform Summary */}
                <div className="mt-4 bg-gray-50 rounded-xl p-4">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.round(
                          Object.values(reportData.platformBreakdown || {}).reduce((sum: number, p: any) => sum + (p.mentionRate || 0), 0) / 
                          Math.max(Object.keys(reportData.platformBreakdown || {}).length, 1)
                        )}%
                      </div>
                      <div className="text-sm text-gray-500">Avg Mention Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        #{(
                          Object.values(reportData.platformBreakdown || {}).reduce((sum: number, p: any) => sum + (p.avgPosition || 0), 0) / 
                          Math.max(Object.values(reportData.platformBreakdown || {}).filter((p: any) => p.avgPosition > 0).length, 1)
                        ).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">Avg Position</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {Object.values(reportData.platformBreakdown || {}).reduce((sum: number, p: any) => sum + (p.totalTests || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total AI Responses</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Journey Stages */}
            <div className="space-y-8">
              {journeyStages.length === 0 && (
                <p className="text-gray-500 text-center py-8">No journey stage data available</p>
              )}
              {journeyStages.map((stage: any, index: number) => (
                <div key={stage?.stage || index} className={`border-2 rounded-xl p-8 ${
                  stage?.stage === "awareness" ? "border-blue-200 bg-blue-50/30" :
                  stage?.stage === "consideration" ? "border-cyan-200 bg-cyan-50/30" : "border-green-200 bg-green-50/30"
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅"}
                      </span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{stage?.stageLabel || "Unknown Stage"}</h3>
                        <p className="text-sm text-gray-500">{stage?.stageDescription || ""}</p>
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
                      <div className="text-xs text-gray-600">Visibility</div>
                    </div>
                  </div>

                  {/* Questions Analyzed Section */}
                  {stage?.questions && stage.questions.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>❓</span> Questions Analyzed ({stage.questions.length})
                      </h4>
                      <div className="bg-white rounded-lg p-4 space-y-2">
                        {stage.questions.slice(0, 6).map((q: any, qIdx: number) => (
                          <div key={qIdx} className="flex items-start gap-2 text-sm">
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-0.5 ${
                              stage?.stage === "awareness" ? "bg-blue-100 text-blue-700" :
                              stage?.stage === "consideration" ? "bg-cyan-100 text-cyan-700" : "bg-green-100 text-green-700"
                            }`}>Q{qIdx + 1}</span>
                            <span className="text-gray-700">{typeof q === 'string' ? q : q.question || q.text || 'Question'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stage Metrics with Explanations */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* For Awareness Stage: Citation-focused metrics */}
                    {stage?.stage === 'awareness' ? (
                      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-blue-900">📚 Content Citation Analysis</h4>
                          <span className={`text-2xl font-bold ${
                            (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 50 ? "text-green-600" :
                            (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 25 ? "text-yellow-600" : "text-red-600"
                          }`}>{Math.round(stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0)}%</span>
                        </div>
                        <div className="bg-blue-100 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-blue-900 mb-1">Is your brand/content used as a source?</p>
                          <p className="text-xs text-blue-700">
                            When users ask AI for awareness-level information, does the AI cite your content, website, or brand as an authoritative source?
                          </p>
                        </div>
                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-700">Citation Rate (60% weight)</span>
                            <span className="font-bold text-blue-800">{Math.round(stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0)}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 50 ? "bg-green-500" :
                                (stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0) >= 25 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${stage?.portrayal?.citationRate || stage?.portrayal?.mentionRate || 0}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-700">Mention Rate (25% weight)</span>
                            <span className="font-bold text-blue-800">{Math.round(stage?.portrayal?.mentionRate || 0)}%</span>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-blue-500`}
                              style={{ width: `${stage?.portrayal?.mentionRate || 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-white/60 rounded p-2">
                          <p className="text-xs text-blue-700">
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
                          <h4 className="font-semibold text-gray-900">📢 Mention Rate</h4>
                          <span className={`text-2xl font-bold ${
                            (stage?.portrayal?.mentionRate || 0) >= 70 ? "text-green-600" :
                            (stage?.portrayal?.mentionRate || 0) >= 40 ? "text-yellow-600" : "text-red-600"
                          }`}>{Math.round(stage?.portrayal?.mentionRate || 0)}%</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Out of {stage?.portrayal?.totalTests || 0} tests across all AI platforms, your brand was mentioned in {Math.round((stage?.portrayal?.mentionRate || 0) * (stage?.portrayal?.totalTests || 0) / 100)} responses.
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (stage?.portrayal?.mentionRate || 0) >= 70 ? "bg-green-500" :
                              (stage?.portrayal?.mentionRate || 0) >= 40 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${stage?.portrayal?.mentionRate || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {(stage?.portrayal?.mentionRate || 0) >= 70 ? "✅ Strong presence - AI consistently mentions your brand" :
                           (stage?.portrayal?.mentionRate || 0) >= 40 ? "⚠️ Moderate presence - Room for improvement" : "❌ Low presence - Significant opportunity to improve"}
                        </p>
                      </div>
                    )}

                    {/* Audience Sentiment Explained */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">💭 Audience Sentiment</h4>
                        <span className={`text-sm font-bold px-2 py-1 rounded ${
                          stage?.portrayal?.sentiment?.dominant === "positive" ? "bg-green-100 text-green-700" :
                          stage?.portrayal?.sentiment?.dominant === "negative" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}>{stage?.portrayal?.sentiment?.dominant || "Neutral"}</span>
                      </div>
                      <div className="space-y-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16">Positive</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-green-500" style={{ width: `${stage?.portrayal?.sentiment?.positive || 0}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{Math.round(stage?.portrayal?.sentiment?.positive || 0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16">Neutral</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-gray-400" style={{ width: `${stage?.portrayal?.sentiment?.neutral || 0}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{Math.round(stage?.portrayal?.sentiment?.neutral || 0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-16">Negative</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-red-500" style={{ width: `${stage?.portrayal?.sentiment?.negative || 0}%` }} />
                          </div>
                          <span className="text-xs w-10 text-right">{Math.round(stage?.portrayal?.sentiment?.negative || 0)}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
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
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span>🔗</span> Sources Cited by AI Platforms
                        </h4>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          {/* Brand Citations */}
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-lg ${brandCitations.length > 0 ? '✅' : '⚠️'}`}>
                                {brandCitations.length > 0 ? '✅' : '⚠️'}
                              </span>
                              <span className="font-medium text-blue-900">
                                Your Content as Source: {brandCitations.length > 0 ? `Cited ${brandCitations.length} time(s)` : 'Not cited'}
                              </span>
                            </div>
                            {brandCitations.length > 0 ? (
                              <div className="space-y-2 ml-7">
                                {brandCitations.map((citation, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      citation.platform === 'ChatGPT' ? 'bg-green-100 text-green-700' :
                                      citation.platform === 'Gemini' ? 'bg-blue-100 text-blue-700' :
                                      citation.platform === 'Perplexity' ? 'bg-purple-100 text-purple-700' :
                                      'bg-cyan-100 text-cyan-700'
                                    }`}>{citation.platform}</span>
                                    <a href={citation.url} target="_blank" rel="noopener noreferrer" 
                                       className="text-blue-600 hover:underline truncate max-w-md">
                                      {citation.title || citation.domain}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-blue-700 ml-7">
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
                                <span className="font-medium text-gray-700">
                                  Other Sources Cited ({otherCitations.length})
                                </span>
                              </div>
                              <div className="space-y-2 ml-7 max-h-48 overflow-y-auto">
                                {otherCitations.slice(0, 10).map((citation, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      citation.platform === 'ChatGPT' ? 'bg-green-100 text-green-700' :
                                      citation.platform === 'Gemini' ? 'bg-blue-100 text-blue-700' :
                                      citation.platform === 'Perplexity' ? 'bg-purple-100 text-purple-700' :
                                      'bg-cyan-100 text-cyan-700'
                                    }`}>{citation.platform}</span>
                                    <span className="text-gray-600">{citation.domain}</span>
                                    {citation.title && (
                                      <span className="text-gray-400 truncate max-w-xs">- {citation.title}</span>
                                    )}
                                  </div>
                                ))}
                                {otherCitations.length > 10 && (
                                  <p className="text-xs text-gray-500">+{otherCitations.length - 10} more sources</p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {allCitations.length === 0 && (
                            <div className="text-center py-4">
                              <p className="text-sm text-gray-600">
                                No source citations detected in AI responses for this stage.
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
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
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🏆</span> Competitor Mentions in This Stage
                      </h4>
                      <div className="bg-white rounded-lg p-4">
                        <div className="space-y-3">
                          {stage.portrayal.competitorComparison.map((comp: any, compIdx: number) => (
                            <div key={compIdx} className="flex items-center gap-3">
                              <span className="font-medium text-gray-900 w-32 truncate">{comp.competitorName || comp.competitor || comp.name || `Competitor ${compIdx + 1}`}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full ${compIdx === 0 ? "bg-pink-500" : "bg-gray-400"}`}
                                  style={{ width: `${comp.mentionRate || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-bold text-gray-700 w-12 text-right">{Math.round(comp.mentionRate || 0)}%</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
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
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-500'
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
                          <div className="mt-4 space-y-4 border-l-2 border-blue-200 pl-4">
                            {(() => {
                              // Group by question
                              const byQuestion: Record<string, any[]> = {};
                              stageAnswers.forEach((answer: any) => {
                                if (!byQuestion[answer.question]) byQuestion[answer.question] = [];
                                byQuestion[answer.question].push(answer);
                              });
                              
                              return Object.entries(byQuestion).map(([question, answers]) => (
                                <div key={question} className="bg-white rounded-xl p-4 shadow-sm">
                                  <h5 className="font-medium text-gray-900 mb-3">{question}</h5>
                                  <div className="space-y-3">
                                    {['ChatGPT', 'Gemini', 'Perplexity'].map(platform => {
                                      const platformAnswer = answers.find((a: any) => a.platform === platform);
                                      if (!platformAnswer) return null;
                                      
                                      return (
                                        <div key={platform} className="bg-gray-50 rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                                              platform === "ChatGPT" ? "bg-green-100 text-green-700" :
                                              platform === "Gemini" ? "bg-blue-100 text-blue-700" :
                                              platform === "Perplexity" ? "bg-purple-100 text-purple-700" : 
                                              "bg-cyan-100 text-cyan-700"
                                            }`}>{platform}</span>
                                            <div className="flex items-center gap-2">
                                              {platformAnswer.brandMentioned && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ Mentioned</span>
                                              )}
                                              <span className={`text-xs px-2 py-0.5 rounded ${
                                                platformAnswer.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                                platformAnswer.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-200 text-gray-600'
                                              }`}>{platformAnswer.sentiment}</span>
                                            </div>
                                          </div>
                                          <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                                            <ReactMarkdown>
                                              {platformAnswer.fullResponse || platformAnswer.context || 'No response'}
                                            </ReactMarkdown>
                                          </div>
                                          {/* Show citations if available */}
                                          {((platformAnswer.citations && platformAnswer.citations.length > 0) || 
                                            (platformAnswer.sources && platformAnswer.sources.length > 0)) && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                              <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-gray-500">🔗 Sources Cited:</span>
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
                                                      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
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
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🔧 Website Technical Audit</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* SECTION 1: STATUS QUO - What We Found */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                <h3 className="text-xl font-bold text-gray-900">Status Quo: What We Analyzed</h3>
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
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-blue-700">{pages.length}</div>
                        <div className="text-sm text-blue-600 font-medium">Pages Crawled</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-purple-700">{productPages.length}</div>
                        <div className="text-sm text-purple-600 font-medium">Product Pages</div>
                      </div>
                      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-cyan-700">{faqPages.length}</div>
                        <div className="text-sm text-cyan-600 font-medium">FAQ Pages</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-green-700">{pagesWithSchema.length}</div>
                        <div className="text-sm text-green-600 font-medium">With Schema</div>
                      </div>
                    </div>

                    {/* URLs Analyzed */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-semibold text-gray-900">🕷️ URLs Analyzed</span>
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
                                hasSchema ? 'bg-green-500' : 'bg-gray-300'
                              }`} />
                              <span className="text-gray-700 truncate flex-1" title={page.url}>
                                {path}
                              </span>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isProduct && (
                                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">Product</span>
                                )}
                                {isFaq && (
                                  <span className="text-xs bg-cyan-100 text-cyan-600 px-2 py-0.5 rounded">FAQ</span>
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
                          <span className="font-semibold text-gray-900">Sitemap</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {reportData.websiteAudit.sitemapFound ? 'Found and accessible' : 'Not found or inaccessible'}
                        </p>
                      </div>
                      <div className={`rounded-xl p-4 border-2 ${
                        reportData.websiteAudit.robotsAllowsAI !== false ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{reportData.websiteAudit.robotsAllowsAI !== false ? '✅' : '❌'}</span>
                          <span className="font-semibold text-gray-900">AI Bots</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {reportData.websiteAudit.robotsAllowsAI !== false ? 'Allowed to crawl' : 'Blocked in robots.txt'}
                        </p>
                      </div>
                      <div className={`rounded-xl p-4 border-2 ${
                        reportData.websiteAudit.faqContent?.hasFAQSection ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{reportData.websiteAudit.faqContent?.hasFAQSection ? '✅' : '⚠️'}</span>
                          <span className="font-semibold text-gray-900">FAQ Content</span>
                        </div>
                        <p className="text-xs text-gray-600">
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
                <h3 className="text-xl font-bold text-gray-900">Challenges: Schema Gaps Identified</h3>
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
                    <div className="font-semibold text-gray-900">{schema.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{schema.impact}</div>
                  </div>
                ))}
              </div>

              {/* Transparency - Why we reached these conclusions */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">🔍</span>
                  <span className="font-semibold text-gray-900">Our Analysis Explained</span>
                </div>
                <div className="space-y-3">
                  {reportData.websiteAudit.robotsAnalysisReason && (
                    <div className="bg-white rounded-lg p-3 border-l-4 border-blue-400">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">🤖 robots.txt</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          reportData.websiteAudit.robotsAllowsAI !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {reportData.websiteAudit.robotsAllowsAI !== false ? 'OK' : 'Blocked'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{reportData.websiteAudit.robotsAnalysisReason}</p>
                    </div>
                  )}
                  {reportData.websiteAudit.sitemapAnalysisReason && (
                    <div className="bg-white rounded-lg p-3 border-l-4 border-cyan-400">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">🗺️ Sitemap</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          reportData.websiteAudit.sitemapFound ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {reportData.websiteAudit.sitemapFound ? 'Found' : 'Missing'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{reportData.websiteAudit.sitemapAnalysisReason}</p>
                    </div>
                  )}
                  {reportData.websiteAudit.productSchemaReason && (
                    <div className="bg-white rounded-lg p-3 border-l-4 border-purple-400">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">🛍️ Product Schema</span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          reportData.websiteAudit.schemas?.hasProduct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {reportData.websiteAudit.schemas?.hasProduct ? 'Found' : 'Missing'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{reportData.websiteAudit.productSchemaReason}</p>
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
                  <h3 className="text-xl font-bold text-gray-900">Actions: Schema Markup to Add</h3>
                </div>

                <p className="text-gray-600 mb-4 text-sm">
                  Click each schema type below to see the exact code to add. Place these in your HTML <code className="bg-gray-100 px-1 rounded text-xs">&lt;head&gt;</code> section.
                </p>
                
                <div className="space-y-3">
                  {/* Organization Schema - Expandable */}
                  {!reportData.websiteAudit.schemas?.hasOrganization && (
                    <div className="border border-blue-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSchemas(prev => 
                          prev.includes('organization') 
                            ? prev.filter(s => s !== 'organization')
                            : [...prev, 'organization']
                        )}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🏢</span>
                          <div className="text-left">
                            <span className="font-bold text-gray-900">Organization Schema</span>
                            <p className="text-xs text-gray-600">Helps AI identify your brand • Add to homepage</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedSchemas.includes('organization') ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSchemas.includes('organization') && (
                        <div className="p-4 bg-white border-t border-blue-100">
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Why it matters:</strong> Helps AI understand your brand identity, making it more likely to mention your company correctly in responses.
                          </p>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
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
                    <div className="border border-purple-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSchemas(prev => 
                          prev.includes('product') 
                            ? prev.filter(s => s !== 'product')
                            : [...prev, 'product']
                        )}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🛍️</span>
                          <div className="text-left">
                            <span className="font-bold text-gray-900">Product Schema</span>
                            <p className="text-xs text-gray-600">Required for AI shopping recommendations • Add to each product page</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedSchemas.includes('product') ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSchemas.includes('product') && (
                        <div className="p-4 bg-white border-t border-purple-100">
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Why it matters:</strong> When users ask AI "What's the best [product]?", AI platforms look for Product schema. Without it, your products won't appear in recommendations.
                          </p>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
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
                    <div className="border border-cyan-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedSchemas(prev => 
                          prev.includes('faq') 
                            ? prev.filter(s => s !== 'faq')
                            : [...prev, 'faq']
                        )}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-teal-50 hover:from-cyan-100 hover:to-teal-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">❓</span>
                          <div className="text-left">
                            <span className="font-bold text-gray-900">FAQ Schema</span>
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Highest Impact!</span>
                            <p className="text-xs text-gray-600">3x more likely to be cited by AI • Add to FAQ & landing pages</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                          expandedSchemas.includes('faq') ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedSchemas.includes('faq') && (
                        <div className="p-4 bg-white border-t border-cyan-100">
                          <p className="text-sm text-gray-600 mb-3">
                            <strong>Why it matters:</strong> AI platforms directly cite FAQ schema content. Pages with FAQ schema are <strong>3x more likely</strong> to be referenced in AI responses.
                          </p>
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
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
                     className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors">
                    🔗 Validate Schema
                  </a>
                  <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full transition-colors">
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
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Additional Issues</h3>
                <div className="space-y-2">
                  {reportData.websiteAudit.issues.map((issue: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border-l-4 ${
                      issue.severity === "critical" ? "bg-red-50 border-red-500" :
                      issue.severity === "warning" ? "bg-yellow-50 border-yellow-500" : "bg-blue-50 border-blue-500"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          issue.severity === "critical" ? "bg-red-200 text-red-800" :
                          issue.severity === "warning" ? "bg-yellow-200 text-yellow-800" : "bg-blue-200 text-blue-800"
                        }`}>
                          {issue.severity?.toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">{issue.issue}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 ml-16">{issue.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Expanded Section: Recommendations */}
        {expandedSection === "recommendations" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">💡 All Recommendations</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Based on your AI visibility analysis, here are personalized recommendations for each stage of the customer journey.
            </p>

            <div className="space-y-6">
              {allRecommendations.map((rec: any, i: number) => {
                const isLocked = !limits.showDetailedRecommendations && i > 0;
                
                return (
                  <div key={i} className={`rounded-xl p-8 border-2 relative ${
                    rec.stage === "Awareness" ? "bg-blue-50 border-blue-200" :
                    rec.stage === "Consideration" ? "bg-cyan-50 border-cyan-200" : "bg-green-50 border-green-200"
                  } ${isLocked ? "opacity-60" : ""}`}>
                    {/* Lock overlay for additional recommendations on free tier */}
                    {isLocked && (
                      <div 
                        className="absolute inset-0 bg-white/70 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => openUpgradeModal("recommendations")}
                      >
                        <Lock className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600">Unlock Full Recommendations</span>
                        <span className="text-xs text-amber-500 mt-1">Click to upgrade</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{rec.stageIcon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{rec.stage} Stage</h3>
                        <div className="text-sm text-gray-500">Current visibility: {Math.round(rec.visibilityScore)}%</div>
                      </div>
                    </div>

                    {rec.recommendation && (
                      <div className="space-y-4">
                        {/* Pattern Identified */}
                        {rec.recommendation.commonPattern && (
                          <div className="bg-white rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🔍</span>
                              <span className="font-semibold text-gray-900">Pattern Identified</span>
                            </div>
                            <p className="text-gray-600">{rec.recommendation.commonPattern}</p>
                          </div>
                        )}

                        {/* Content Type Needed */}
                        {rec.recommendation.contentType && (
                          <div className="bg-white rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">📚</span>
                              <span className="font-semibold text-gray-900">Content Type Needed</span>
                            </div>
                            <p className="text-gray-600">{rec.recommendation.contentType}</p>
                          </div>
                        )}

                        {/* Recommended Action */}
                        {rec.recommendation.focusedAction && (
                          <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">✅</span>
                              <span className="font-semibold text-gray-900">Recommended Action</span>
                            </div>
                            <p className="text-gray-700 font-medium">{rec.recommendation.focusedAction}</p>
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
              <div className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-8 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  🔒 {allRecommendations.length - 1} More Recommendations Available
                </h3>
                <p className="text-gray-600 mb-4">
                  Get detailed action items with implementation guides for all funnel stages.
                </p>
                <button
                  onClick={() => openUpgradeModal("recommendations")}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center gap-2 mx-auto"
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
                  <h3 className="text-xl font-bold text-gray-900">🔧 Technical Recommendations</h3>
                  {!limits.showDetailedRecommendations && (
                    <PremiumBadge size="md" />
                  )}
                </div>
                <div className="space-y-4">
                  {reportData.websiteAudit.recommendations.slice(0, limits.showDetailedRecommendations ? undefined : 1).map((rec: any, i: number) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{rec.title}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          rec.priority === "high" ? "bg-red-100 text-red-700" :
                          rec.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {rec.priority?.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                      {rec.expectedImpact && limits.showDetailedRecommendations && (
                        <p className="text-xs text-green-600">Expected impact: {rec.expectedImpact}</p>
                      )}
                    </div>
                  ))}
                  {!limits.showDetailedRecommendations && reportData.websiteAudit.recommendations.length > 1 && (
                    <div 
                      className="bg-gray-100 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                      onClick={() => openUpgradeModal("technical_audit")}
                    >
                      <Lock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
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

        {/* Expanded Section: Competitive Landscape */}
        {expandedSection === "competitive" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🏆 Competitive Landscape</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Compare your brand&apos;s AI visibility against competitors across all funnel stages.
            </p>

            {/* Overall Comparison */}
            <div className="bg-gradient-to-r from-cyan-50 to-slate-50 rounded-xl p-8 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Overall AI Visibility Comparison</h3>
              <div className="space-y-4">
                {/* Your Brand */}
                <div className="flex items-center gap-4">
                  <div className="w-32 font-bold text-pink-700 truncate">{reportData.brandOrKeyword || "Your Brand"}</div>
                  <div className="flex-1 bg-white rounded-full h-8 shadow-inner relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-end pr-3"
                      style={{ width: `${reportData.overallScore || 0}%` }}
                    >
                      <span className="text-white text-sm font-bold">{reportData.overallScore || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Competitors from journey stages */}
                {(() => {
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
                  
                  const competitorList = Array.from(allCompetitors.entries()).map(([name, data]: [string, any]) => ({
                    name,
                    avgVisibility: Math.round(data.total / data.count)
                  })).sort((a, b) => b.avgVisibility - a.avgVisibility).slice(0, 5);

                  if (competitorList.length === 0) {
                    return (
                      <div className="text-center py-4 text-gray-500">
                        <p>No competitor data available.</p>
                        <p className="text-sm">Add competitors when starting your analysis to see comparison data.</p>
                      </div>
                    );
                  }

                  return competitorList.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-32 font-medium text-gray-600 truncate">{comp.name}</div>
                      <div className="flex-1 bg-white rounded-full h-8 shadow-inner relative overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-end pr-3"
                          style={{ width: `${comp.avgVisibility}%` }}
                        >
                          <span className="text-white text-sm font-bold">{comp.avgVisibility}%</span>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Stage-by-Stage Comparison */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Stage-by-Stage Analysis</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {journeyStages.map((stage: any, stageIdx: number) => (
                  <div key={stageIdx} className={`rounded-xl p-5 ${
                    stage?.stage === "awareness" ? "bg-blue-50 border-2 border-blue-200" :
                    stage?.stage === "consideration" ? "bg-cyan-50 border-2 border-cyan-200" : "bg-green-50 border-2 border-green-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">
                        {stage?.stage === "awareness" ? "🔍" : stage?.stage === "consideration" ? "⚖️" : "✅"}
                      </span>
                      <h4 className="font-bold text-gray-900">{stage?.stageLabel || "Stage"}</h4>
                    </div>

                    <div className="space-y-3">
                      {/* Your brand in this stage */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className={`font-bold ${
                            stage?.stage === "awareness" ? "text-blue-700" :
                            stage?.stage === "consideration" ? "text-cyan-700" : "text-green-700"
                          }`}>{reportData.brandOrKeyword || "You"}</span>
                          <span className="font-bold">{Math.round(stage?.portrayal?.mentionRate || 0)}%</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stage?.stage === "awareness" ? "bg-blue-500" :
                              stage?.stage === "consideration" ? "bg-cyan-500" : "bg-green-500"
                            }`}
                            style={{ width: `${stage?.portrayal?.mentionRate || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Competitors in this stage */}
                      {stage?.portrayal?.competitorComparison?.slice(0, 3).map((comp: any, compIdx: number) => (
                        <div key={compIdx}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{comp.competitorName || comp.competitor || comp.name || `Competitor ${compIdx + 1}`}</span>
                            <span className="text-gray-600">{Math.round(comp.mentionRate || 0)}%</span>
                          </div>
                          <div className="w-full bg-white rounded-full h-2">
                            <div className="h-2 rounded-full bg-gray-400" style={{ width: `${comp.mentionRate || 0}%` }} />
                          </div>
                        </div>
                      ))}

                      {(!stage?.portrayal?.competitorComparison || stage.portrayal.competitorComparison.length === 0) && (
                        <p className="text-xs text-gray-500 italic">No competitor data for this stage</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Insights */}
            <div className="mt-8 bg-gray-50 rounded-xl p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Key Competitive Insights</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Your Strongest Stage</h4>
                  {(() => {
                    const sorted = [...journeyStages].sort((a: any, b: any) => 
                      (b?.portrayal?.mentionRate || 0) - (a?.portrayal?.mentionRate || 0)
                    );
                    const best = sorted[0];
                    return (
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-green-600">{best?.stageLabel || "N/A"}</span> with {Math.round(best?.portrayal?.mentionRate || 0)}% mention rate. 
                        Focus on maintaining this lead while improving weaker stages.
                      </p>
                    );
                  })()}
                </div>
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Biggest Opportunity</h4>
                  {(() => {
                    const sorted = [...journeyStages].sort((a: any, b: any) => 
                      (a?.portrayal?.mentionRate || 0) - (b?.portrayal?.mentionRate || 0)
                    );
                    const weakest = sorted[0];
                    return (
                      <p className="text-sm text-gray-600">
                        <span className="font-bold text-amber-600">{weakest?.stageLabel || "N/A"}</span> shows only {Math.round(weakest?.portrayal?.mentionRate || 0)}% visibility. 
                        Improving this stage could significantly boost your overall AI presence.
                      </p>
                    );
                  })()}
                </div>
              </div>
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
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">❓ How It Works - Methodology & Transparency</h2>
              <button onClick={() => setExpandedSection(null)} className="text-gray-400 hover:text-gray-600">
                <ChevronUp className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* How is the AI Visibility Score calculated? */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-500">📊</span> How is the AI Visibility Score calculated?
                </h3>
                <p className="text-gray-600 mb-3">
                  Your AI Visibility Score (0-100) is a weighted combination of three key metrics:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-700 mb-1">50%</div>
                    <div className="font-semibold text-gray-900">Mention Rate</div>
                    <p className="text-sm text-gray-600">How often AI platforms mention your brand when answering relevant questions.</p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-cyan-700 mb-1">30%</div>
                    <div className="font-semibold text-gray-900">Position</div>
                    <p className="text-sm text-gray-600">Where your brand appears in responses. Being mentioned first is better than being listed third.</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-700 mb-1">20%</div>
                    <div className="font-semibold text-gray-900">Sentiment</div>
                    <p className="text-sm text-gray-600">Whether AI speaks positively, neutrally, or negatively about your brand.</p>
                  </div>
                </div>
              </div>

              {/* What is the audit process? */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-cyan-500">🔬</span> What is the audit process?
                </h3>
                <p className="text-gray-600 mb-3">
                  Our analysis follows a rigorous, multi-step process:
                </p>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <span className="bg-cyan-100 text-cyan-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                    <div>
                      <span className="font-semibold text-gray-900">Question Discovery</span>
                      <p className="text-sm text-gray-600">We pull real questions from search data (DataForSEO) and generate strategic questions based on your industry.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-cyan-100 text-cyan-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                    <div>
                      <span className="font-semibold text-gray-900">Multi-Platform Testing</span>
                      <p className="text-sm text-gray-600">Each question is sent to all 4 AI platforms: ChatGPT (OpenAI), Google Gemini, Microsoft Copilot, and Perplexity. We run multiple tests per platform for statistical reliability.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-cyan-100 text-cyan-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                    <div>
                      <span className="font-semibold text-gray-900">Response Analysis</span>
                      <p className="text-sm text-gray-600">We analyze each response for brand mentions, positioning, sentiment, and competitor references using pattern matching and NLP.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="bg-cyan-100 text-cyan-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                    <div>
                      <span className="font-semibold text-gray-900">Technical Audit</span>
                      <p className="text-sm text-gray-600">If you provided a domain, we scan your website for schema markup, content structure, FAQ sections, and robots.txt settings that affect AI visibility.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How are recommendations generated? */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-amber-500">💡</span> How are recommendations generated?
                </h3>
                <p className="text-gray-600 mb-3">
                  Our recommendations are data-driven and specific to your results:
                </p>
                <ul className="space-y-2 text-gray-600">
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
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-green-500">✅</span> What makes this analysis reliable?
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-1">Real API Calls</div>
                    <p className="text-sm text-gray-600">We use actual ChatGPT (OpenAI) and Gemini (Google) APIs - not simulations or scraping. You see real AI responses.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-1">Statistical Significance</div>
                    <p className="text-sm text-gray-600">3 tests per question per platform reduces noise from AI variability. More tests = more reliable patterns.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-1">Full Funnel Coverage</div>
                    <p className="text-sm text-gray-600">Testing across Awareness, Consideration, and Decision stages gives a complete picture of the customer journey.</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-1">Transparent Methodology</div>
                    <p className="text-sm text-gray-600">You see the actual questions tested, the real AI responses, and exactly how scores are calculated.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agency CTA */}
        <AgencyCTA />
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
        stageData.stage === "consideration" ? "from-cyan-500 to-cyan-600" :
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
