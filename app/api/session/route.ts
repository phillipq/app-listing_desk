import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { v4 as uuidv4 } from 'uuid'
import { authOptions } from '../../../lib/auth'
// No DB persistence for chat sessions; we return an ephemeral session id

export async function POST(request: NextRequest) {
  try {
    const { sessionId, realtorId } = await request.json() as { sessionId?: string; realtorId?: string }
    console.log('Session API called with sessionId:', sessionId, 'realtorId:', realtorId)
    
    // Get the realtor ID from the request or session
    let targetRealtorId = realtorId
    
    console.log('Session request:', { sessionId, realtorId: targetRealtorId })
    
    if (!targetRealtorId) {
      // Try to get from session (for authenticated users)
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        targetRealtorId = session.user.id
        console.log('Using authenticated realtor ID:', targetRealtorId)
      }
    }
    
    if (!targetRealtorId) {
      console.log('No realtor ID provided, using default realtor')
      // Fallback to default realtor for public chatbot
      // Use a fixed fallback ID since DB schema differs
      targetRealtorId = 'default-realtor'
      console.log('Using default realtor ID:', targetRealtorId)
    } else {
      console.log('Using provided realtor ID:', targetRealtorId)
    }

    let session: { id: string } | null = null
    
    if (sessionId) {
      // Try to resume existing session
      session = { id: sessionId }
      
      console.log('Found existing session:', session ? 'Yes' : 'No')
    }
    
    if (!session) {
      // Create new session
      const newSessionId = uuidv4()
      console.log('Creating new session with ID:', newSessionId)
      
      session = { id: newSessionId }
      
      console.log('New session created:', session.id)
    }

    return NextResponse.json({
      sessionId: session.id,
      messages: [],
      profile: null
    })
  } catch (error) {
    console.error('Session creation error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create session', details: message },
      { status: 500 }
    )
  }
}
