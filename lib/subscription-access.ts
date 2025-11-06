/**
 * Subscription Access Utilities
 * Check user's subscription plan and features
 */

import { prisma } from '@/lib/prisma'
import { subscriptionPlans } from '@/lib/stripe'

// Type guard to ensure planType is a valid key
type PlanType = 'realtor_pro' | 'realtor_pro_comm' | 'business_pro' | 'business_pro_comm'

function isValidPlanType(planType: string | null): planType is PlanType {
  return planType !== null && (planType === 'realtor_pro' || planType === 'realtor_pro_comm' || planType === 'business_pro' || planType === 'business_pro_comm')
}

/**
 * Get user's current plan type from their active subscription or user packages
 * userId can be either NextAuth User.id or Realtor.id
 * If it's a NextAuth User.id, we'll find the Realtor by email
 */
export async function getUserPlanType(userId: string, userEmail?: string): Promise<PlanType | null> {
  try {
    console.log('[getUserPlanType] Called with userId:', userId, 'userEmail:', userEmail)
    // First, find the Realtor record
    // userId might be NextAuth User.id, so we need to find Realtor by email
    let realtorId: string | null = null
    
    if (userEmail) {
      const realtor = await prisma.realtor.findUnique({
        where: { email: userEmail },
        select: { id: true }
      })
      realtorId = realtor?.id || null
      console.log('[getUserPlanType] Found realtor by email:', realtorId)
    } else {
      // Try userId as Realtor.id directly
      const realtor = await prisma.realtor.findUnique({
        where: { id: userId },
        select: { id: true }
      })
      realtorId = realtor?.id || null
      console.log('[getUserPlanType] Found realtor by userId:', realtorId)
    }

    if (!realtorId) {
      console.log('[getUserPlanType] No Realtor found for userId:', userId, 'email:', userEmail)
      return null
    }

    // First, try to find active subscription
    console.log('[getUserPlanType] Looking for subscription with realtorId:', realtorId)
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: realtorId,
        status: {
          in: ['active', 'trialing']
        }
      },
      include: {
        package: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('[getUserPlanType] Subscription found:', subscription ? {
      id: subscription.id,
      packageSlug: subscription.package.slug,
      packageName: subscription.package.name,
      status: subscription.status
    } : 'none')

    if (subscription) {
      // Try to match package slug to plan type
      const packageSlug = subscription.package.slug
      
      // Check if slug matches any plan type
      const planTypes: PlanType[] = ['realtor_pro', 'realtor_pro_comm', 'business_pro', 'business_pro_comm']
      if (packageSlug && planTypes.includes(packageSlug as PlanType)) {
        console.log('[getUserPlanType] Found plan type from subscription:', packageSlug)
        return packageSlug as PlanType
      } else {
        console.log('[getUserPlanType] Package slug does not match plan types. Slug:', packageSlug)
      }
    }

    // If no subscription found, check user packages (for admin-assigned packages)
    const userPackages = await prisma.userPackage.findMany({
      where: {
        userId: realtorId,
        status: 'active'
      },
      include: {
        package: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Find the base package (should only be one)
    const basePackage = userPackages.find(up => up.package.type === 'base')
    if (basePackage) {
      const packageSlug = basePackage.package.slug
      const planTypes: PlanType[] = ['realtor_pro', 'realtor_pro_comm', 'business_pro', 'business_pro_comm']
      if (packageSlug && planTypes.includes(packageSlug as PlanType)) {
        console.log('Found plan type from user package:', packageSlug)
        return packageSlug as PlanType
      }
    }
    
    console.log('No matching plan type found for realtorId:', realtorId)
    return null
  } catch (error) {
    console.error('Error getting user plan type:', error)
    return null
  }
}

/**
 * Check if user has communications features
 */
export async function hasCommunicationsAccess(userId: string, userEmail?: string): Promise<boolean> {
  const planType = await getUserPlanType(userId, userEmail)
  
  if (!planType || !isValidPlanType(planType)) {
    return false
  }

  const plan = (subscriptionPlans as unknown as Record<PlanType, { includesCommunications: boolean }>)[planType]
  return plan?.includesCommunications ?? false
}

/**
 * Get user type from their plan
 */
export async function getUserTypeFromPlan(userId: string, userEmail?: string): Promise<'realtor' | 'business_owner' | null> {
  console.log('[getUserTypeFromPlan] Called with userId:', userId, 'userEmail:', userEmail)
  const planType = await getUserPlanType(userId, userEmail)
  console.log('[getUserTypeFromPlan] getUserPlanType returned:', planType)
  
  if (!planType || !isValidPlanType(planType)) {
    console.log('[getUserTypeFromPlan] No plan type, returning null')
    return null
  }

  const plan = (subscriptionPlans as unknown as Record<PlanType, { userType: 'realtor' | 'business_owner' }>)[planType]
  const userType = plan?.userType ?? null
  console.log('[getUserTypeFromPlan] Returning userType:', userType)
  return userType
}

