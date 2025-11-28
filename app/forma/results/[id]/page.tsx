import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Brain, ArrowLeft, TrendingUp, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';

export default async function ResultsPage({ params }: { params: { id: string } }) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: params.id },
    include: { project: true },
  });

  if (!assessment) {
    notFound();
  }

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 75) return 'text-green-400 border-green-500 bg-green-900/30';
    if (percentage >= 50) return 'text-blue-400 border-blue-500 bg-blue-900/30';
    if (percentage >= 25) return 'text-yellow-400 border-yellow-500 bg-yellow-900/30';
    return 'text-red-400 border-red-500 bg-red-900/30';
  };

  const getScoreGradient = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 75) return 'from-green-600 to-green-400';
    if (percentage >= 50) return 'from-blue-600 to-blue-400';
    if (percentage >= 25) return 'from-yellow-600 to-yellow-400';
    return 'from-red-600 to-red-400';
  };

  const interpretation = assessment.bsosScore >= 75
    ? 'Sophisticated behavioral design with systematic optimization'
    : assessment.bsosScore >= 50
    ? 'Moderate application with significant opportunities'
    : assessment.bsosScore >= 25
    ? 'Limited behavioral science application'
    : 'Minimal application with substantial untapped potential';

  const recommendations = (assessment.recommendations as any) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/forma" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Brain className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Forma</span>
            </Link>
            <Link
              href="/forma/assessment"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all"
            >
              New Assessment
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/forma" className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forma
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">{assessment.project.brandName}</h1>
          <p className="text-gray-300">
            Assessment completed on {new Date(assessment.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Overall BSOS Score */}
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex-1 mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white mb-2">
                Behavioral Science Optimization Score
              </h2>
              <p className="text-xl text-purple-300 mb-4">{interpretation}</p>
              <div className="flex items-center space-x-2">
                <div className="w-full max-w-md bg-gray-700 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full bg-gradient-to-r ${getScoreGradient(assessment.bsosScore, 100)}`}
                    style={{ width: `${assessment.bsosScore}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-8xl font-bold ${getScoreColor(assessment.bsosScore, 100).split(' ')[0]}`}>
                {Math.round(assessment.bsosScore)}
              </div>
              <div className="text-2xl text-gray-400">out of 100</div>
            </div>
          </div>
        </div>

        {/* Component Breakdown */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Website Component */}
          <div className="bg-gradient-to-br from-blue-900/40 to-transparent rounded-xl p-6 border border-blue-500/20 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Website/Blog</h3>
              <div className="text-3xl font-bold text-blue-400">
                {Math.round(assessment.websiteScore)}/33
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(assessment.websiteScore, 33)}`}
                style={{ width: `${(assessment.websiteScore / 33) * 100}%` }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Bias Implementation</span>
                <span className="text-blue-400 font-semibold">
                  {Math.round(assessment.websiteBiasScore)}/12
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Choice Architecture</span>
                <span className="text-blue-400 font-semibold">
                  {Math.round(assessment.websiteChoiceScore)}/12
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Journey Optimization</span>
                <span className="text-blue-400 font-semibold">
                  {Math.round(assessment.websiteJourneyScore)}/9
                </span>
              </div>
            </div>
          </div>

          {/* Social Media Component */}
          <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-6 border border-purple-500/20 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Social Media</h3>
              <div className="text-3xl font-bold text-purple-400">
                {Math.round(assessment.socialScore)}/33
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(assessment.socialScore, 33)}`}
                style={{ width: `${(assessment.socialScore / 33) * 100}%` }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Content Engagement</span>
                <span className="text-purple-400 font-semibold">
                  {Math.round(assessment.socialContentScore)}/12
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Behavioral Triggers</span>
                <span className="text-purple-400 font-semibold">
                  {Math.round(assessment.socialTriggersScore)}/12
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Visual Psychology</span>
                <span className="text-purple-400 font-semibold">
                  {Math.round(assessment.socialVisualScore)}/9
                </span>
              </div>
            </div>
          </div>

          {/* Paid Advertising Component */}
          <div className="bg-gradient-to-br from-pink-900/40 to-transparent rounded-xl p-6 border border-pink-500/20 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Paid Advertising</h3>
              <div className="text-3xl font-bold text-pink-400">
                {Math.round(assessment.adScore)}/34
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${getScoreGradient(assessment.adScore, 34)}`}
                style={{ width: `${(assessment.adScore / 34) * 100}%` }}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Creative Effectiveness</span>
                <span className="text-pink-400 font-semibold">
                  {Math.round(assessment.adCreativeScore)}/12
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Persuasion Architecture</span>
                <span className="text-pink-400 font-semibold">
                  {Math.round(assessment.adPersuasionScore)}/12
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Landing Page Alignment</span>
                <span className="text-pink-400 font-semibold">
                  {Math.round(assessment.adLandingScore)}/10
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-purple-400" />
              Optimization Recommendations
            </h2>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-gray-300">No recommendations available at this time.</p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec: any, index: number) => (
                <div
                  key={index}
                  className={`rounded-lg p-6 border ${
                    rec.priority === 'high'
                      ? 'bg-red-900/20 border-red-500/30'
                      : rec.priority === 'medium'
                      ? 'bg-yellow-900/20 border-yellow-500/30'
                      : 'bg-blue-900/20 border-blue-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            rec.priority === 'high'
                              ? 'bg-red-600 text-white'
                              : rec.priority === 'medium'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {rec.priority} Priority
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-600 text-white">
                          {rec.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{rec.title}</h3>
                      <p className="text-gray-300 mb-4">{rec.description}</p>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Expected Impact</div>
                          <div className="text-green-400 font-semibold flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {rec.expectedImpact}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Effort</div>
                          <div className="text-gray-200 font-semibold capitalize">{rec.effort}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 mb-1">Timeline</div>
                          <div className="text-gray-200 font-semibold">{rec.timeline}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Key Deliverables */}
        <div className="mt-8 bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-6">Next Steps: Key Deliverables</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-black/30 rounded-lg p-6">
              <CheckCircle2 className="h-10 w-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">BSOS Scorecard</h3>
              <p className="text-gray-300 text-sm">
                Your comprehensive scoring across all three channels with detailed component breakdowns
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-6">
              <AlertCircle className="h-10 w-10 text-yellow-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Optimization Architecture</h3>
              <p className="text-gray-300 text-sm">
                Detailed specifications for implementing behavioral science across your digital presence
              </p>
            </div>
            <div className="bg-black/30 rounded-lg p-6">
              <TrendingUp className="h-10 w-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Testing Protocol</h3>
              <p className="text-gray-300 text-sm">
                12-week experimentation roadmap with hypotheses, variants, and success metrics
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/forma/assessment"
            className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all shadow-xl"
          >
            <span>Run Another Assessment</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
