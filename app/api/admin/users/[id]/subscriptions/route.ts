import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminApiMiddleware } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

/**
 * Create a new subscription for a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const middlewareResponse = await adminApiMiddleware(request)
  if (middlewareResponse) {
    return middlewareResponse
  }

  try {
    const { packageId, stripeSubscriptionId, stripeCustomerId, status } = await request.json() as {
      packageId: string
      stripeSubscriptionId?: string
      stripeCustomerId?: string
      status?: string
    }

    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      )
    }

    const { id } = await params

    // Verify user exists
    const user = await prisma.realtor.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify package exists
    const packageRecord = await prisma.package.findUnique({
      where: { id: packageId }
    })

    if (!packageRecord) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Create subscription
    // Calculate period dates (default to 1 month from now)
    const now = new Date()
    const currentPeriodStart = now
    const currentPeriodEnd = new Date(now)
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

    // If stripeSubscriptionId is provided, use it, otherwise generate a placeholder
    const finalStripeSubscriptionId = stripeSubscriptionId || `sub_admin_${Date.now()}`
    const finalStripeCustomerId = stripeCustomerId || user.stripeCustomerId || `cus_admin_${Date.now()}`
    const finalStatus = status || 'active'

    // Check if subscription with this Stripe ID already exists
    if (stripeSubscriptionId) {
      const existing = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: finalStripeSubscriptionId }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Subscription with this Stripe ID already exists' },
          { status: 400 }
        )
      }
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: id,
        packageId,
        stripeSubscriptionId: finalStripeSubscriptionId,
        stripeCustomerId: finalStripeCustomerId,
        status: finalStatus,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      include: {
        package: true,
      },
    })

    return NextResponse.json({
      success: true,
      subscription,
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to create subscription',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

