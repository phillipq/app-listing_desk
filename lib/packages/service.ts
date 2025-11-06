/**
 * Package Management Service
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

export interface CreatePackageInput {
  name: string
  slug: string
  type: 'base' | 'addon'
  description?: string
  features?: string[]
  price?: number
  stripePriceId?: string
}

/**
 * Get all active packages
 */
export async function getAllPackages(includeInactive = false) {
  return prisma.package.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [
      { type: 'asc' }, // Base packages first
      { name: 'asc' }
    ]
  })
}

/**
 * Get package by slug
 */
export async function getPackageBySlug(slug: string) {
  return prisma.package.findUnique({
    where: { slug }
  })
}

/**
 * Create a new package
 */
export async function createPackage(input: CreatePackageInput) {
  return prisma.package.create({
    data: {
      name: input.name,
      slug: input.slug,
      type: input.type,
      description: input.description,
      features: input.features || [],
      price: input.price ? new Decimal(input.price) : null,
      stripePriceId: input.stripePriceId || null,
      isActive: true
    }
  })
}

/**
 * Assign package to user
 */
export async function assignPackageToUser(
  userId: string,
  packageId: string,
  options?: {
    expiresAt?: Date
    stripeSubscriptionId?: string
  }
) {
  // Check if already assigned
  const existing = await prisma.userPackage.findUnique({
    where: {
      userId_packageId: {
        userId,
        packageId
      }
    }
  })

  if (existing) {
    // Update existing
    return prisma.userPackage.update({
      where: { id: existing.id },
      data: {
        status: 'active',
        expiresAt: options?.expiresAt,
        stripeSubscriptionId: options?.stripeSubscriptionId
      }
    })
  }

  // Create new
  return prisma.userPackage.create({
    data: {
      userId,
      packageId,
      status: 'active',
      expiresAt: options?.expiresAt,
      stripeSubscriptionId: options?.stripeSubscriptionId
    }
  })
}

/**
 * Remove package from user
 */
export async function removePackageFromUser(userId: string, packageId: string) {
  return prisma.userPackage.updateMany({
    where: {
      userId,
      packageId
    },
    data: {
      status: 'cancelled'
    }
  })
}

/**
 * Seed default packages (Stripe subscription packages)
 */
export async function seedDefaultPackages() {
  // Get Stripe Price IDs from environment
  const stripePriceIds = {
    realtor_pro: process.env.STRIPE_REL_PRO || '',
    realtor_pro_comm: process.env.STRIPE_REL_PRO_COMM || '',
    business_pro: process.env.STRIPE_BUS_PRO || '',
    business_pro_comm: process.env.STRIPE_BUS_PRO_COMM || '',
  }

  const packages = [
    {
      name: 'Realtor Pro',
      slug: 'realtor_pro',
      type: 'base' as const,
      description: 'Complete real estate management platform with property listings, location insights, and AI lead generation',
      features: [
        'Unlimited property listings',
        'Location insights & analysis',
        'Showing tour planner',
        'AI-powered lead generation',
        'Advanced analytics',
        'Priority support'
      ],
      price: 199.99,
      stripePriceId: stripePriceIds.realtor_pro,
    },
    {
      name: 'Realtor Pro + Communications',
      slug: 'realtor_pro_comm',
      type: 'base' as const,
      description: 'Everything in Realtor Pro plus Social Media Hub and Communication Hub',
      features: [
        'Everything in Realtor Pro',
        'Social Media Hub',
        'Communication Hub',
        'WhatsApp integration',
        'Instagram integration',
        'SMS & Voicemail',
        'Multi-channel messaging'
      ],
      price: 249.00,
      stripePriceId: stripePriceIds.realtor_pro_comm,
    },
    {
      name: 'Business Pro',
      slug: 'business_pro',
      type: 'base' as const,
      description: 'Complete business management platform with customer management, services, and scheduling',
      features: [
        'Customer management',
        'Service management',
        'Appointment scheduling',
        'AI-powered chatbot',
        'Lead generation',
        'Basic analytics',
        'Email support'
      ],
      price: 99.99,
      stripePriceId: stripePriceIds.business_pro,
    },
    {
      name: 'Business Pro + Communications',
      slug: 'business_pro_comm',
      type: 'base' as const,
      description: 'Everything in Business Pro plus Social Media Hub and Communication Hub',
      features: [
        'Everything in Business Pro',
        'Social Media Hub',
        'Communication Hub',
        'WhatsApp integration',
        'Instagram integration',
        'SMS & Voicemail',
        'Multi-channel messaging'
      ],
      price: 149.99,
      stripePriceId: stripePriceIds.business_pro_comm,
    }
  ]

  for (const pkg of packages) {
    const existing = await prisma.package.findUnique({
      where: { slug: pkg.slug }
    })

    if (existing) {
      // Update existing package
      await prisma.package.update({
        where: { slug: pkg.slug },
        data: {
          name: pkg.name,
          type: pkg.type,
          description: pkg.description,
          features: pkg.features,
          price: pkg.price ? new Decimal(pkg.price) : null,
          stripePriceId: pkg.stripePriceId || null,
          isActive: true
        }
      })
      console.log(`✅ Updated package: ${pkg.name}`)
    } else {
      // Create new package
      await prisma.package.create({
        data: {
          name: pkg.name,
          slug: pkg.slug,
          type: pkg.type,
          description: pkg.description,
          features: pkg.features,
          price: pkg.price ? new Decimal(pkg.price) : null,
          stripePriceId: pkg.stripePriceId || null,
          isActive: true
        }
      })
      console.log(`✅ Created package: ${pkg.name}`)
    }
  }
}

