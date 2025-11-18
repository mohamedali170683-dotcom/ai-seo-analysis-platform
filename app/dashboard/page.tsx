"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Bot, Search, ArrowRight, Plus } from "lucide-react";
import { ProjectModal } from "@/components/project-modal";

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const stats = {
    totalProjects: projects.length,
    totalKeywords: projects.reduce((sum, p) => sum + (p._count?.keywords || 0), 0),
    aiOverviewKeywords: projects.reduce((sum, p) => sum + (p._count?.aiOverviews || 0), 0),
    totalQueries: projects.reduce((sum, p) => sum + (p._count?.chatbotQueries || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              SEO Analysis Dashboard
            </h1>
            <div className="flex gap-4">
              <Link
                href="/test/ai-overview"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Test AI Overview
              </Link>
              <Link
                href="/test/chatbot"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Test Chatbot
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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
              <span className="text-sm font-medium text-gray-600">AI Overviews Tracked</span>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.aiOverviewKeywords}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Chatbot Queries</span>
              <Bot className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold">{stats.totalQueries}</div>
          </div>
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
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/test/ai-overview"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Test AI Overview Detection</h2>
                <p className="text-blue-100 text-sm">Check if keywords trigger AI Overviews</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              Try it now
              <ArrowRight className="ml-2 w-4 h-4" />
            </div>
          </Link>

          <Link
            href="/test/chatbot"
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 text-white hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Test Chatbot Visibility</h2>
                <p className="text-purple-100 text-sm">Check brand mentions in ChatGPT</p>
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
