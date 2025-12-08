"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Loader, RefreshCw } from "lucide-react";

export default function ManageAnalysesPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analysis/list");
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error("Error loading analyses:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnalyses();
  }, []);

  const handleDelete = async (id: string, brandName: string) => {
    if (!confirm(`Delete analysis for "${brandName}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/analysis/${id}/delete`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        alert("Analysis deleted successfully!");
        await loadAnalyses();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
    setDeleting(null);
  };

  const handleCleanupAll = async () => {
    const failedCount = analyses.filter(a => a.status !== "completed").length;
    if (!confirm(`Delete all ${failedCount} failed/stuck analyses? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analysis/cleanup", {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        alert(`Successfully deleted ${result.deletedCount} analyses!`);
        await loadAnalyses();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Analyses</h1>
              <p className="text-gray-600 mt-2">Delete individual analyses or cleanup all failed/stuck ones</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadAnalyses}
                disabled={loading}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {analyses.filter(a => a.status !== "completed").length > 0 && (
                <button
                  onClick={handleCleanupAll}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Cleanup Failed ({analyses.filter(a => a.status !== "completed").length})
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-500 mt-4">Loading analyses...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No analyses found.</p>
              <Link href="/analysis/new" className="text-blue-600 hover:underline mt-2 inline-block">
                Create your first analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{analysis.brandOrKeyword}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          analysis.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : analysis.status === "running"
                            ? "bg-blue-100 text-blue-800"
                            : analysis.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {analysis.status}
                      </span>
                    </div>
                    {analysis.domain && (
                      <p className="text-sm text-gray-600 mt-1">{analysis.domain}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Created: {new Date(analysis.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-center px-3">
                      <div className="text-sm font-semibold">{analysis.progress || 0}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>

                    <Link
                      href={`/results/${analysis.id}`}
                      className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      View
                    </Link>

                    <button
                      onClick={() => handleDelete(analysis.id, analysis.brandOrKeyword)}
                      disabled={deleting === analysis.id}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                      title="Delete this analysis"
                    >
                      {deleting === analysis.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
