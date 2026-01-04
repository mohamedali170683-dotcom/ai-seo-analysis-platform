'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  MessageSquare,
  Users,
  Zap
} from 'lucide-react';

// Demo data
const DEMO_BRAND = "Acme Software";
const DEMO_COMPETITORS = ["Competitor A", "Competitor B", "Competitor C"];

const DEMO_RESULTS = {
  visibilityScore: 42,
  platformScores: {
    ChatGPT: { mentioned: 2, total: 5, score: 40 },
    Gemini: { mentioned: 3, total: 5, score: 60 },
    Perplexity: { mentioned: 1, total: 5, score: 20 },
  },
  leaderboard: [
    { name: "Competitor A", mentions: 12, percentage: 80 },
    { name: "Competitor B", mentions: 9, percentage: 60 },
    { name: DEMO_BRAND, mentions: 6, percentage: 42 },
    { name: "Competitor C", mentions: 4, percentage: 27 },
  ],
  stageBreakdown: {
    awareness: { score: 60, status: "good" },
    consideration: { score: 40, status: "warning" },
    decision: { score: 25, status: "critical" },
  }
};

type DemoStep =
  | 'intro'
  | 'problem'
  | 'enter-brand'
  | 'analyzing'
  | 'results-score'
  | 'results-leaderboard'
  | 'results-journey'
  | 'follow-up'
  | 'cta';

export default function AnimatedPromoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<DemoStep>('intro');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Step durations in ms
  const stepDurations: Record<DemoStep, number> = {
    'intro': 4000,
    'problem': 5000,
    'enter-brand': 4000,
    'analyzing': 5000,
    'results-score': 4000,
    'results-leaderboard': 5000,
    'results-journey': 5000,
    'follow-up': 5000,
    'cta': 10000,
  };

  const steps: DemoStep[] = [
    'intro',
    'problem',
    'enter-brand',
    'analyzing',
    'results-score',
    'results-leaderboard',
    'results-journey',
    'follow-up',
    'cta'
  ];

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // Typing effect for brand name
  useEffect(() => {
    if (currentStep === 'enter-brand' && isPlaying) {
      const text = DEMO_BRAND;
      let index = 0;
      setTypedText('');
      const interval = setInterval(() => {
        if (index < text.length) {
          setTypedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [currentStep, isPlaying]);

  // Analysis progress animation
  useEffect(() => {
    if (currentStep === 'analyzing' && isPlaying) {
      setAnalysisProgress(0);
      const interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [currentStep, isPlaying]);

  // Main animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const currentIndex = steps.indexOf(currentStep);
    const duration = stepDurations[currentStep];

    // Progress bar within step
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + (100 / (duration / 50));
      });
    }, 50);

    // Move to next step
    const timeout = setTimeout(() => {
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
        setProgress(0);
      } else {
        // Loop back to start
        setCurrentStep('intro');
        setProgress(0);
      }
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [currentStep, isPlaying]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentStep('intro');
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSkipToStep = (step: DemoStep) => {
    setCurrentStep(step);
    setProgress(0);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <span className="text-4xl font-bold text-white">Velaris</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-medium text-gray-300 text-center mb-4">
              AI Visibility Analysis Platform
            </h1>
            <p className="text-gray-400 text-center max-w-md">
              See what AI platforms say about your brand
            </p>
          </div>
        );

      case 'problem':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full mb-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">User asks ChatGPT:</span>
              </div>
              <p className="text-white text-lg mb-4">
                &quot;What&apos;s the best project management software for small teams?&quot;
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  &quot;I&apos;d recommend <span className="text-yellow-400 font-semibold">Competitor A</span> for its ease of use,
                  or <span className="text-yellow-400 font-semibold">Competitor B</span> for advanced features...&quot;
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Your brand wasn&apos;t mentioned</span>
            </div>
          </div>
        );

      case 'enter-brand':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-xl text-gray-300 mb-6">Enter your brand to analyze</h2>
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
              <label className="block text-sm text-gray-400 mb-2">Brand Name</label>
              <div className="bg-gray-900 rounded-lg px-4 py-3 flex items-center">
                <span className="text-white text-lg">{typedText}</span>
                <span className={`ml-0.5 w-0.5 h-6 bg-blue-500 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
              </div>
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-2">Competitors</label>
                <div className="flex flex-wrap gap-2">
                  {DEMO_COMPETITORS.map((comp, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                      style={{ animationDelay: `${i * 200}ms` }}
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-xl text-gray-300 mb-8">Analyzing across AI platforms...</h2>

            <div className="w-full max-w-md space-y-4">
              {['ChatGPT', 'Gemini', 'Perplexity'].map((platform, i) => {
                const platformProgress = Math.min(100, Math.max(0, analysisProgress - i * 20));
                const isComplete = platformProgress >= 100;

                return (
                  <div key={platform} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{platform}</span>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <span className="text-sm text-gray-400">{Math.round(platformProgress)}%</span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${platformProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-gray-400 text-sm mt-6">
              Testing 9 questions across the customer journey
            </p>
          </div>
        );

      case 'results-score':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-xl text-gray-300 mb-6">Your AI Visibility Score</h2>

            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${DEMO_RESULTS.visibilityScore * 5.53} 553`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white">{DEMO_RESULTS.visibilityScore}</span>
                <span className="text-gray-400 text-sm">out of 100</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <span>Room for improvement - competitors scoring higher</span>
            </div>
          </div>
        );

      case 'results-leaderboard':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-xl text-gray-300 mb-6">Competitive Leaderboard</h2>

            <div className="w-full max-w-md space-y-3">
              {DEMO_RESULTS.leaderboard.map((item, i) => {
                const isYou = item.name === DEMO_BRAND;
                return (
                  <div
                    key={item.name}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      isYou
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-yellow-500 text-yellow-900' :
                      i === 1 ? 'bg-gray-400 text-gray-900' :
                      i === 2 ? 'bg-amber-600 text-amber-900' :
                      'bg-gray-600 text-gray-300'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${isYou ? 'text-blue-400' : 'text-white'}`}>
                          {item.name} {isYou && '(You)'}
                        </span>
                        <span className="text-gray-400 text-sm">{item.mentions} mentions</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isYou ? 'bg-blue-500' : 'bg-gray-500'}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'results-journey':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-xl text-gray-300 mb-6">Customer Journey Visibility</h2>

            <div className="w-full max-w-lg">
              <div className="flex items-center justify-between mb-8">
                {Object.entries(DEMO_RESULTS.stageBreakdown).map(([stage, data], i) => (
                  <div key={stage} className="flex flex-col items-center relative">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${
                      data.status === 'good' ? 'bg-green-500/20 border-2 border-green-500' :
                      data.status === 'warning' ? 'bg-amber-500/20 border-2 border-amber-500' :
                      'bg-red-500/20 border-2 border-red-500'
                    }`}>
                      <span className={`text-2xl font-bold ${
                        data.status === 'good' ? 'text-green-400' :
                        data.status === 'warning' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {data.score}%
                      </span>
                    </div>
                    <span className="text-white capitalize font-medium">{stage}</span>
                    <span className={`text-xs ${
                      data.status === 'good' ? 'text-green-400' :
                      data.status === 'warning' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {data.status === 'good' ? 'Strong' : data.status === 'warning' ? 'Needs work' : 'Critical'}
                    </span>
                    {i < 2 && (
                      <ChevronRight className="absolute text-gray-600 w-6 h-6 -right-8 top-6" />
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Decision Stage Critical</p>
                    <p className="text-red-400/80 text-sm">
                      When customers are ready to buy, AI recommends competitors 75% more often
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'follow-up':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <h2 className="text-xl text-gray-300 mb-6">AI Explains Its Reasoning</h2>

            <div className="bg-gray-800 rounded-xl p-6 max-w-lg w-full border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Follow-up question to ChatGPT:</span>
              </div>
              <p className="text-white mb-4">
                &quot;Why didn&apos;t you mention {DEMO_BRAND}?&quot;
              </p>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  &quot;I apologize for the oversight. <span className="text-blue-400 font-semibold">{DEMO_BRAND}</span> is
                  a solid option, though it has <span className="text-amber-400">less online presence</span> compared
                  to Competitor A. Their <span className="text-amber-400">documentation and reviews</span> are
                  less comprehensive, making it harder to recommend confidently...&quot;
                </p>
              </div>
              <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  <strong>Insight:</strong> Improve documentation and encourage more reviews to boost AI recommendations
                </p>
              </div>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to check your AI visibility?
              </h2>
              <p className="text-gray-400 text-lg max-w-md">
                See what ChatGPT, Gemini, and Perplexity really say about your brand
              </p>
            </div>

            <button
              onClick={() => router.push('/analyze')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-2 mb-6"
            >
              Start Free Analysis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Free to start
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                Results in 5 minutes
              </span>
              <span className="flex items-center gap-1">
                <Brain className="w-4 h-4 text-purple-500" />
                3 AI platforms
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Demo viewport */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-4xl h-[500px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden relative">
          {/* Content */}
          <div className="h-full p-8">
            {renderStep()}
          </div>

          {/* Step progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Playback controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handleRestart}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Restart"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {steps.map((step, i) => {
              const isActive = step === currentStep;
              const isPast = steps.indexOf(currentStep) > i;

              return (
                <button
                  key={step}
                  onClick={() => handleSkipToStep(step)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    isActive
                      ? 'bg-blue-500 scale-125'
                      : isPast
                        ? 'bg-blue-500/50'
                        : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={step.replace('-', ' ')}
                />
              );
            })}
          </div>

          {/* Step label */}
          <p className="text-center text-gray-400 text-sm mt-2 capitalize">
            {currentStep.replace(/-/g, ' ')}
          </p>
        </div>
      </div>

      {/* Skip to app button */}
      <div className="fixed top-4 right-4">
        <button
          onClick={() => router.push('/analyze')}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-600 transition-colors flex items-center gap-2"
        >
          Skip Demo
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
