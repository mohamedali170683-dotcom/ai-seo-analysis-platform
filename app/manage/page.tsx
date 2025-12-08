"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, Loader, RefreshCw, Eraser } from "lucide-react";

export default function ManageAnalysesPage() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);

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
        setAnalyses(analyses.filter((a) => a.id !== id));
        alert("Analysis deleted successfully!");
      } else {
        alert("Failed to delete analysis: " + result.error);
      }
    } catch (error: any) {
      alert("Error deleting analysis: " + error.message);
    }
    setDeleting(null);
  };

  const handleCleanupAll = async () => {
    const failedCount = analyses.filter((a) => a.status !== "completed").length;
    if (failedCount === 0) {
      alert("No failed or stuck analyses to clean up!");
      return;
    }

    if (!confirm(`Delete all ${failedCount} failed/stuck analyses? This cannot be undone.`)) {
      return;
    }

    setCleaning(true);
    try {
      const response = await fetch("/api/analysis/cleanup", {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        alert(`Successfully deleted ${result.deletedCount} analyses!`);
        await loadAnalyses();
      } else {
        alert("Failed to cleanup analyses: " + result.error);
      }
    } catch (error: any) {
      alert("Error cleaning up analyses: " + error.message);
    }
    setCleaning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Analyses</h1>
          <p className="text-gray-600">View and delete your AI visibility analyses</p>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={loadAnalyses}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
            {analyses.filter((a) => a.status !== "completed").length > 0 && (
              <button
                onClick={handleCleanupAll}
                disabled={cleaning}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                {cleaning ? <Loader className="w-4 h-4 animate-spin" /> : <Eraser className="w-4 h-4" />}
                Cleanup Failed ({analyses.filter((a) => a.status !== "completed").length})
              </button>
            )}
          </div>
        </div>

        {/* Analyses List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
              Loading analyses...
            </div>
          ) : analyses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 mb-4">No analyses found.</p>
              <Link
                href="/analysis/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Create Your First Analysis
              </Link>
            </div>
          ) : (
            analyses.map((analysis) => (
              <div key={analysis.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{analysis.brandOrKeyword}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize">Status: {analysis.status}</span>
                      <span>Progress: {analysis.progress}%</span>
                      <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {analysis.status === "completed" ? (
                      <Link
                        href={`/results/${analysis.id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                      >
                        View Report
                      </Link>
                    ) : (
                      <Link
                        href={`/analysis/${analysis.id}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold"
                      >
                        View Progress
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(analysis.id, analysis.brandOrKeyword)}
                      disabled={deleting === analysis.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 font-semibold disabled:opacity-50"
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
