import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json() as { sessionId?: string }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Look up session by its ID (current schema uses 'id')
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Profile extraction is not supported with current schema
    return NextResponse.json({ profile: null, note: 'Profile extraction not available' })
  } catch (error) {
    console.error('Profile extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract profile' },
      { status: 500 }
    )
  }
}
