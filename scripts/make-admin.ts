/**
 * Make a User an Admin
 * 
 * Usage: npx tsx scripts/make-admin.ts <user-email>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin(email: string) {
  try {
    const user = await prisma.realtor.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }

    if (user.isAdmin) {
      console.log(`ℹ️  User ${email} is already an admin`)
      return
    }

    await prisma.realtor.update({
      where: { email },
      data: { isAdmin: true }
    })

    console.log(`✅ Made ${email} an admin`)
  } catch (error) {
    console.error('Error making user admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]

if (!email) {
  console.error('Usage: npx tsx scripts/make-admin.ts <user-email>')
  process.exit(1)
}

makeAdmin(email)

