import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { sessionId?: string }
    const { sessionId } = body
    
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid API key' },
        { status: 401 }
      )
    }
    
    const apiKey = authHeader.replace('Bearer ', '')
    
    // Find realtor by API key
    const realtor = await prisma.realtor.findUnique({
      where: { apiKey },
      select: { id: true, name: true, domain: true }
    })
    
    if (!realtor) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    console.log('Chatbot session for realtor:', realtor.name, 'Domain:', realtor.domain)
    
    let session
    
    if (sessionId) {
      // Try to resume existing session
      session = await prisma.session.findUnique({
        where: { sessionToken: sessionId }
      })
      
      if (session) {
        // Verify session belongs to this realtor
        if (session.realtorId !== realtor.id) {
          return NextResponse.json(
            { error: 'Session does not belong to this realtor' },
            { status: 403 }
          )
        }
        
        // Note: lastActivity field not available in current schema
        // Session is found and verified
      }
    }
    
    if (!session) {
      // Create new session for this realtor
      const newSessionToken = uuidv4()
      
      session = await prisma.session.create({
        data: {
          sessionToken: newSessionToken,
          realtorId: realtor.id,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      })
    }

    return NextResponse.json({
      sessionId: session.sessionToken,
      // Note: Messages and profile not available via Session relation
      // These would need to be fetched separately if needed
      messages: [],
      profile: null,
      realtor: {
        name: realtor.name,
        domain: realtor.domain
      }
    })
  } catch (error) {
    console.error('Chatbot session error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
