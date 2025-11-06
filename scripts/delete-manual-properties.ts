/**
 * Script to delete old properties with MANUAL_ prefix
 * This cleans up test properties before using the new TLD numbering system
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteManualProperties() {
  try {
    console.log('🔍 Finding properties with MANUAL_ prefix...')
    
    const oldProperties = await prisma.property.findMany({
      where: {
        mlsId: {
          startsWith: 'MANUAL_'
        }
      },
      select: {
        id: true,
        mlsId: true,
        address: true,
        city: true,
        province: true,
        createdAt: true
      }
    })

    if (oldProperties.length === 0) {
      console.log('✅ No properties with MANUAL_ prefix found. Nothing to delete.')
      return
    }

    console.log(`\n📋 Found ${oldProperties.length} properties with MANUAL_ prefix:`)
    oldProperties.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.mlsId}`)
      console.log(`     Address: ${p.address}, ${p.city}, ${p.province}`)
      console.log(`     Created: ${p.createdAt.toISOString().split('T')[0]}`)
      console.log('')
    })

    // Check for related data
    const propertyIds = oldProperties.map(p => p.id)
    
    console.log('🔍 Checking for related data (leads, etc.)...')
    const leadsCount = await prisma.lead.count({
      where: {
        propertyId: {
          in: propertyIds
        }
      }
    })

    if (leadsCount > 0) {
      console.log(`⚠️  Warning: Found ${leadsCount} leads associated with these properties.`)
      console.log('   Leads will also be deleted or orphaned.')
    }

    // Delete the properties
    console.log('\n🗑️  Deleting properties...')
    const result = await prisma.property.deleteMany({
      where: {
        mlsId: {
          startsWith: 'MANUAL_'
        }
      }
    })

    console.log(`✅ Successfully deleted ${result.count} properties with MANUAL_ prefix.`)
    console.log('\n✨ Database cleaned! You can now test the new TLD numbering system.')

  } catch (error) {
    console.error('❌ Error deleting properties:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

deleteManualProperties()

