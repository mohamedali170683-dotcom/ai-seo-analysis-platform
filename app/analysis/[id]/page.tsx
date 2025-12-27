"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { JourneyStageReport } from "@/components/journey-stage-report";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisResultsPage({ params }: PageProps) {
  const [id, setId] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    loadAnalysis();

    const interval = setInterval(() => {
      if (
        data?.analysis?.status &&
        !["completed", "failed"].includes(data.analysis.status)
      ) {
        loadAnalysis(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, data?.analysis?.status]);

  const loadAnalysis = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch(`/api/analysis/${id}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error loading analysis:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-500 dark:text-gray-400">Loading analysis...</div>
        </div>
      </div>
    );
  }

  if (!data || !data.analysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Analysis not found
          </h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700 dark:text-blue-300">
            Start My New Analysis
          </Link>
        </div>
      </div>
    );
  }

  const analysis = data.analysis;

  // In progress view
  if (analysis.status !== "completed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analyzing {analysis.brandOrKeyword}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                This usually takes 5-10 minutes. You can leave and come back!
              </p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="capitalize">{analysis.status}</span>
                <span>{analysis.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.progress}%` }}
                />
              </div>
            </div>

            {analysis.currentStep && (
              <div className="text-center text-sm text-gray-600 mb-6">
                {analysis.currentStep}
              </div>
            )}

            {refreshing && (
              <div className="mt-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Auto-refreshing...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Parse journey stage data from AI insights
  const journeyStages = analysis.journeyStages || [];
  const overallScore = analysis.stats?.visibilityScore ? Math.round(analysis.stats.visibilityScore) : 0;
  const platformBreakdown = analysis.stats?.platformBreakdown || {};
  const aiTestResults = analysis.aiTestResults || [];

  return (
    <JourneyStageReport
      analysisId={id}
      brandName={analysis.brandOrKeyword}
      domain={analysis.domain}
      overallScore={overallScore}
      totalTests={analysis.stats?.totalTests || 0}
      totalQuestions={analysis.stats?.totalQuestions || 0}
      platformBreakdown={platformBreakdown}
      journeyStages={journeyStages}
      aiTestResults={aiTestResults}
      showHeader={true}
      backLink="/"
    />
  );
}

