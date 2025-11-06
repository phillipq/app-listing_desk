import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/create-trial-subscription
 * Creates a trial subscription when Stripe checkout fails
 * This allows users to see the correct tools even if payment setup fails
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { plan } = await request.json() as { plan?: string }

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      )
    }

    // Find the package
    const packageRecord = await prisma.package.findFirst({
      where: { slug: plan, isActive: true }
    })

    if (!packageRecord) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Find the realtor
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true }
    })

    if (!realtor) {
      return NextResponse.json(
        { error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: realtor.id,
        packageId: packageRecord.id,
        status: { in: ['active', 'trialing'] }
      }
    })

    if (existingSubscription) {
      return NextResponse.json({
        success: true,
        message: 'Subscription already exists'
      })
    }

    // Create a trial subscription (7 days trial to match Stripe checkout)
    const now = new Date()
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + 7) // 7-day trial

    await prisma.subscription.create({
      data: {
        userId: realtor.id,
        packageId: packageRecord.id,
        stripeSubscriptionId: `trial_${Date.now()}`,
        stripeCustomerId: `trial_cus_${Date.now()}`,
        status: 'trialing',
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false
      }
    })

    // Update realtor subscription status
    await prisma.realtor.update({
      where: { id: realtor.id },
      data: {
        subscriptionStatus: 'trial'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Trial subscription created'
    })
  } catch (error) {
    console.error('Error creating trial subscription:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create trial subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

