/**
 * Verify Packages Were Created Successfully
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPackages() {
  console.log('🔍 Verifying packages...\n')

  const packages = await prisma.package.findMany({
    orderBy: { type: 'asc' }
  })

  console.log(`Found ${packages.length} packages:\n`)

  for (const pkg of packages) {
    console.log(`📦 ${pkg.name}`)
    console.log(`   Slug: ${pkg.slug}`)
    console.log(`   Type: ${pkg.type}`)
    console.log(`   Price: $${pkg.price?.toString() || 'N/A'}`)
    console.log(`   Features: ${pkg.features.length} features`)
    console.log(`   Active: ${pkg.isActive ? '✅' : '❌'}`)
    console.log('')
  }

  // Check Realtor table updates
  const realtorCount = await prisma.realtor.count()
  console.log(`👥 Total Realtors in system: ${realtorCount}`)
  
  // Check if any have packages assigned
  const userPackageCount = await prisma.userPackage.count()
  console.log(`📋 User-Package assignments: ${userPackageCount}`)

  console.log('\n✨ Verification complete!')
}

verifyPackages()
  .catch((e) => {
    console.error('Error verifying packages:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

