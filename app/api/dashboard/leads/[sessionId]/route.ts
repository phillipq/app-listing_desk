import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId } = await params

    // Get the session (current schema does not include messages/profile on Session)
    const leadSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        realtorId: session.user.id
      }
    })

    if (!leadSession) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Build a minimal response compatible with current schema
    const leadDetails = {
      session: {
        id: leadSession.id,
        sessionId: leadSession.id,
        createdAt: new Date(0).toISOString(),
        lastActivity: new Date(0).toISOString(),
        isActive: false,
        chatDuration: 0
      },
      messages: [] as Array<{ id: string; role: string; content: string; timestamp: string }>,
      profile: null as unknown
    }

    return NextResponse.json(leadDetails)

  } catch (error) {
    console.error('Lead details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead details' },
      { status: 500 }
    )
  }
}
