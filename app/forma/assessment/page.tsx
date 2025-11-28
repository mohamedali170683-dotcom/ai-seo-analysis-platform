'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

type AssessmentStep = 'info' | 'website' | 'social' | 'ads' | 'loading';

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<AssessmentStep>('info');
  const [loading, setLoading] = useState(false);

  // Project Information
  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [industry, setIndustry] = useState('');

  // Website Assessment (0-33)
  const [websiteSocialProof, setWebsiteSocialProof] = useState(0);
  const [websiteAuthority, setWebsiteAuthority] = useState(0);
  const [websiteScarcity, setWebsiteScarcity] = useState(0);
  const [websiteReciprocity, setWebsiteReciprocity] = useState(0);
  const [websiteOptionPresentation, setWebsiteOptionPresentation] = useState(0);
  const [websiteDefaultSelections, setWebsiteDefaultSelections] = useState(0);
  const [websiteCtaDesign, setWebsiteCtaDesign] = useState(0);
  const [websitePricingDisplay, setWebsitePricingDisplay] = useState(0);
  const [websiteNavigationFlow, setWebsiteNavigationFlow] = useState(0);
  const [websiteDecisionStaging, setWebsiteDecisionStaging] = useState(0);
  const [websiteFrictionReduction, setWebsiteFrictionReduction] = useState(0);

  // Social Media Assessment (0-33)
  const [socialEmotionalTriggers, setSocialEmotionalTriggers] = useState(0);
  const [socialStorytellingQuality, setSocialStorytellingQuality] = useState(0);
  const [socialProofElements, setSocialProofElements] = useState(0);
  const [socialShareabilityFactors, setSocialShareabilityFactors] = useState(0);
  const [socialScarcityUrgency, setSocialScarcityUrgency] = useState(0);
  const [socialReciprocityElements, setSocialReciprocityElements] = useState(0);
  const [socialCommitmentDevices, setSocialCommitmentDevices] = useState(0);
  const [socialConsistencyPrinciple, setSocialConsistencyPrinciple] = useState(0);
  const [socialColorPsychology, setSocialColorPsychology] = useState(0);
  const [socialAttentionDirection, setSocialAttentionDirection] = useState(0);
  const [socialVisualHierarchy, setSocialVisualHierarchy] = useState(0);

  // Paid Advertising Assessment (0-34)
  const [adHeadlineFraming, setAdHeadlineFraming] = useState(0);
  const [adVisualHierarchy, setAdVisualHierarchy] = useState(0);
  const [adAttentionCapture, setAdAttentionCapture] = useState(0);
  const [adDescriptionPower, setAdDescriptionPower] = useState(0);
  const [adBiasApplication, setAdBiasApplication] = useState(0);
  const [adLossAversionFraming, setAdLossAversionFraming] = useState(0);
  const [adSocialProofIntegration, setAdSocialProofIntegration] = useState(0);
  const [adUrgencyScarcity, setAdUrgencyScarcity] = useState(0);
  const [adMessageConsistency, setAdMessageConsistency] = useState(0);
  const [adExpectationFulfillment, setAdExpectationFulfillment] = useState(0);
  const [adConversionPathOptimization, setAdConversionPathOptimization] = useState(0);

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/forma/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          websiteUrl,
          industry,
          website: {
            socialProof: websiteSocialProof,
            authority: websiteAuthority,
            scarcity: websiteScarcity,
            reciprocity: websiteReciprocity,
            optionPresentation: websiteOptionPresentation,
            defaultSelections: websiteDefaultSelections,
            ctaDesign: websiteCtaDesign,
            pricingDisplay: websitePricingDisplay,
            navigationFlow: websiteNavigationFlow,
            decisionStaging: websiteDecisionStaging,
            frictionReduction: websiteFrictionReduction,
          },
          social: {
            emotionalTriggers: socialEmotionalTriggers,
            storytellingQuality: socialStorytellingQuality,
            socialProofElements: socialProofElements,
            shareabilityFactors: socialShareabilityFactors,
            scarcityUrgency: socialScarcityUrgency,
            reciprocityElements: socialReciprocityElements,
            commitmentDevices: socialCommitmentDevices,
            consistencyPrinciple: socialConsistencyPrinciple,
            colorPsychology: socialColorPsychology,
            attentionDirection: socialAttentionDirection,
            visualHierarchy: socialVisualHierarchy,
          },
          ads: {
            headlineFraming: adHeadlineFraming,
            visualHierarchy: adVisualHierarchy,
            attentionCapture: adAttentionCapture,
            descriptionPower: adDescriptionPower,
            biasApplication: adBiasApplication,
            lossAversionFraming: adLossAversionFraming,
            socialProofIntegration: adSocialProofIntegration,
            urgencyScarcity: adUrgencyScarcity,
            messageConsistency: adMessageConsistency,
            expectationFulfillment: adExpectationFulfillment,
            conversionPathOptimization: adConversionPathOptimization,
          },
        }),
      });

      const data = await response.json();
      
      if (data.assessmentId) {
        router.push(`/forma/results/${data.assessmentId}`);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SliderInput = ({ 
    label, 
    value, 
    onChange, 
    max, 
    description 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
    max: number;
    description?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <label className="text-white font-medium">{label}</label>
          {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        </div>
        <span className="text-2xl font-bold text-purple-400 ml-4">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>None (0)</span>
        <span>Excellent ({max})</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/forma" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-gray-300" />
              <Brain className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">Forma</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-400">Assessment Progress</span>
            <span className="text-sm text-gray-400">
              {step === 'info' ? '1/4' : step === 'website' ? '2/4' : step === 'social' ? '3/4' : '4/4'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: step === 'info' ? '25%' : step === 'website' ? '50%' : step === 'social' ? '75%' : '100%',
              }}
            />
          </div>
        </div>

        {/* Step 1: Project Information */}
        {step === 'info' && (
          <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-6">Project Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Brand Name *</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Enter your brand name"
                  required
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Website URL</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., E-commerce, SaaS, Healthcare"
                />
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep('website')}
                disabled={!brandName}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <span>Next: Website Assessment</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Website Assessment */}
        {step === 'website' && (
          <div className="bg-gradient-to-br from-blue-900/40 to-transparent rounded-xl p-8 border border-blue-500/20 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-2">Website/Blog Assessment</h2>
            <p className="text-gray-300 mb-8">Rate each aspect from 0 (not implemented) to max (excellently implemented)</p>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-4">Bias Implementation (0-12 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Social Proof"
                    value={websiteSocialProof}
                    onChange={setWebsiteSocialProof}
                    max={3}
                    description="Testimonials, user counts, reviews, case studies"
                  />
                  <SliderInput
                    label="Authority"
                    value={websiteAuthority}
                    onChange={setWebsiteAuthority}
                    max={3}
                    description="Expert endorsements, certifications, credentials, media features"
                  />
                  <SliderInput
                    label="Scarcity"
                    value={websiteScarcity}
                    onChange={setWebsiteScarcity}
                    max={3}
                    description="Limited availability, low stock indicators, time-limited offers"
                  />
                  <SliderInput
                    label="Reciprocity"
                    value={websiteReciprocity}
                    onChange={setWebsiteReciprocity}
                    max={3}
                    description="Free resources, gifts, valuable content before asking"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-4">Choice Architecture (0-12 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Option Presentation"
                    value={websiteOptionPresentation}
                    onChange={setWebsiteOptionPresentation}
                    max={3}
                    description="Clear, simple choices that reduce decision paralysis"
                  />
                  <SliderInput
                    label="Default Selections"
                    value={websiteDefaultSelections}
                    onChange={setWebsiteDefaultSelections}
                    max={3}
                    description="Strategic defaults that guide users to optimal choices"
                  />
                  <SliderInput
                    label="CTA Design"
                    value={websiteCtaDesign}
                    onChange={setWebsiteCtaDesign}
                    max={3}
                    description="Action-oriented, benefit-focused, visually prominent buttons"
                  />
                  <SliderInput
                    label="Pricing Display"
                    value={websitePricingDisplay}
                    onChange={setWebsitePricingDisplay}
                    max={3}
                    description="Anchoring, decoy options, value framing"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-4">Journey Optimization (0-9 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Navigation Flow"
                    value={websiteNavigationFlow}
                    onChange={setWebsiteNavigationFlow}
                    max={3}
                    description="Intuitive, logical progression through site"
                  />
                  <SliderInput
                    label="Decision Staging"
                    value={websiteDecisionStaging}
                    onChange={setWebsiteDecisionStaging}
                    max={3}
                    description="Progressive disclosure, breaking complex decisions into steps"
                  />
                  <SliderInput
                    label="Friction Reduction"
                    value={websiteFrictionReduction}
                    onChange={setWebsiteFrictionReduction}
                    max={3}
                    description="Minimal form fields, fast loading, easy checkout"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep('info')}
                className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep('social')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <span>Next: Social Media</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Social Media Assessment */}
        {step === 'social' && (
          <div className="bg-gradient-to-br from-purple-900/40 to-transparent rounded-xl p-8 border border-purple-500/20 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-2">Social Media Assessment</h2>
            <p className="text-gray-300 mb-8">Evaluate your social media presence and content strategy</p>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-4">Content Engagement (0-12 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Emotional Triggers"
                    value={socialEmotionalTriggers}
                    onChange={setSocialEmotionalTriggers}
                    max={3}
                    description="Content that evokes specific emotions aligned with audience psychology"
                  />
                  <SliderInput
                    label="Storytelling Quality"
                    value={socialStorytellingQuality}
                    onChange={setSocialStorytellingQuality}
                    max={3}
                    description="Narrative structure, character development, conflict resolution"
                  />
                  <SliderInput
                    label="Social Proof Elements"
                    value={socialProofElements}
                    onChange={setSocialProofElements}
                    max={3}
                    description="User-generated content, testimonials, community showcases"
                  />
                  <SliderInput
                    label="Shareability Factors"
                    value={socialShareabilityFactors}
                    onChange={setSocialShareabilityFactors}
                    max={3}
                    description="Practical value, social currency, triggers for sharing"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-4">Behavioral Triggers (0-12 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Scarcity & Urgency"
                    value={socialScarcityUrgency}
                    onChange={setSocialScarcityUrgency}
                    max={3}
                    description="Limited-time offers, countdown timers, exclusive content"
                  />
                  <SliderInput
                    label="Reciprocity Elements"
                    value={socialReciprocityElements}
                    onChange={setSocialReciprocityElements}
                    max={3}
                    description="Giving value first, tips, free content, contests"
                  />
                  <SliderInput
                    label="Commitment Devices"
                    value={socialCommitmentDevices}
                    onChange={setSocialCommitmentDevices}
                    max={3}
                    description="Challenges, pledges, public commitments, progressive steps"
                  />
                  <SliderInput
                    label="Consistency Principle"
                    value={socialConsistencyPrinciple}
                    onChange={setSocialConsistencyPrinciple}
                    max={3}
                    description="Building on previous actions, follow-up sequences"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-purple-400 mb-4">Visual Psychology (0-9 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Color Psychology"
                    value={socialColorPsychology}
                    onChange={setSocialColorPsychology}
                    max={3}
                    description="Strategic use of colors to evoke specific emotions and actions"
                  />
                  <SliderInput
                    label="Attention Direction"
                    value={socialAttentionDirection}
                    onChange={setSocialAttentionDirection}
                    max={3}
                    description="Visual cues, arrows, gaze direction, highlighting important elements"
                  />
                  <SliderInput
                    label="Visual Hierarchy"
                    value={socialVisualHierarchy}
                    onChange={setSocialVisualHierarchy}
                    max={3}
                    description="Clear information structure, size, contrast, positioning"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep('website')}
                className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep('ads')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <span>Next: Paid Advertising</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Paid Advertising Assessment */}
        {step === 'ads' && (
          <div className="bg-gradient-to-br from-pink-900/40 to-transparent rounded-xl p-8 border border-pink-500/20 backdrop-blur-sm">
            <h2 className="text-3xl font-bold text-white mb-2">Paid Advertising Assessment</h2>
            <p className="text-gray-300 mb-8">Evaluate your paid advertising campaigns and landing pages</p>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-pink-400 mb-4">Creative Effectiveness (0-12 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Headline Framing"
                    value={adHeadlineFraming}
                    onChange={setAdHeadlineFraming}
                    max={3}
                    description="Benefit-oriented, uses loss aversion or gain framing"
                  />
                  <SliderInput
                    label="Visual Hierarchy"
                    value={adVisualHierarchy}
                    onChange={setAdVisualHierarchy}
                    max={3}
                    description="Clear visual flow, emphasis on key elements"
                  />
                  <SliderInput
                    label="Attention Capture"
                    value={adAttentionCapture}
                    onChange={setAdAttentionCapture}
                    max={3}
                    description="Pattern interrupts, contrast, novelty, emotional hooks"
                  />
                  <SliderInput
                    label="Description Power"
                    value={adDescriptionPower}
                    onChange={setAdDescriptionPower}
                    max={3}
                    description="Clear benefits, overcoming objections, calls to action"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-pink-400 mb-4">Persuasion Architecture (0-12 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Bias Application"
                    value={adBiasApplication}
                    onChange={setAdBiasApplication}
                    max={3}
                    description="Systematic use of cognitive biases in ad copy"
                  />
                  <SliderInput
                    label="Loss Aversion Framing"
                    value={adLossAversionFraming}
                    onChange={setAdLossAversionFraming}
                    max={3}
                    description="Highlighting what users might miss or lose"
                  />
                  <SliderInput
                    label="Social Proof Integration"
                    value={adSocialProofIntegration}
                    onChange={setAdSocialProofIntegration}
                    max={3}
                    description="Customer counts, ratings, testimonials in ads"
                  />
                  <SliderInput
                    label="Urgency & Scarcity"
                    value={adUrgencyScarcity}
                    onChange={setAdUrgencyScarcity}
                    max={3}
                    description="Time-sensitive offers, limited availability messaging"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-pink-400 mb-4">Landing Page Alignment (0-10 points)</h3>
                <div className="space-y-6">
                  <SliderInput
                    label="Message Consistency"
                    value={adMessageConsistency}
                    onChange={setAdMessageConsistency}
                    max={3}
                    description="Ad promise matches landing page headline and content"
                  />
                  <SliderInput
                    label="Expectation Fulfillment"
                    value={adExpectationFulfillment}
                    onChange={setAdExpectationFulfillment}
                    max={4}
                    description="Landing page delivers on ad claims immediately"
                  />
                  <SliderInput
                    label="Conversion Path Optimization"
                    value={adConversionPathOptimization}
                    onChange={setAdConversionPathOptimization}
                    max={3}
                    description="Clear next steps, minimal friction, strong CTAs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep('social')}
                className="border-2 border-gray-600 text-gray-300 hover:bg-gray-800 px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Calculating...</span>
                  </>
                ) : (
                  <>
                    <span>Calculate BSOS Score</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
