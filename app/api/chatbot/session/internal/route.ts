import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { v4 as uuidv4 } from 'uuid'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as { sessionId?: string }
    const { sessionId } = body

    // Find realtor by user ID
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true }
    })

    if (!realtor) {
      return NextResponse.json(
        { error: 'Realtor not found' },
        { status: 404 }
      )
    }

    let dbSession
    
    if (sessionId) {
      // Try to resume existing session
      dbSession = await prisma.session.findUnique({
        where: { sessionToken: sessionId }
      })
      
      if (dbSession) {
        // Verify session belongs to this realtor
        if (dbSession.realtorId !== realtor.id) {
          return NextResponse.json(
            { error: 'Session does not belong to this realtor' },
            { status: 403 }
          )
        }
      }
    }
    
    if (!dbSession) {
      // Create new session for this realtor
      const newSessionToken = uuidv4()
      
      dbSession = await prisma.session.create({
        data: {
          sessionToken: newSessionToken,
          realtorId: realtor.id,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      })

      // Create Lead when new session starts
      try {
        await prisma.lead.create({
          data: {
            name: 'Anonymous',
            email: '',
            message: 'Chatbot conversation started',
            source: 'chatbot',
            status: 'new',
            isLeadReady: false,
            realtorId: realtor.id,
            messages: []
          }
        })
      } catch (leadError) {
        // Lead might already exist, that's okay
        console.log('Lead creation note:', leadError)
      }
    }

    return NextResponse.json({
      sessionId: dbSession.sessionToken,
      messages: [],
      profile: null,
      realtor: {
        name: realtor.name,
        email: realtor.email
      }
    })
  } catch (error) {
    console.error('Chatbot internal session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

