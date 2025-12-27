"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, TrendingUp } from "lucide-react";
import { use } from "react";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState("");
  const [adding, setAdding] = useState(false);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.project);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleAddKeywords = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    try {
      const keywordList = keywords.split("\n").filter((k) => k.trim());
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          keywords: keywordList,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setKeywords("");
        loadProject();
      }
    } catch (error) {
      console.error("Error adding keywords:", error);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">{project.domain}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Keywords</div>
            <div className="text-2xl font-bold">{project._count?.keywords || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">AI Overview Checks</div>
            <div className="text-2xl font-bold">{project._count?.aiOverviews || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Traffic Data Points</div>
            <div className="text-2xl font-bold">{project._count?.trafficData || 0}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Chatbot Queries</div>
            <div className="text-2xl font-bold">{project._count?.chatbotQueries || 0}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Add Keywords */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add Keywords
            </h2>
            <form onSubmit={handleAddKeywords}>
              <textarea
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                placeholder="Enter keywords (one per line)&#10;best seo tools&#10;ai content writing&#10;keyword research"
                rows={6}
              />
              <button
                type="submit"
                disabled={adding || !keywords.trim()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? "Adding..." : "Add Keywords"}
              </button>
            </form>
          </div>

          {/* Keywords List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2" />
              Keywords ({project.keywords?.length || 0})
            </h2>
            {project.keywords && project.keywords.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {project.keywords.map((kw: any) => (
                  <div
                    key={kw.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{kw.keyword}</div>
                      {kw.searchVolume && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {kw.searchVolume.toLocaleString()} searches/mo
                        </div>
                      )}
                    </div>
                    {kw.aiOverviews && kw.aiOverviews.length > 0 && (
                      <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ✓ Tracked
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No keywords yet. Add some to get started!
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/test/ai-overview"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex items-center transition-colors"
            >
              <TrendingUp className="w-6 h-6 mr-3" />
              <div>
                <div className="font-semibold">Check AI Overviews</div>
                <div className="text-sm text-blue-100">Test your keywords</div>
              </div>
            </Link>
            <Link
              href="/test/chatbot"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 flex items-center transition-colors"
            >
              <Search className="w-6 h-6 mr-3" />
              <div>
                <div className="font-semibold">Test Chatbot Visibility</div>
                <div className="text-sm text-blue-100">Check brand mentions</div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
