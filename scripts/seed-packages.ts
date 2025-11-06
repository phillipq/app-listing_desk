/**
 * Seed Default Packages
 * 
 * Run this script after migrating the database to create the default packages
 * 
 * Usage: npx tsx scripts/seed-packages.ts
 * Or: import and call from an API route or other script
 */

import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function seedPackages() {
  console.log('🌱 Seeding Stripe subscription packages...\n')

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
      price: new Decimal(199.99),
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
      price: new Decimal(249.00),
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
      price: new Decimal(99.99),
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
      price: new Decimal(149.99),
      stripePriceId: stripePriceIds.business_pro_comm,
    }
  ]

  for (const pkg of packages) {
    try {
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
            price: pkg.price,
            stripePriceId: pkg.stripePriceId || null,
            isActive: true
          }
        })
        console.log(`✅ Updated package: ${pkg.name} (${pkg.slug})`)
      } else {
        // Create new package
        await prisma.package.create({
          data: {
            name: pkg.name,
            slug: pkg.slug,
            type: pkg.type,
            description: pkg.description,
            features: pkg.features,
            price: pkg.price,
            stripePriceId: pkg.stripePriceId || null,
            isActive: true
          }
        })
        console.log(`✅ Created package: ${pkg.name} (${pkg.slug})`)
      }
    } catch (error) {
      console.error(`❌ Error with package ${pkg.name}:`, error)
    }
  }

  console.log('\n✨ Package seeding complete!')
}

// Run if called directly
if (require.main === module) {
  seedPackages()
    .catch((e) => {
      console.error('Error seeding packages:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { seedPackages }

