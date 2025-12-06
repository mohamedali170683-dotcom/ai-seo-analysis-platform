"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Trash2, XCircle } from "lucide-react";
import { JourneyStageReport } from "@/components/journey-stage-report";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AnalysisResultsPage({ params }: PageProps) {
  const router = useRouter();
  const [id, setId] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this analysis? This cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/analysis/${id}/delete`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to home page after successful deletion
        router.push("/");
      } else {
        alert(`Failed to delete analysis: ${result.error}`);
        setDeleting(false);
      }
    } catch (error: any) {
      console.error("Error deleting analysis:", error);
      alert(`Error: ${error.message}`);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-500">Loading analysis...</div>
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
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Start New Analysis
          </Link>
        </div>
      </div>
    );
  }

  const analysis = data.analysis;

  // In progress view
  if (analysis.status !== "completed") {
    const isFailed = analysis.status === "failed";
    const isStuck = analysis.status === "running" && analysis.progress <= 10;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              {isFailed ? (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              ) : (
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isFailed ? "Analysis Failed" : `Analyzing ${analysis.brandOrKeyword}`}
              </h1>
              <p className="text-gray-600">
                {isFailed
                  ? "Something went wrong during the analysis. Please try again."
                  : "This usually takes 5-10 minutes. You can leave and come back!"
                }
              </p>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="capitalize">{analysis.status}</span>
                <span>{analysis.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    isFailed
                      ? "bg-red-500"
                      : "bg-gradient-to-r from-blue-600 to-purple-600"
                  }`}
                  style={{ width: `${analysis.progress}%` }}
                />
              </div>
            </div>

            {analysis.currentStep && (
              <div className={`text-center text-sm mb-6 ${isFailed ? "text-red-600" : "text-gray-600"}`}>
                {analysis.currentStep}
              </div>
            )}

            {(isStuck || isFailed) && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {isStuck
                    ? "⚠️ Analysis appears stuck. This might be due to API issues. You can delete and try again."
                    : "❌ The analysis failed. Check the error message above for details."
                  }
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back to Home
              </Link>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Analysis
                  </>
                )}
              </button>
            </div>

            {refreshing && !isFailed && (
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

  return (
    <JourneyStageReport
      brandName={analysis.brandOrKeyword}
      domain={analysis.domain}
      overallScore={overallScore}
      totalTests={analysis.stats?.totalTests || 0}
      totalQuestions={analysis.stats?.totalQuestions || 0}
      journeyStages={journeyStages}
      showHeader={true}
      backLink="/"
    />
  );
}

