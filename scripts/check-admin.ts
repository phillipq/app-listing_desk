/**
 * Check if a user is an admin
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAdmin(email: string) {
  try {
    const user = await prisma.realtor.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isAdmin: true }
    })

    if (!user) {
      console.log(`❌ User not found: ${email}`)
      return
    }

    console.log(`\n👤 User: ${user.name || 'No name'} (${user.email})`)
    console.log(`🛡️  Admin Status: ${user.isAdmin ? '✅ YES - Admin' : '❌ NO - Not Admin'}`)
    
    if (!user.isAdmin) {
      console.log(`\n💡 To make this user an admin, run:`)
      console.log(`   npx tsx scripts/make-admin.ts ${email}`)
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/check-admin.ts <user-email>')
  process.exit(1)
}

checkAdmin(email)

