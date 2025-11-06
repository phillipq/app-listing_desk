import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user) {
      return NextResponse.json({ isAdmin: false }, { status: 404 })
    }

    return NextResponse.json({ isAdmin: user.isAdmin })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}
