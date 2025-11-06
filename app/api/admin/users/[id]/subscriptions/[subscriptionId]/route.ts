import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminApiMiddleware } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

/**
 * Update subscription status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subscriptionId: string }> }
) {
  const middlewareResponse = await adminApiMiddleware(request)
  if (middlewareResponse) {
    return middlewareResponse
  }

  try {
    const { status } = await request.json() as { status?: string }
    const { id, subscriptionId } = await params

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.userId !== id) {
      return NextResponse.json(
        { error: 'Subscription does not belong to this user' },
        { status: 403 }
      )
    }

    // Update subscription
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: status || subscription.status,
        ...(status === 'cancelled' ? { cancelledAt: new Date() } : {}),
      },
      include: {
        package: true,
      },
    })

    return NextResponse.json({
      success: true,
      subscription: updated,
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Cancel subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subscriptionId: string }> }
) {
  const middlewareResponse = await adminApiMiddleware(request)
  if (middlewareResponse) {
    return middlewareResponse
  }

  try {
    const { id, subscriptionId } = await params

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.userId !== id) {
      return NextResponse.json(
        { error: 'Subscription does not belong to this user' },
        { status: 403 }
      )
    }

    // Cancel subscription
    const cancelled = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        cancelAtPeriodEnd: true,
        cancelledAt: new Date(),
      },
      include: {
        package: true,
      },
    })

    return NextResponse.json({
      success: true,
      subscription: cancelled,
    })
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return NextResponse.json(
      {
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

