import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '../../../../lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId } = await request.json() as { message: string; sessionId: string }
    
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
      select: { id: true, name: true }
    })
    
    if (!realtor) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Verify session belongs to this realtor
    const session = await prisma.session.findUnique({
      where: { sessionToken: sessionId }
    })
    
    if (!session || session.realtorId !== realtor.id) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 403 }
      )
    }
    
    // Note: Settings and context fields not available in current schema
    const _personality = 'friendly'
    const context: Record<string, unknown> = {}
    
    // Note: Conversation history storage not implemented in current schema
    // Messages are stored via CommunicationChannel and Conversation models
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
    // Build context information
    let contextInfo = ""
    if (context.generalKnowledge) {
      contextInfo += `\n\nLOCAL MARKET KNOWLEDGE:\n${context.generalKnowledge}`
    }
    
    if (context.communities && Array.isArray(context.communities) && context.communities.length > 0) {
      contextInfo += `\n\nCOMMUNITY INFORMATION:\n`
      const communities = context.communities as Array<{ name?: string; description?: string; schools?: string[]; amenities?: string[]; notes?: string }>
      communities.forEach((community) => {
        if (community.name) {
          contextInfo += `\n${community.name}:`
          if (community.description) contextInfo += ` ${community.description}`
          if (community.schools && community.schools.length > 0) {
            contextInfo += ` Schools: ${community.schools.join(', ')}.`
          }
          if (community.amenities && community.amenities.length > 0) {
            contextInfo += ` Amenities: ${community.amenities.join(', ')}.`
          }
          if (community.notes) contextInfo += ` Additional notes: ${community.notes}`
        }
      })
    }

    // Create OpenAI messages array
    const messages = [
      {
        role: 'system' as const,
        content: `You are a warm, friendly real estate assistant for ${realtor.name} who genuinely cares about helping people find their perfect home. Your goal is to gather information naturally through conversation.

PERSONALITY:
- Be warm, enthusiastic, and encouraging
- Use friendly language like "That sounds wonderful!" or "How exciting!"
- Show genuine interest in their needs
- Be conversational, not robotic

CONVERSATION FLOW:
1. First gather: property type, location, bedrooms/bathrooms, price range, timeline
2. Then ask about nice-to-haves: "What would be your dream features?"
3. When you have enough property info, ask: "Would you like someone to reach out to you about properties that match what you're looking for?"
4. Only if they say yes, then ask for contact details

CRITICAL RULES:
- NEVER ask the same question twice
- Pay attention to what the user has already told you
- If they mention location, don't ask for location again
- If they specify property type, don't ask for property type again
- If they give bedroom/bathroom count, don't ask again
- Keep responses brief and ask one question at a time
- Be conversational and encouraging
- Ask about nice-to-haves before contact info
- Always ask permission before requesting contact details
- Use the local knowledge below to provide helpful insights about communities and areas

${contextInfo}

Current conversation context: ${conversationHistory.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}`
      },
      ...conversationHistory,
      { role: 'user' as const, content: message }
    ]
    
    // Get OpenAI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 150,
      temperature: 0.7,
    })
    
    const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I encountered an error.'
    
    // Note: Message storage requires channelId, userId, and other fields not available here
    // This would need to be refactored to use the CommunicationChannel system
    // For now, we'll just return the response without storing it
    
    return NextResponse.json({
      message: assistantMessage,
      sessionId: session.sessionToken
    })
    
  } catch (error) {
    console.error('Chatbot chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
