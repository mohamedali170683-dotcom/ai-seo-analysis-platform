/**
 * Behavioral Science Optimization Score (BSOS) Calculator
 * 
 * Calculates a 0-100 score based on:
 * - Website/Blog: 0-33 points
 * - Social Media: 0-33 points
 * - Paid Advertising: 0-34 points
 */

export interface WebsiteAssessment {
  // Bias Implementation (0-12)
  socialProof: number; // 0-3
  authority: number; // 0-3
  scarcity: number; // 0-3
  reciprocity: number; // 0-3
  
  // Choice Architecture (0-12)
  optionPresentation: number; // 0-3
  defaultSelections: number; // 0-3
  ctaDesign: number; // 0-3
  pricingDisplay: number; // 0-3
  
  // Journey Optimization (0-9)
  navigationFlow: number; // 0-3
  decisionStaging: number; // 0-3
  frictionReduction: number; // 0-3
}

export interface SocialMediaAssessment {
  // Content Engagement (0-12)
  emotionalTriggers: number; // 0-3
  storytellingQuality: number; // 0-3
  socialProofElements: number; // 0-3
  shareabilityFactors: number; // 0-3
  
  // Behavioral Triggers (0-12)
  scarcityUrgency: number; // 0-3
  reciprocityElements: number; // 0-3
  commitmentDevices: number; // 0-3
  consistencyPrinciple: number; // 0-3
  
  // Visual Psychology (0-9)
  colorPsychology: number; // 0-3
  attentionDirection: number; // 0-3
  visualHierarchy: number; // 0-3
}

export interface PaidAdvertisingAssessment {
  // Creative Effectiveness (0-12)
  headlineFraming: number; // 0-3
  visualHierarchy: number; // 0-3
  attentionCapture: number; // 0-3
  descriptionPower: number; // 0-3
  
  // Persuasion Architecture (0-12)
  biasApplication: number; // 0-3
  lossAversionFraming: number; // 0-3
  socialProofIntegration: number; // 0-3
  urgencyScarcity: number; // 0-3
  
  // Landing Page Alignment (0-10)
  messageConsistency: number; // 0-3
  expectationFulfillment: number; // 0-4
  conversionPathOptimization: number; // 0-3
}

export interface BSOSResult {
  overall: number;
  interpretation: string;
  components: {
    website: {
      total: number;
      biasImplementation: number;
      choiceArchitecture: number;
      journeyOptimization: number;
    };
    socialMedia: {
      total: number;
      contentEngagement: number;
      behavioralTriggers: number;
      visualPsychology: number;
    };
    paidAdvertising: {
      total: number;
      creativeEffectiveness: number;
      persuasionArchitecture: number;
      landingPageAlignment: number;
    };
  };
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export class BSOSCalculator {
  /**
   * Calculate Website/Blog Component Score (0-33)
   */
  static calculateWebsiteScore(assessment: WebsiteAssessment): number {
    const biasScore = 
      assessment.socialProof +
      assessment.authority +
      assessment.scarcity +
      assessment.reciprocity;
    
    const choiceScore = 
      assessment.optionPresentation +
      assessment.defaultSelections +
      assessment.ctaDesign +
      assessment.pricingDisplay;
    
    const journeyScore = 
      assessment.navigationFlow +
      assessment.decisionStaging +
      assessment.frictionReduction;
    
    return biasScore + choiceScore + journeyScore;
  }

  /**
   * Calculate Social Media Component Score (0-33)
   */
  static calculateSocialScore(assessment: SocialMediaAssessment): number {
    const contentScore = 
      assessment.emotionalTriggers +
      assessment.storytellingQuality +
      assessment.socialProofElements +
      assessment.shareabilityFactors;
    
    const triggersScore = 
      assessment.scarcityUrgency +
      assessment.reciprocityElements +
      assessment.commitmentDevices +
      assessment.consistencyPrinciple;
    
    const visualScore = 
      assessment.colorPsychology +
      assessment.attentionDirection +
      assessment.visualHierarchy;
    
    return contentScore + triggersScore + visualScore;
  }

  /**
   * Calculate Paid Advertising Component Score (0-34)
   */
  static calculateAdScore(assessment: PaidAdvertisingAssessment): number {
    const creativeScore = 
      assessment.headlineFraming +
      assessment.visualHierarchy +
      assessment.attentionCapture +
      assessment.descriptionPower;
    
    const persuasionScore = 
      assessment.biasApplication +
      assessment.lossAversionFraming +
      assessment.socialProofIntegration +
      assessment.urgencyScarcity;
    
    const landingScore = 
      assessment.messageConsistency +
      assessment.expectationFulfillment +
      assessment.conversionPathOptimization;
    
    return creativeScore + persuasionScore + landingScore;
  }

  /**
   * Calculate complete BSOS with all components
   */
  static calculateBSOS(
    website: WebsiteAssessment,
    social: SocialMediaAssessment,
    ads: PaidAdvertisingAssessment
  ): BSOSResult {
    // Calculate component scores
    const websiteBias = website.socialProof + website.authority + website.scarcity + website.reciprocity;
    const websiteChoice = website.optionPresentation + website.defaultSelections + website.ctaDesign + website.pricingDisplay;
    const websiteJourney = website.navigationFlow + website.decisionStaging + website.frictionReduction;
    const websiteTotal = this.calculateWebsiteScore(website);

    const socialContent = social.emotionalTriggers + social.storytellingQuality + social.socialProofElements + social.shareabilityFactors;
    const socialTriggers = social.scarcityUrgency + social.reciprocityElements + social.commitmentDevices + social.consistencyPrinciple;
    const socialVisual = social.colorPsychology + social.attentionDirection + social.visualHierarchy;
    const socialTotal = this.calculateSocialScore(social);

    const adCreative = ads.headlineFraming + ads.visualHierarchy + ads.attentionCapture + ads.descriptionPower;
    const adPersuasion = ads.biasApplication + ads.lossAversionFraming + ads.socialProofIntegration + ads.urgencyScarcity;
    const adLanding = ads.messageConsistency + ads.expectationFulfillment + ads.conversionPathOptimization;
    const adTotal = this.calculateAdScore(ads);

    const overallScore = websiteTotal + socialTotal + adTotal;

    // Generate interpretation
    const interpretation = this.getInterpretation(overallScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      { websiteBias, websiteChoice, websiteJourney },
      { socialContent, socialTriggers, socialVisual },
      { adCreative, adPersuasion, adLanding }
    );

    return {
      overall: overallScore,
      interpretation,
      components: {
        website: {
          total: websiteTotal,
          biasImplementation: websiteBias,
          choiceArchitecture: websiteChoice,
          journeyOptimization: websiteJourney,
        },
        socialMedia: {
          total: socialTotal,
          contentEngagement: socialContent,
          behavioralTriggers: socialTriggers,
          visualPsychology: socialVisual,
        },
        paidAdvertising: {
          total: adTotal,
          creativeEffectiveness: adCreative,
          persuasionArchitecture: adPersuasion,
          landingPageAlignment: adLanding,
        },
      },
      recommendations,
    };
  }

  /**
   * Get interpretation based on overall score
   */
  private static getInterpretation(score: number): string {
    if (score >= 75) {
      return 'Sophisticated behavioral design with systematic optimization. Your brand demonstrates advanced application of behavioral science principles.';
    } else if (score >= 50) {
      return 'Moderate application with significant opportunities. You have a solid foundation but substantial room for optimization.';
    } else if (score >= 25) {
      return 'Limited behavioral science application with heavy reliance on aesthetics. Major opportunities exist for systematic improvement.';
    } else {
      return 'Minimal application with substantial untapped potential. Implementing behavioral science principles could dramatically improve conversion rates.';
    }
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    website: { websiteBias: number; websiteChoice: number; websiteJourney: number },
    social: { socialContent: number; socialTriggers: number; socialVisual: number },
    ads: { adCreative: number; adPersuasion: number; adLanding: number }
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Website recommendations
    if (website.websiteBias < 8) {
      recommendations.push({
        category: 'Website',
        priority: 'high',
        title: 'Implement Cognitive Bias Triggers',
        description: 'Add social proof (testimonials, user counts), authority signals (certifications, expert endorsements), scarcity indicators (limited availability), and reciprocity elements (free value, gifts).',
        expectedImpact: '+15-30% conversion rate',
        effort: 'medium',
        timeline: '2-4 weeks',
      });
    }

    if (website.websiteChoice < 8) {
      recommendations.push({
        category: 'Website',
        priority: 'high',
        title: 'Optimize Choice Architecture',
        description: 'Redesign option presentation to reduce decision paralysis, implement strategic defaults, enhance CTA design with behavioral triggers, and optimize pricing display using anchoring effects.',
        expectedImpact: '+20-35% conversion rate',
        effort: 'medium',
        timeline: '3-6 weeks',
      });
    }

    if (website.websiteJourney < 6) {
      recommendations.push({
        category: 'Website',
        priority: 'medium',
        title: 'Streamline User Journey',
        description: 'Map and optimize navigation flow, implement progressive disclosure for complex decisions, reduce friction points, and add strategic exit-prevention triggers.',
        expectedImpact: '+10-20% task completion',
        effort: 'high',
        timeline: '4-8 weeks',
      });
    }

    // Social Media recommendations
    if (social.socialContent < 8) {
      recommendations.push({
        category: 'Social Media',
        priority: 'high',
        title: 'Enhance Content Engagement',
        description: 'Incorporate emotional triggers aligned with target audience psychology, improve storytelling structure, integrate social proof elements, and optimize for shareability.',
        expectedImpact: '+25-50% engagement rate',
        effort: 'low',
        timeline: '1-2 weeks',
      });
    }

    if (social.socialTriggers < 8) {
      recommendations.push({
        category: 'Social Media',
        priority: 'medium',
        title: 'Implement Behavioral Triggers',
        description: 'Add scarcity and urgency messaging, create reciprocity loops, design commitment devices, and leverage consistency principle in campaign sequences.',
        expectedImpact: '+15-30% conversion',
        effort: 'low',
        timeline: '2-3 weeks',
      });
    }

    if (social.socialVisual < 6) {
      recommendations.push({
        category: 'Social Media',
        priority: 'low',
        title: 'Apply Visual Psychology',
        description: 'Use color psychology strategically, design attention-directing visual elements, and establish clear visual hierarchy in all assets.',
        expectedImpact: '+10-20% engagement',
        effort: 'low',
        timeline: '1-2 weeks',
      });
    }

    // Paid Advertising recommendations
    if (ads.adCreative < 8) {
      recommendations.push({
        category: 'Paid Advertising',
        priority: 'high',
        title: 'Strengthen Creative Effectiveness',
        description: 'Reframe headlines using loss aversion and gain framing, optimize visual hierarchy for attention capture, enhance description copy with benefit-oriented language.',
        expectedImpact: '+20-40% CTR',
        effort: 'low',
        timeline: '1 week',
      });
    }

    if (ads.adPersuasion < 8) {
      recommendations.push({
        category: 'Paid Advertising',
        priority: 'high',
        title: 'Build Persuasion Architecture',
        description: 'Systematically apply cognitive biases in ad copy, implement loss aversion framing, integrate social proof signals, and create urgency/scarcity messaging.',
        expectedImpact: '+25-45% conversion',
        effort: 'low',
        timeline: '1-2 weeks',
      });
    }

    if (ads.adLanding < 7) {
      recommendations.push({
        category: 'Paid Advertising',
        priority: 'high',
        title: 'Align Landing Page Experience',
        description: 'Ensure message consistency from ad to landing page, fulfill expectations set in ad copy, optimize conversion path to reduce drop-off.',
        expectedImpact: '+30-60% conversion',
        effort: 'medium',
        timeline: '2-4 weeks',
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 6); // Return top 6 recommendations
  }

  /**
   * Validate assessment values
   */
  static validateAssessment(assessment: any, maxValues: Record<string, number>): boolean {
    for (const [key, value] of Object.entries(assessment)) {
      const numValue = Number(value);
      const maxValue = maxValues[key];
      
      if (isNaN(numValue) || numValue < 0 || numValue > maxValue) {
        return false;
      }
    }
    return true;
  }
}
