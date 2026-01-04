'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  MessageSquare,
  Zap,
  TrendingDown,
  Trophy,
  Eye,
  Target,
  Lightbulb,
  Shield,
  Clock
} from 'lucide-react';

// Lavera demo data - Natural cosmetics brand
const DEMO_BRAND = "Lavera";
const DEMO_COMPETITORS = ["Weleda", "Dr. Hauschka", "Kneipp"];
const DEMO_CATEGORY = "Natural Cosmetics";

const DEMO_RESULTS = {
  visibilityScore: 38,
  platformScores: {
    ChatGPT: { mentioned: 2, total: 9, score: 22 },
    Gemini: { mentioned: 4, total: 9, score: 44 },
    Perplexity: { mentioned: 3, total: 9, score: 33 },
  },
  leaderboard: [
    { name: "Weleda", mentions: 21, percentage: 78 },
    { name: "Dr. Hauschka", mentions: 18, percentage: 67 },
    { name: "Kneipp", mentions: 12, percentage: 44 },
    { name: DEMO_BRAND, mentions: 9, percentage: 38 },
  ],
  stageBreakdown: {
    awareness: { score: 55, status: "warning" },
    consideration: { score: 33, status: "critical" },
    decision: { score: 22, status: "critical" },
  }
};

type DemoStep =
  | 'hook'
  | 'problem-stats'
  | 'problem-demo'
  | 'agitate'
  | 'solution-intro'
  | 'solution-analysis'
  | 'results-score'
  | 'results-leaderboard'
  | 'results-journey'
  | 'insight'
  | 'value-prop'
  | 'cta';

interface StepContent {
  headline: string;
  subheadline?: string;
}

const stepContent: Record<DemoStep, StepContent> = {
  'hook': {
    headline: "Your customers are asking AI for recommendations.",
    subheadline: "Is your brand in the answer?"
  },
  'problem-stats': {
    headline: "The world has changed.",
    subheadline: "527% growth in AI-driven search. 70% of searches end without a click."
  },
  'problem-demo': {
    headline: "This is happening right now.",
    subheadline: "A potential customer asks ChatGPT..."
  },
  'agitate': {
    headline: "Every day you don't know, you're losing customers.",
    subheadline: "Your competitors might already be optimizing for AI."
  },
  'solution-intro': {
    headline: "What if you could see exactly what AI says?",
    subheadline: "Velaris shows you the truth."
  },
  'solution-analysis': {
    headline: "We query real AI platforms with real questions.",
    subheadline: "ChatGPT, Gemini, Perplexity - simultaneously."
  },
  'results-score': {
    headline: "Your visibility score reveals the problem.",
    subheadline: "38 out of 100. There's work to do."
  },
  'results-leaderboard': {
    headline: "See exactly who's beating you.",
    subheadline: "And by how much."
  },
  'results-journey': {
    headline: "Find where you're losing customers.",
    subheadline: "Awareness → Consideration → Decision"
  },
  'insight': {
    headline: "Understand why AI prefers your competitors.",
    subheadline: "AI explains its own reasoning."
  },
  'value-prop': {
    headline: "Stop guessing. Start knowing.",
    subheadline: "Full journey analysis. Competitive intelligence. Actionable insights."
  },
  'cta': {
    headline: "Check your AI visibility now.",
    subheadline: "Free. 5 minutes. No credit card."
  }
};

export default function AnimatedPromoPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<DemoStep>('hook');
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [typedResponse, setTypedResponse] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [countUp, setCountUp] = useState(0);

  const stepDurations: Record<DemoStep, number> = {
    'hook': 4000,
    'problem-stats': 5000,
    'problem-demo': 6000,
    'agitate': 4000,
    'solution-intro': 4000,
    'solution-analysis': 5000,
    'results-score': 5000,
    'results-leaderboard': 5000,
    'results-journey': 5000,
    'insight': 6000,
    'value-prop': 4000,
    'cta': 8000,
  };

  const steps: DemoStep[] = [
    'hook',
    'problem-stats',
    'problem-demo',
    'agitate',
    'solution-intro',
    'solution-analysis',
    'results-score',
    'results-leaderboard',
    'results-journey',
    'insight',
    'value-prop',
    'cta'
  ];

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(prev => !prev), 530);
    return () => clearInterval(interval);
  }, []);

  // Typing effect for question
  useEffect(() => {
    if (currentStep === 'problem-demo' && isPlaying) {
      const question = "What's the best natural cosmetics brand in Germany?";
      let index = 0;
      setTypedText('');
      setTypedResponse('');

      const questionInterval = setInterval(() => {
        if (index < question.length) {
          setTypedText(question.slice(0, index + 1));
          index++;
        } else {
          clearInterval(questionInterval);
          // Start response after question
          setTimeout(() => {
            const response = "For natural cosmetics in Germany, I'd recommend Weleda - they're the market leader with over 100 years of experience. Dr. Hauschka is also excellent for premium skincare...";
            let respIndex = 0;
            const responseInterval = setInterval(() => {
              if (respIndex < response.length) {
                setTypedResponse(response.slice(0, respIndex + 1));
                respIndex++;
              } else {
                clearInterval(responseInterval);
              }
            }, 20);
          }, 500);
        }
      }, 40);
      return () => clearInterval(questionInterval);
    }
  }, [currentStep, isPlaying]);

  // Analysis progress
  useEffect(() => {
    if (currentStep === 'solution-analysis' && isPlaying) {
      setAnalysisProgress(0);
      const interval = setInterval(() => {
        setAnalysisProgress(prev => prev >= 100 ? 100 : prev + 3);
      }, 60);
      return () => clearInterval(interval);
    }
  }, [currentStep, isPlaying]);

  // Score count up
  useEffect(() => {
    if (currentStep === 'results-score' && isPlaying) {
      setCountUp(0);
      const interval = setInterval(() => {
        setCountUp(prev => {
          if (prev >= DEMO_RESULTS.visibilityScore) return DEMO_RESULTS.visibilityScore;
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [currentStep, isPlaying]);

  // Main animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const currentIndex = steps.indexOf(currentStep);
    const duration = stepDurations[currentStep];

    const progressInterval = setInterval(() => {
      setProgress(prev => prev >= 100 ? 100 : prev + (100 / (duration / 50)));
    }, 50);

    const timeout = setTimeout(() => {
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
        setProgress(0);
      } else {
        setCurrentStep('hook');
        setProgress(0);
      }
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [currentStep, isPlaying]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRestart = () => {
    setCurrentStep('hook');
    setProgress(0);
    setIsPlaying(true);
  };
  const handleSkipToStep = (step: DemoStep) => {
    setCurrentStep(step);
    setProgress(0);
  };

  const renderStep = () => {
    const content = stepContent[currentStep];

    switch (currentStep) {
      case 'hook':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <div className="mb-8">
              <MessageSquare className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {content.headline}
            </h1>
            <p className="text-xl md:text-2xl text-blue-400 font-medium">
              {content.subheadline}
            </p>
          </div>
        );

      case 'problem-stats':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
              {content.headline}
            </h2>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-6">
                <TrendingDown className="w-10 h-10 text-red-400 mx-auto mb-2" />
                <div className="text-4xl font-bold text-red-400">527%</div>
                <div className="text-sm text-red-300">AI search growth</div>
              </div>
              <div className="bg-amber-900/40 border border-amber-500/50 rounded-xl p-6">
                <Eye className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <div className="text-4xl font-bold text-amber-400">70%</div>
                <div className="text-sm text-amber-300">Zero-click searches</div>
              </div>
            </div>
            <p className="text-lg text-gray-400">
              {content.subheadline}
            </p>
          </div>
        );

      case 'problem-demo':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-6 text-center">
              {content.headline}
            </h2>
            <div className="bg-gray-800 rounded-2xl p-5 max-w-lg w-full border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-gray-400">User asks ChatGPT</span>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 mb-4">
                <p className="text-white">
                  {typedText}
                  <span className={`ml-0.5 inline-block w-0.5 h-5 bg-blue-500 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                </p>
              </div>
              {typedResponse && (
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <p className="text-gray-300 text-sm">
                    {typedResponse}
                    {typedResponse.length < 150 && (
                      <span className={`ml-0.5 inline-block w-0.5 h-4 bg-green-500 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                    )}
                  </p>
                </div>
              )}
            </div>
            {typedResponse.length > 100 && (
              <div className="flex items-center gap-2 text-red-400 mt-4 animate-fade-in">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{DEMO_BRAND} wasn&apos;t mentioned</span>
              </div>
            )}
          </div>
        );

      case 'agitate':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {content.headline}
            </h2>
            <p className="text-lg text-red-400 font-medium mb-6">
              {content.subheadline}
            </p>
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-4 max-w-md">
              <p className="text-red-300 text-sm">
                While you read this, someone just asked AI for a recommendation in your category.
                <br />
                <strong>Did they find you?</strong>
              </p>
            </div>
          </div>
        );

      case 'solution-intro':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">Velaris</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              {content.headline}
            </h2>
            <p className="text-lg text-blue-400 font-medium">
              {content.subheadline}
            </p>
          </div>
        );

      case 'solution-analysis':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-6 text-center">{content.subheadline}</p>

            <div className="w-full max-w-md space-y-3">
              {[
                { name: 'ChatGPT', color: 'from-green-500 to-green-600' },
                { name: 'Gemini', color: 'from-blue-500 to-blue-600' },
                { name: 'Perplexity', color: 'from-purple-500 to-purple-600' }
              ].map((platform, i) => {
                const platformProgress = Math.min(100, Math.max(0, analysisProgress - i * 15));
                const isComplete = platformProgress >= 100;

                return (
                  <div key={platform.name} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{platform.name}</span>
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <span className="text-sm text-gray-400">{Math.round(platformProgress)}%</span>
                      )}
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${platform.color} transition-all duration-300`}
                        style={{ width: `${platformProgress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-4 mt-6 text-sm text-gray-400">
              <span>9 questions</span>
              <span>•</span>
              <span>3 stages</span>
              <span>•</span>
              <span>27 AI responses</span>
            </div>
          </div>
        );

      case 'results-score':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-6">{content.subheadline}</p>

            <div className="relative w-52 h-52 mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="104" cy="104" r="92" fill="none" stroke="#374151" strokeWidth="14" />
                <circle
                  cx="104" cy="104" r="92"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${countUp * 5.78} 578`}
                  className="transition-all duration-100"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-bold text-white">{countUp}</span>
                <span className="text-gray-400">out of 100</span>
              </div>
            </div>

            <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg px-4 py-2">
              <span className="text-amber-400 font-medium">
                {DEMO_BRAND} is being overlooked by AI
              </span>
            </div>
          </div>
        );

      case 'results-leaderboard':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-6 text-center">{content.subheadline}</p>

            <div className="w-full max-w-md space-y-3">
              {DEMO_RESULTS.leaderboard.map((item, i) => {
                const isYou = item.name === DEMO_BRAND;
                return (
                  <div
                    key={item.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isYou
                        ? 'bg-blue-900/40 border-blue-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-yellow-500 text-yellow-900' :
                      i === 1 ? 'bg-gray-300 text-gray-900' :
                      i === 2 ? 'bg-amber-600 text-amber-900' :
                      'bg-gray-600 text-gray-200'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${isYou ? 'text-blue-400' : 'text-white'}`}>
                          {item.name} {isYou && <span className="text-xs">(You)</span>}
                        </span>
                        <span className="text-gray-400 text-sm">{item.mentions}/27 mentions</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isYou ? 'bg-blue-500' : i === 0 ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <span className="text-red-400 text-sm">
                Weleda is mentioned <strong>2.3x more</strong> than {DEMO_BRAND}
              </span>
            </div>
          </div>
        );

      case 'results-journey':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-8 text-center">{content.subheadline}</p>

            <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
              {Object.entries(DEMO_RESULTS.stageBreakdown).map(([stage, data], i) => (
                <div key={stage} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-2 border-2 ${
                      data.status === 'good' ? 'bg-green-500/20 border-green-500' :
                      data.status === 'warning' ? 'bg-amber-500/20 border-amber-500' :
                      'bg-red-500/20 border-red-500'
                    }`}>
                      <span className={`text-xl md:text-2xl font-bold ${
                        data.status === 'good' ? 'text-green-400' :
                        data.status === 'warning' ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {data.score}%
                      </span>
                    </div>
                    <span className="text-white text-sm capitalize font-medium">{stage}</span>
                  </div>
                  {i < 2 && <ChevronRight className="w-6 h-6 text-gray-600 mx-1" />}
                </div>
              ))}
            </div>

            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 max-w-md">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-medium text-sm">Critical at Decision Stage</p>
                  <p className="text-red-400/80 text-xs">
                    When customers are ready to buy, AI recommends competitors 78% of the time
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'insight':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-6 text-center">{content.subheadline}</p>

            <div className="bg-gray-800 rounded-xl p-5 max-w-lg w-full border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Follow-up: &quot;Why didn&apos;t you mention {DEMO_BRAND}?&quot;</span>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className="text-gray-300 text-sm leading-relaxed">
                  &quot;{DEMO_BRAND} is a good option, but has <span className="text-amber-400 font-medium">less visibility in English-language sources</span> compared to Weleda and Dr. Hauschka. Their
                  <span className="text-amber-400 font-medium"> international presence and user reviews</span> are less comprehensive, making them harder to recommend confidently to a global audience.&quot;
                </p>
              </div>
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 mt-0.5" />
                  <p className="text-blue-300 text-sm">
                    <strong>Actionable Insight:</strong> Improve international content and encourage more English reviews to boost AI recommendations
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'value-prop':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              {content.headline}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-6 max-w-lg">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Full Journey Analysis</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Competitive Intel</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <Lightbulb className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">AI Reasoning</p>
              </div>
            </div>
            <p className="text-lg text-blue-400">{content.subheadline}</p>
          </div>
        );

      case 'cta':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Velaris</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {content.headline}
            </h2>
            <p className="text-lg text-gray-400 mb-8">{content.subheadline}</p>

            <button
              onClick={() => router.push('/analyze')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-2 mb-6 shadow-lg shadow-blue-500/25"
            >
              Check My AI Visibility
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Free
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                5 minutes
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-purple-500" />
                No card
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
      {/* Main viewport */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-4xl h-[520px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden relative">
          {/* Headline bar */}
          <div className="absolute top-0 left-0 right-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-6 py-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <span className="text-white font-medium">Velaris Demo</span>
              </div>
              <span className="text-sm text-gray-400 capitalize">
                {currentStep.replace(/-/g, ' ')}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="h-full pt-14 pb-2">
            {renderStep()}
          </div>

          {/* Progress bar */}
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

          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {steps.map((step, i) => {
              const isActive = step === currentStep;
              const isPast = steps.indexOf(currentStep) > i;

              return (
                <button
                  key={step}
                  onClick={() => handleSkipToStep(step)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    isActive
                      ? 'bg-blue-500 scale-125'
                      : isPast
                        ? 'bg-blue-500/50'
                        : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={step.replace(/-/g, ' ')}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Skip button */}
      <div className="fixed top-4 right-4">
        <button
          onClick={() => router.push('/analyze')}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-600 transition-colors flex items-center gap-2"
        >
          Skip
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
