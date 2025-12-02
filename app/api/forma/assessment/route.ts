import { NextRequest, NextResponse } from 'next/server';
import { BSOSCalculator } from '@/lib/services/bsos-calculator';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, websiteUrl, industry, website, social, ads } = body;

    // Validate required fields
    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    // Calculate BSOS
    const result = BSOSCalculator.calculateBSOS(website, social, ads);

    // Create or get user (simplified for demo)
    let user = await prisma.user.findFirst({
      where: { email: 'demo@forma.app' }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email: 'demo@forma.app' }
      });
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        brandName,
        websiteUrl: websiteUrl || null,
        industry: industry || null,
      },
    });

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        projectId: project.id,
        
        // Overall BSOS
        bsosScore: result.overall,
        
        // Website Component
        websiteScore: result.components.website.total,
        websiteBiasScore: result.components.website.biasImplementation,
        websiteChoiceScore: result.components.website.choiceArchitecture,
        websiteJourneyScore: result.components.website.journeyOptimization,
        
        // Social Media Component
        socialScore: result.components.socialMedia.total,
        socialContentScore: result.components.socialMedia.contentEngagement,
        socialTriggersScore: result.components.socialMedia.behavioralTriggers,
        socialVisualScore: result.components.socialMedia.visualPsychology,
        
        // Paid Advertising Component
        adScore: result.components.paidAdvertising.total,
        adCreativeScore: result.components.paidAdvertising.creativeEffectiveness,
        adPersuasionScore: result.components.paidAdvertising.persuasionArchitecture,
        adLandingScore: result.components.paidAdvertising.landingPageAlignment,
        
        // Raw Data
        websiteData: website,
        socialData: social,
        adData: ads,
        
        // Recommendations
        recommendations: result.recommendations as any,
        
        // Status
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      bsosScore: result.overall,
      interpretation: result.interpretation,
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all assessments (for demo purposes)
    const assessments = await prisma.assessment.findMany({
      include: {
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
