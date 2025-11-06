import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isAdmin } from '@/lib/admin-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, isAdmin: true }
    })

    // Also check by email
    const realtorByEmail = await prisma.realtor.findUnique({
      where: { email: session.user.email! },
      select: { id: true, email: true, isAdmin: true }
    })

    // Check admin status
    const adminStatus = await isAdmin(session.user.id)

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name
      },
      realtorById: realtor,
      realtorByEmail: realtorByEmail,
      adminStatus,
      matches: {
        idMatch: realtor?.id === session.user.id,
        emailMatch: realtorByEmail?.email === session.user.email,
        bothAdmin: realtor?.isAdmin && realtorByEmail?.isAdmin
      }
    })
  } catch (error) {
    console.error('Debug session error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

