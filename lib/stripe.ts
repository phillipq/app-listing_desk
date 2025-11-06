import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    })
  : null

export type PlanType = 'realtor_pro' | 'realtor_pro_comm' | 'business_pro' | 'business_pro_comm'
export type UserType = 'realtor' | 'business_owner'

export interface SubscriptionPlan {
  name: string
  price: number
  currency: string
  interval: string
  features: string[]
  stripePriceId: string
  userType: UserType
  includesCommunications: boolean
}

export const subscriptionPlans: Record<PlanType, SubscriptionPlan> = {
  realtor_pro: {
    name: 'Realtor Pro',
    price: 199.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited property listings',
      'Location insights & analysis',
      'Showing tour planner',
      'AI-powered lead generation',
      'Advanced analytics',
      'Priority support'
    ],
    stripePriceId: process.env.STRIPE_REL_PRO || '',
    userType: 'realtor',
    includesCommunications: false,
  },
  realtor_pro_comm: {
    name: 'Realtor Pro + Communications',
    price: 249.00,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Realtor Pro',
      'Social Media Hub',
      'Communication Hub',
      'WhatsApp integration',
      'Instagram integration',
      'SMS & Voicemail',
      'Multi-channel messaging'
    ],
    stripePriceId: process.env.STRIPE_REL_PRO_COMM || '',
    userType: 'realtor',
    includesCommunications: true,
  },
  business_pro: {
    name: 'Business Pro',
    price: 99.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Customer management',
      'Service management',
      'Appointment scheduling',
      'AI-powered chatbot',
      'Lead generation',
      'Basic analytics',
      'Email support'
    ],
    stripePriceId: process.env.STRIPE_BUS_PRO || '',
    userType: 'business_owner',
    includesCommunications: false,
  },
  business_pro_comm: {
    name: 'Business Pro + Communications',
    price: 149.99,
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Business Pro',
      'Social Media Hub',
      'Communication Hub',
      'WhatsApp integration',
      'Instagram integration',
      'SMS & Voicemail',
      'Multi-channel messaging'
    ],
    stripePriceId: process.env.STRIPE_BUS_PRO_COMM || '',
    userType: 'business_owner',
    includesCommunications: true,
  }
}
