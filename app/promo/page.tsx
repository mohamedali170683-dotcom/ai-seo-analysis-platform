'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  MessageSquare,
  TrendingDown,
  Trophy,
  Eye,
  Target,
  Lightbulb,
  Shield,
  Clock,
  Search,
  Plus,
  FileText,
  BarChart3,
  Users,
  Star
} from 'lucide-react';

// Lavera demo data - Natural cosmetics brand
const DEMO_BRAND = "Lavera";
const DEMO_COMPETITORS = ["Weleda", "Dr. Hauschka", "Kneipp"];

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
  | 'solution-intro'
  | 'app-form'
  | 'app-analysis'
  | 'app-results'
  | 'app-leaderboard'
  | 'app-journey'
  | 'app-insights'
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
  'solution-intro': {
    headline: "What if you could see exactly what AI says?",
    subheadline: "Velaris shows you the truth."
  },
  'app-form': {
    headline: "Start by entering your brand and competitors.",
    subheadline: "Our analysis form - simple and powerful."
  },
  'app-analysis': {
    headline: "We query 3 AI platforms simultaneously.",
    subheadline: "9 questions across the customer journey."
  },
  'app-results': {
    headline: "See your visibility score instantly.",
    subheadline: "Know exactly where you stand."
  },
  'app-leaderboard': {
    headline: "Compare against your competitors.",
    subheadline: "See who AI recommends most."
  },
  'app-journey': {
    headline: "Understand the customer journey.",
    subheadline: "Find where you're losing customers."
  },
  'app-insights': {
    headline: "Get AI's reasoning explained.",
    subheadline: "Actionable insights to improve."
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
  const [formStep, setFormStep] = useState(0);

  // SLOWER durations - doubled for better readability
  const stepDurations: Record<DemoStep, number> = {
    'hook': 6000,
    'problem-stats': 8000,
    'problem-demo': 10000,
    'solution-intro': 6000,
    'app-form': 8000,
    'app-analysis': 10000,
    'app-results': 10000,
    'app-leaderboard': 10000,
    'app-journey': 10000,
    'app-insights': 10000,
    'cta': 12000,
  };

  const steps: DemoStep[] = [
    'hook',
    'problem-stats',
    'problem-demo',
    'solution-intro',
    'app-form',
    'app-analysis',
    'app-results',
    'app-leaderboard',
    'app-journey',
    'app-insights',
    'cta'
  ];

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(prev => !prev), 530);
    return () => clearInterval(interval);
  }, []);

  // Form animation
  useEffect(() => {
    if (currentStep === 'app-form' && isPlaying) {
      setFormStep(0);
      const timers = [
        setTimeout(() => setFormStep(1), 1500),
        setTimeout(() => setFormStep(2), 3000),
        setTimeout(() => setFormStep(3), 4500),
        setTimeout(() => setFormStep(4), 6000),
      ];
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [currentStep, isPlaying]);

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
          setTimeout(() => {
            const response = "For natural cosmetics in Germany, I'd recommend Weleda - they're the market leader with over 100 years of experience. Dr. Hauschka is also excellent for premium skincare. Kneipp offers great value for natural bath and body products...";
            let respIndex = 0;
            const responseInterval = setInterval(() => {
              if (respIndex < response.length) {
                setTypedResponse(response.slice(0, respIndex + 1));
                respIndex++;
              } else {
                clearInterval(responseInterval);
              }
            }, 15);
          }, 800);
        }
      }, 35);
      return () => clearInterval(questionInterval);
    }
  }, [currentStep, isPlaying]);

  // Analysis progress
  useEffect(() => {
    if (currentStep === 'app-analysis' && isPlaying) {
      setAnalysisProgress(0);
      const interval = setInterval(() => {
        setAnalysisProgress(prev => prev >= 100 ? 100 : prev + 1.5);
      }, 80);
      return () => clearInterval(interval);
    }
  }, [currentStep, isPlaying]);

  // Score count up
  useEffect(() => {
    if (currentStep === 'app-results' && isPlaying) {
      setCountUp(0);
      const delay = setTimeout(() => {
        const interval = setInterval(() => {
          setCountUp(prev => {
            if (prev >= DEMO_RESULTS.visibilityScore) return DEMO_RESULTS.visibilityScore;
            return prev + 1;
          });
        }, 80);
        return () => clearInterval(interval);
      }, 500);
      return () => clearTimeout(delay);
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

  const handleNext = useCallback(() => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
      setProgress(0);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
      setProgress(0);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'p') {
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Mockup UI Components
  const MockBrowser = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 w-full max-w-2xl">
      {/* Browser chrome */}
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-3 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-white rounded-md px-4 py-1 text-xs text-gray-500 border border-gray-200 flex items-center gap-2">
            <Search className="w-3 h-3" />
            velaris.ai{title && `/${title}`}
          </div>
        </div>
        <div className="w-16" />
      </div>
      {/* Content */}
      <div className="bg-gradient-to-br from-slate-50 to-white">
        {children}
      </div>
    </div>
  );

  const renderStep = () => {
    const content = stepContent[currentStep];

    switch (currentStep) {
      case 'hook':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <div className="mb-8">
              <MessageSquare className="w-20 h-20 text-blue-400 mx-auto mb-4 animate-pulse" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {content.headline}
            </h1>
            <p className="text-xl md:text-3xl text-blue-400 font-medium">
              {content.subheadline}
            </p>
          </div>
        );

      case 'problem-stats':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-10">
              {content.headline}
            </h2>
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="bg-red-900/40 border border-red-500/50 rounded-2xl p-8">
                <TrendingDown className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <div className="text-5xl font-bold text-red-400 mb-2">527%</div>
                <div className="text-base text-red-300">AI search growth</div>
              </div>
              <div className="bg-amber-900/40 border border-amber-500/50 rounded-2xl p-8">
                <Eye className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <div className="text-5xl font-bold text-amber-400 mb-2">70%</div>
                <div className="text-base text-amber-300">Zero-click searches</div>
              </div>
            </div>
            <p className="text-xl text-gray-400 max-w-lg">
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
            <div className="bg-gray-800 rounded-2xl p-6 max-w-xl w-full border border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-white font-medium">ChatGPT</span>
                  <span className="text-gray-500 text-sm ml-2">GPT-4</span>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-4 mb-4">
                <p className="text-white text-lg">
                  {typedText}
                  {typedText.length < 50 && (
                    <span className={`ml-0.5 inline-block w-0.5 h-5 bg-blue-500 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                  )}
                </p>
              </div>
              {typedResponse && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <p className="text-gray-300 leading-relaxed">
                    {typedResponse}
                    {typedResponse.length < 200 && (
                      <span className={`ml-0.5 inline-block w-0.5 h-4 bg-green-500 ${showCursor ? 'opacity-100' : 'opacity-0'}`} />
                    )}
                  </p>
                </div>
              )}
            </div>
            {typedResponse.length > 150 && (
              <div className="flex items-center gap-3 text-red-400 mt-6 animate-fade-in bg-red-900/30 px-5 py-3 rounded-xl border border-red-500/50">
                <AlertTriangle className="w-6 h-6" />
                <span className="font-semibold text-lg">{DEMO_BRAND} wasn&apos;t mentioned at all!</span>
              </div>
            )}
          </div>
        );

      case 'solution-intro':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <span className="text-5xl font-bold text-white">Velaris</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              {content.headline}
            </h2>
            <p className="text-xl text-blue-400 font-medium">
              {content.subheadline}
            </p>
          </div>
        );

      case 'app-form':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-4">
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-4 text-center text-sm">{content.subheadline}</p>

            <MockBrowser title="analyze">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-2 mb-6">
                  <Brain className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-gray-900">Velaris</span>
                  <span className="text-gray-400 text-sm ml-2">AI Visibility Analysis</span>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Brand</label>
                    <div className={`border rounded-lg px-4 py-3 transition-all ${formStep >= 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <span className={`${formStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {formStep >= 1 ? 'Lavera' : 'Enter your brand name...'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <div className={`border rounded-lg px-4 py-3 transition-all ${formStep >= 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <span className={`${formStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {formStep >= 2 ? 'Natural Cosmetics' : 'Select your industry...'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Competitors (up to 3)</label>
                    <div className="space-y-2">
                      {DEMO_COMPETITORS.map((comp, i) => (
                        <div
                          key={comp}
                          className={`border rounded-lg px-4 py-2.5 flex items-center gap-2 transition-all ${
                            formStep >= 3 + (i * 0.3) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          {formStep >= 3 ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-blue-500" />
                              <span className="text-gray-900">{comp}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400">Add competitor...</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      formStep >= 4
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {formStep >= 4 ? 'Start AI Visibility Analysis →' : 'Complete form to continue...'}
                  </button>
                </div>
              </div>
            </MockBrowser>
          </div>
        );

      case 'app-analysis':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-4">
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-4 text-center text-sm">{content.subheadline}</p>

            <MockBrowser title="analyze">
              <div className="p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Analyzing {DEMO_BRAND}</h3>
                  <p className="text-gray-500 text-sm">vs {DEMO_COMPETITORS.join(', ')}</p>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'ChatGPT', icon: '🟢', questions: ['Brand awareness', 'Product quality', 'Purchase decision'] },
                    { name: 'Gemini', icon: '🔵', questions: ['Brand recognition', 'Value comparison', 'Final choice'] },
                    { name: 'Perplexity', icon: '🟣', questions: ['Market presence', 'Expert reviews', 'Best recommendation'] }
                  ].map((platform, i) => {
                    const platformProgress = Math.min(100, Math.max(0, analysisProgress - i * 20));
                    const isComplete = platformProgress >= 100;
                    const currentQuestion = Math.floor(platformProgress / 34);

                    return (
                      <div key={platform.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{platform.icon}</span>
                            <span className="font-medium text-gray-900">{platform.name}</span>
                          </div>
                          {isComplete ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              Complete
                            </span>
                          ) : (
                            <span className="text-blue-600 text-sm font-medium">{Math.round(platformProgress)}%</span>
                          )}
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isComplete ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${platformProgress}%` }}
                          />
                        </div>
                        {!isComplete && platformProgress > 0 && (
                          <p className="text-xs text-gray-500">
                            Testing: {platform.questions[Math.min(currentQuestion, 2)]}...
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-8 text-sm text-gray-500">
                  <span>9 questions</span>
                  <span>3 journey stages</span>
                  <span>27 AI responses</span>
                </div>
              </div>
            </MockBrowser>
          </div>
        );

      case 'app-results':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-4">
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-4 text-center text-sm">{content.subheadline}</p>

            <MockBrowser title="results">
              <div className="p-6">
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Analysis Complete
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  {/* Score Circle */}
                  <div className="relative w-40 h-40 mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                      <circle
                        cx="80" cy="80" r="70"
                        fill="none"
                        stroke={countUp < 40 ? '#EF4444' : countUp < 60 ? '#F59E0B' : '#22C55E'}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${countUp * 4.4} 440`}
                        className="transition-all duration-100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-gray-900">{countUp}</span>
                      <span className="text-gray-500 text-sm">out of 100</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{DEMO_BRAND} AI Visibility</h3>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4">
                    <span className="text-amber-700 font-medium">
                      Needs Improvement - AI often overlooks your brand
                    </span>
                  </div>

                  {/* Platform breakdown */}
                  <div className="grid grid-cols-3 gap-4 w-full">
                    {Object.entries(DEMO_RESULTS.platformScores).map(([platform, data]) => (
                      <div key={platform} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{data.score}%</div>
                        <div className="text-xs text-gray-500">{platform}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </MockBrowser>
          </div>
        );

      case 'app-leaderboard':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-4">
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-4 text-center text-sm">{content.subheadline}</p>

            <MockBrowser title="results/leaderboard">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-gray-900">Competitor Leaderboard</h3>
                </div>

                <div className="space-y-3">
                  {DEMO_RESULTS.leaderboard.map((item, i) => {
                    const isYou = item.name === DEMO_BRAND;
                    return (
                      <div
                        key={item.name}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          isYou
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-100'
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          i === 0 ? 'bg-yellow-400 text-yellow-900' :
                          i === 1 ? 'bg-gray-300 text-gray-700' :
                          i === 2 ? 'bg-amber-500 text-amber-900' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium ${isYou ? 'text-blue-700' : 'text-gray-900'}`}>
                              {item.name} {isYou && <span className="text-blue-500 text-xs font-normal">(Your Brand)</span>}
                            </span>
                            <span className="text-gray-600 text-sm font-medium">{item.percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isYou ? 'bg-blue-500' : i === 0 ? 'bg-yellow-400' : 'bg-gray-400'
                              }`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-red-700 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Weleda is mentioned <strong>2.3x more often</strong> than {DEMO_BRAND}
                  </p>
                </div>
              </div>
            </MockBrowser>
          </div>
        );

      case 'app-journey':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-4">
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-4 text-center text-sm">{content.subheadline}</p>

            <MockBrowser title="results/journey">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Customer Journey Analysis</h3>
                </div>

                <div className="flex items-center justify-between mb-6">
                  {Object.entries(DEMO_RESULTS.stageBreakdown).map(([stage, data], i) => (
                    <div key={stage} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-2 ${
                          data.status === 'good' ? 'bg-green-100' :
                          data.status === 'warning' ? 'bg-amber-100' :
                          'bg-red-100'
                        }`}>
                          <span className={`text-2xl font-bold ${
                            data.status === 'good' ? 'text-green-600' :
                            data.status === 'warning' ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {data.score}%
                          </span>
                        </div>
                        <span className="text-gray-900 text-sm font-medium capitalize">{stage}</span>
                        <span className={`text-xs mt-1 px-2 py-0.5 rounded-full ${
                          data.status === 'good' ? 'bg-green-100 text-green-700' :
                          data.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {data.status === 'critical' ? 'Critical' : data.status === 'warning' ? 'Warning' : 'Good'}
                        </span>
                      </div>
                      {i < 2 && <ChevronRight className="w-6 h-6 text-gray-300 mx-2" />}
                    </div>
                  ))}
                </div>

                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-red-800 font-medium text-sm">Critical Issue at Decision Stage</p>
                      <p className="text-red-600 text-xs mt-1">
                        When customers are ready to buy, AI recommends competitors 78% of the time. This is where you&apos;re losing the most sales.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </MockBrowser>
          </div>
        );

      case 'app-insights':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in px-4">
            <h2 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
              {content.headline}
            </h2>
            <p className="text-gray-400 mb-4 text-center text-sm">{content.subheadline}</p>

            <MockBrowser title="results/insights">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-gray-900">AI Reasoning Insights</h3>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Follow-up question to AI:</span>
                  </div>
                  <p className="text-gray-700 font-medium mb-3">&quot;Why didn&apos;t you recommend {DEMO_BRAND}?&quot;</p>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      &quot;{DEMO_BRAND} is a quality brand, but has <span className="bg-amber-100 px-1 rounded">less visibility in English-language sources</span> compared to Weleda. Their <span className="bg-amber-100 px-1 rounded">international presence</span> and <span className="bg-amber-100 px-1 rounded">user reviews coverage</span> are less comprehensive, making them harder to recommend confidently.&quot;
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-800 font-semibold text-sm">Recommended Actions:</p>
                      <ul className="text-blue-700 text-sm mt-2 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Increase English-language content
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Encourage more international reviews
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Strengthen presence on review platforms
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </MockBrowser>
          </div>
        );

      case 'cta':
        return (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in text-center px-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <span className="text-4xl font-bold text-white">Velaris</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {content.headline}
            </h2>
            <p className="text-xl text-gray-400 mb-10">{content.subheadline}</p>

            <button
              onClick={() => router.push('/analyze')}
              className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-xl hover:from-blue-500 hover:to-purple-500 transition-all flex items-center gap-3 mb-8 shadow-xl shadow-blue-500/30"
            >
              Check My AI Visibility
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center gap-8 text-gray-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Free to start
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Results in 5 minutes
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                No credit card
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Main viewport */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden relative">
          {/* Headline bar */}
          <div className="absolute top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-6 py-3 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-500" />
                <span className="text-white font-medium">Velaris Demo</span>
              </div>
              <span className="text-sm text-gray-400">
                Step {currentIndex + 1} of {steps.length}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="h-full pt-14 pb-2">
            {renderStep()}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-5xl mx-auto">
          {/* Navigation buttons */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous (← Arrow)"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleRestart}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Restart"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors"
              title={isPlaying ? 'Pause (P)' : 'Play (P)'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === steps.length - 1}
              className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next (→ Arrow)"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {steps.map((step, i) => {
              const isActive = step === currentStep;
              const isPast = currentIndex > i;

              return (
                <button
                  key={step}
                  onClick={() => handleSkipToStep(step)}
                  className={`h-2 rounded-full transition-all ${
                    isActive
                      ? 'bg-blue-500 w-8'
                      : isPast
                        ? 'bg-blue-500/50 w-2'
                        : 'bg-gray-600 hover:bg-gray-500 w-2'
                  }`}
                  title={step.replace(/-/g, ' ')}
                />
              );
            })}
          </div>

          {/* Keyboard hints */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span>← → Navigate</span>
            <span>Space Next</span>
            <span>P Play/Pause</span>
          </div>
        </div>
      </div>

      {/* Skip button */}
      <div className="fixed top-4 right-4">
        <button
          onClick={() => router.push('/analyze')}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-600 transition-colors flex items-center gap-2"
        >
          Skip to App
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
