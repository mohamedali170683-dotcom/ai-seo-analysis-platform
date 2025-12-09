"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Bot, Search, ArrowRight, Plus, Brain, CheckCircle2, Clock, XCircle, Loader, Trash2 } from "lucide-react";
import { ProjectModal } from "@/components/project-modal";

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = async () => {
    setClearing(true);
    try {
      const response = await fetch("/api/analysis/clear", { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setAnalyses([]);
        setShowClearConfirm(false);
      } else {
        alert("Failed to clear analyses: " + data.error);
      }
    } catch (error) {
      console.error("Error clearing analyses:", error);
      alert("Failed to clear analyses");
    } finally {
      setClearing(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const loadAnalyses = async () => {
    try {
      const response = await fetch("/api/analysis/list");
      const data = await response.json();
      if (data.success) {
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error("Error loading analyses:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadProjects(), loadAnalyses()]);
      setLoading(false);
    };
    loadData();

    // Poll for running analyses
    const interval = setInterval(() => {
      if (analyses.some((a) => a.status === "running" || a.status === "pending")) {
        loadAnalyses();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats = {
    totalProjects: projects.length,
    totalKeywords: projects.reduce((sum, p) => sum + (p._count?.keywords || 0), 0),
    aiOverviewKeywords: projects.reduce((sum, p) => sum + (p._count?.aiOverviews || 0), 0),
    totalQueries: projects.reduce((sum, p) => sum + (p._count?.chatbotQueries || 0), 0),
    totalAnalyses: analyses.length,
    completedAnalyses: analyses.filter((a) => a.status === "completed").length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "running":
      case "pending":
        return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      completed: "bg-green-100 text-green-800",
      running: "bg-blue-100 text-blue-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes[status as keyof typeof classes] || "bg-gray-100 text-gray-800"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              AI Visibility Dashboard
            </h1>
            <div className="flex gap-4">
              <Link
                href="/demo"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                View Demo
              </Link>
              <Link
                href="/analysis/new"
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 font-semibold shadow-lg"
              >
                <Brain className="w-4 h-4" />
                New Analysis
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold opacity-90">AI Visibility Analyses</span>
              <Brain className="w-5 h-5 opacity-75" />
            </div>
            <div className="text-3xl font-bold">{stats.totalAnalyses}</div>
            <div className="text-xs opacity-75 mt-1">{stats.completedAnalyses} completed</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Projects</span>
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Keywords</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalKeywords}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Chatbot Queries</span>
              <Bot className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalQueries}</div>
          </div>
        </div>

        {/* AI Visibility Analyses */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                AI Visibility Analyses
              </h2>
              <p className="text-sm text-gray-600 mt-1">Track how AI platforms mention your brands</p>
            </div>
            <div className="flex items-center gap-3">
              {analyses.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
              <Link
                href="/analysis/new"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-4 h-4" />
                New Analysis
              </Link>
            </div>
          </div>

          {/* Clear Confirmation Modal */}
          {showClearConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Clear All Analyses?</h3>
                <p className="text-gray-600 mb-6">
                  This will permanently delete all {analyses.length} analyses and their data. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    disabled={clearing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={clearing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2"
                  >
                    {clearing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading analyses...</div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-gray-500 mb-4">No analyses yet. Start your first AI visibility analysis!</p>
              <Link
                href="/analysis/new"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 inline-flex items-center gap-2 font-semibold"
              >
                <Brain className="w-5 h-5" />
                Start Your First Analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(analysis.status)}
                        <h3 className="font-semibold text-lg">{analysis.brandOrKeyword}</h3>
                        {getStatusBadge(analysis.status)}
                      </div>
                      {analysis.domain && (
                        <p className="text-sm text-gray-600 ml-8">{analysis.domain}</p>
                      )}
                      {analysis.status === "running" && (
                        <div className="ml-8 mt-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden max-w-xs">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${analysis.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{analysis.progress || 0}%</span>
                          </div>
                          {analysis.currentStep && (
                            <p className="text-xs text-gray-500 mt-1">{analysis.currentStep}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{analysis.questionsCount || 0}</div>
                        <div className="text-gray-500 text-xs">Questions</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{analysis.testsCount || 0}</div>
                        <div className="text-gray-500 text-xs">AI Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{analysis.insightsCount || 0}</div>
                        <div className="text-gray-500 text-xs">Insights</div>
                      </div>
                      {analysis.status === "completed" ? (
                        <Link
                          href={`/results/${analysis.id}`}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center gap-1 font-semibold"
                        >
                          View Report
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : analysis.status === "running" || analysis.status === "pending" ? (
                        <Link
                          href={`/results/${analysis.id}`}
                          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                        >
                          View Progress
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          Failed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Your Projects</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Project
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No projects yet. Create your first project to get started!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.domain}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{project._count?.keywords || 0}</div>
                        <div className="text-gray-500">Keywords</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{project._count?.aiOverviews || 0}</div>
                        <div className="text-gray-500">AI Checks</div>
                      </div>
                      <Link
                        href={`/project/${project.id}`}
                        className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
                      >
                        View
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6">
          <Link
            href="/analysis/new"
            className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Real Analysis</h2>
                <p className="text-blue-100 text-sm">Full AI testing (15-25s)</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-semibold">
              Start Analysis
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/demoui"
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Interactive Demo</h2>
                <p className="text-green-100 text-sm">Instant results (your brand)</p>
              </div>
            </div>
            <div className="flex items-center text-sm font-semibold">
              Try Demo
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/demo"
            className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sample Report</h2>
                <p className="text-purple-100 text-sm">Purina example</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              View Sample
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/test/chatbot"
            className="bg-gradient-to-br from-pink-500 to-red-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Quick Test</h2>
                <p className="text-pink-100 text-sm">Test single question instantly</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              Try it now
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>
        </div>
      </main>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadProjects}
      />
    </div>
  );
}
