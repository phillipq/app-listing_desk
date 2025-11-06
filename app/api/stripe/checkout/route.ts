import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { stripe, subscriptionPlans } from '../../../../lib/stripe'

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as { plan?: string }
    const { plan } = body
    
    if (!plan || !subscriptionPlans[plan as keyof typeof subscriptionPlans]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    const selectedPlan = subscriptionPlans[plan as keyof typeof subscriptionPlans]
    
    // Get or create Stripe customer
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, subscriptionStatus: true }
    })

    if (!realtor) {
      return NextResponse.json(
        { error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // Get the package from database to get the actual Stripe price ID
    const packageRecord = await prisma.package.findFirst({
      where: { slug: plan, isActive: true }
    })

    if (!packageRecord) {
      return NextResponse.json(
        { error: 'Package not found. Please contact support.' },
        { status: 404 }
      )
    }

    // Use database price ID if available, otherwise fall back to env variable
    const stripePriceId = packageRecord.stripePriceId || selectedPlan.stripePriceId

    if (!stripePriceId) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured for this package. Please contact support.' },
        { status: 500 }
      )
    }

    // Check if user is on trial (new signup - subscriptionStatus is 'trial')
    const isTrialUser = realtor.subscriptionStatus === 'trial' || 
                       realtor.subscriptionStatus === 'inactive'
    
    // Create Stripe checkout session with 7-day trial for new users
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: realtor.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: isTrialUser ? {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel'
          }
        }
      } : undefined,
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        realtorId: session.user.id,
        plan: plan,
        isTrial: isTrialUser ? 'true' : 'false',
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url
    })

  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
