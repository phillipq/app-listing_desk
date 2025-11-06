const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...\n')
    
    // Check Realtors
    const realtors = await prisma.realtor.findMany()
    console.log('📊 Realtors:', realtors.length)
    realtors.forEach(r => console.log(`  - ${r.name} (${r.domain})`))
    
    // Check Sessions
    const sessions = await prisma.session.findMany({
      include: {
        messages: true,
        profile: true
      }
    })
    console.log('\n📊 Sessions:', sessions.length)
    sessions.forEach(s => {
      console.log(`  - Session ${s.sessionId}`)
      console.log(`    Messages: ${s.messages.length}`)
      console.log(`    Profile: ${s.profile ? 'Yes' : 'No'}`)
      if (s.profile) {
        console.log(`    Lead Score: ${s.profile.leadScore}`)
        console.log(`    Property Type: ${s.profile.propertyType || 'Not specified'}`)
      }
    })
    
    // Check Messages
    const messages = await prisma.message.findMany({
      orderBy: { timestamp: 'asc' }
    })
    console.log('\n📊 Messages:', messages.length)
    messages.forEach(m => {
      console.log(`  - ${m.role}: ${m.content.substring(0, 50)}...`)
    })
    
    // Check Profiles
    const profiles = await prisma.customerProfile.findMany()
    console.log('\n📊 Customer Profiles:', profiles.length)
    profiles.forEach(p => {
      console.log(`  - Lead Score: ${p.leadScore}`)
      console.log(`  - Qualified: ${p.isQualified}`)
      console.log(`  - Property Type: ${p.propertyType || 'Not specified'}`)
      console.log(`  - Location: ${p.location || 'Not specified'}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
