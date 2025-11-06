import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '../../../../lib/prisma'
import { stripe } from '../../../../lib/stripe'

export async function POST(request: NextRequest) {
  // Check if Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 503 }
    )
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        const realtorId = session.metadata?.realtorId
        const plan = session.metadata?.plan

        if (realtorId && plan && session.customer && session.subscription) {
          // Get subscription details to check trial status
          const stripeSubscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          // Determine subscription status based on trial
          const subscriptionStatus = stripeSubscription.status === 'trialing' 
            ? 'trial' 
            : stripeSubscription.status === 'active' 
              ? 'active' 
              : 'inactive'

          // Update Realtor fields
          await prisma.realtor.update({
            where: { id: realtorId },
            data: {
              subscriptionStatus: subscriptionStatus,
              stripeCustomerId: session.customer as string
            }
          })

          // Find package by slug (assuming plan name matches package slug)
          const packageRecord = await prisma.package.findFirst({
            where: { slug: plan, isActive: true }
          })

          if (packageRecord && session.subscription) {
            // Get full subscription details from Stripe
            const stripeSubscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            )

            // Create or update Subscription record
            await prisma.subscription.upsert({
              where: { stripeSubscriptionId: session.subscription as string },
              update: {
                status: stripeSubscription.status,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                cancelledAt: stripeSubscription.canceled_at 
                  ? new Date(stripeSubscription.canceled_at * 1000) 
                  : null
              },
              create: {
                userId: realtorId,
                packageId: packageRecord.id,
                stripeSubscriptionId: session.subscription as string,
                stripeCustomerId: session.customer as string,
                status: stripeSubscription.status, // 'trialing' or 'active'
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
              }
            })
          }
        }
        break

      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find realtor by stripeCustomerId
        const realtor = await prisma.realtor.findFirst({
          where: {
            stripeCustomerId: customerId
          }
        })

        if (realtor && subscription.id) {
          // Map Stripe subscription status to our status
          let subscriptionStatus = 'inactive'
          if (subscription.status === 'trialing') {
            subscriptionStatus = 'trial'
          } else if (subscription.status === 'active') {
            subscriptionStatus = 'active'
          } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            subscriptionStatus = 'expired'
          }

          // Update Realtor subscription status
          await prisma.realtor.update({
            where: { id: realtor.id },
            data: {
              subscriptionStatus: subscriptionStatus
            }
          })

          // Update Subscription record
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              cancelledAt: subscription.canceled_at 
                ? new Date(subscription.canceled_at * 1000) 
                : null
            }
          })
        }
        break

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription
        const deletedCustomerId = deletedSubscription.customer as string

        // Find realtor by stripeCustomerId
        const deletedRealtor = await prisma.realtor.findFirst({
          where: {
            stripeCustomerId: deletedCustomerId
          }
        })

        if (deletedRealtor && deletedSubscription.id) {
          // Update Realtor subscription status
          await prisma.realtor.update({
            where: { id: deletedRealtor.id },
            data: {
              subscriptionStatus: 'inactive'
            }
          })

          // Update Subscription record
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: deletedSubscription.id },
            data: {
              status: 'canceled',
              cancelledAt: new Date()
            }
          })
        }
        break

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice
        const invoiceCustomerId = invoice.customer as string

        // Find realtor by stripeCustomerId
        const invoiceRealtor = await prisma.realtor.findFirst({
          where: {
            stripeCustomerId: invoiceCustomerId
          }
        })

        if (invoiceRealtor && invoice.subscription) {
          // When payment succeeds, subscription should be active (trial ended)
          await prisma.realtor.update({
            where: { id: invoiceRealtor.id },
            data: {
              subscriptionStatus: 'active'
            }
          })

          // Update subscription status
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              status: 'active'
            }
          })
        }
        break

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice
        const failedCustomerId = failedInvoice.customer as string

        // Find realtor by stripeCustomerId
        const failedRealtor = await prisma.realtor.findFirst({
          where: {
            stripeCustomerId: failedCustomerId
          }
        })

        if (failedRealtor && failedInvoice.subscription) {
          // When payment fails, mark as expired
          await prisma.realtor.update({
            where: { id: failedRealtor.id },
            data: {
              subscriptionStatus: 'expired'
            }
          })

          // Update subscription status
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: failedInvoice.subscription as string },
            data: {
              status: 'past_due'
            }
          })
        }
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
