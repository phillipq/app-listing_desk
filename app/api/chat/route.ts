import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { mlsService as _mlsService } from '../../../lib/mls'
import { prisma } from '../../../lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Function to search for properties and provide intelligent recommendations
async function searchPropertiesForLead(sessionToken: string): Promise<string | null> {
  try {
    // Get the session
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        realtor: true
      }
    })

    if (!session) return null

    // Profile-based search is not supported in current schema
    // Would need to implement search via property database with session context
    return null
  } catch (error) {
    console.error('Error searching properties for chatbot:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId } = body as { message: string; sessionId: string }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found in environment variables')
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    console.log('Processing chat request:', { message: message.substring(0, 50) + '...', sessionId })

    // Check if session exists
    const session = await prisma.session.findUnique({
      where: { sessionToken: sessionId },
      include: {
        realtor: {
          select: { name: true }
        }
      }
    })
    
    if (!session) {
      console.error('Session not found:', sessionId)
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    
    console.log('Session found:', session.id)
    
    // Note: Conversation history storage not implemented in current schema
    // Messages are stored via CommunicationChannel and Conversation models
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []

    // Note: Message storage requires channelId and userId which aren't available here
    // This would need to be refactored to use the CommunicationChannel system
    
    // Build context information
    const contextInfo = ""
    // Note: Realtor context field not available in current schema

    // Create messages array with conversation history
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `You are a warm, friendly real estate assistant${session.realtor?.name ? ` for ${session.realtor.name}` : ''} who genuinely cares about helping people find their perfect home. Your goal is to gather information naturally through conversation and proactively recommend properties when you have enough information.

PERSONALITY:
- Be warm, enthusiastic, and encouraging
- Use friendly language like "That sounds wonderful!" or "How exciting!"
- Show genuine interest in their needs
- Be conversational, not robotic
- Be proactive about property recommendations

CONVERSATION FLOW:
1. First gather: property type, location, bedrooms/bathrooms, price range, timeline
2. Then ask about MUST-HAVES: "What are the absolute must-haves for your new home? Things you can't live without?"
3. Then ask about NICE-TO-HAVES: "What would be your dream features? Things that would be amazing to have but aren't deal-breakers?"
4. **NEIGHBORHOOD PREFERENCES**: Ask about what's important in a neighborhood:
   - "What's most important to you in a neighborhood? Are you looking for family-friendly areas with schools and parks, convenient shopping and dining, or easy commute access?"
   - "How do you typically get around? Do you prefer driving, public transit, or walking/cycling?"
5. **PROACTIVE PROPERTY SEARCH**: Once you have location, property type, and at least one other criteria (bedrooms, bathrooms, or price), automatically search for and recommend properties
6. When you have enough property info, ask: "Would you like someone to reach out to you about properties that match what you're looking for?"
7. If they say yes, offer options:
   - Ask for contact details (email/phone)

CRITICAL RULES:
- NEVER ask the same question twice
- Pay attention to what the user has already told you
- If they mention location, don't ask for location again
- If they specify property type, don't ask for property type again
- If they give bedroom/bathroom count, don't ask again
- Keep responses brief (2-3 sentences max)
- Ask one focused question at a time
- Be conversational and encouraging
- **BE PROACTIVE**: When you have enough info, automatically search for properties instead of waiting for them to ask

PROPERTY RECOMMENDATION TRIGGERS:
- When user says "show me properties", "find me homes", "recommend", etc.
- When you have: location + property type + (bedrooms OR bathrooms OR price range)
- When user seems to be wrapping up their requirements

EXAMPLE QUESTIONS FOR MUST-HAVES:
- "What are the absolute must-haves for your new home?"
- "What features can you absolutely not live without?"
- "What are your non-negotiables when it comes to your new home?"

EXAMPLE QUESTIONS FOR NICE-TO-HAVES:
- "What would be your dream features?"
- "What amenities would be amazing to have but aren't deal-breakers?"
- "If you could have any extra features, what would they be?"

EXAMPLE QUESTIONS FOR NEIGHBORHOOD PREFERENCES:
- "What's most important to you in a neighborhood? Are you looking for family-friendly areas with schools and parks, convenient shopping and dining, or easy commute access?"
- "How do you typically get around? Do you prefer driving, public transit, or walking/cycling?"
- "Are there any specific amenities or services that are important to you nearby? Like gyms, healthcare, entertainment, or shopping?"

ADDITIONAL GUIDELINES:
- Ask about nice-to-haves before contact info
- Always ask permission before requesting contact details
- Offer booking option if available
- Use the local knowledge below to provide helpful insights about communities and areas
- **Be proactive about property recommendations - don't wait for them to ask!**

${contextInfo}

Current conversation context: ${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
      },
      ...conversationHistory,
      {
        role: "user" as const,
        content: message
      }
    ]

    // Check if we should search for properties (when user provides enough info or seems to be wrapping up)
    let propertySearchResponse = null
    const lowerMessage = message.toLowerCase()
    const isWrappingUp = lowerMessage.includes('thank') || 
                        lowerMessage.includes('that\'s all') || 
                        lowerMessage.includes('i think that\'s it') ||
                        lowerMessage.includes('sounds good') ||
                        lowerMessage.includes('perfect') ||
                        lowerMessage.includes('show me') ||
                        lowerMessage.includes('find me') ||
                        lowerMessage.includes('recommend') ||
                        lowerMessage.includes('properties')
    
    // Search for properties when user seems to be wrapping up
    if (isWrappingUp) {
      propertySearchResponse = await searchPropertiesForLead(sessionId)
    }
    
    // Note: Profile-based features not available in current schema

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      max_tokens: 150,
      temperature: 0.7,
    })

    let response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
    
    // Append property search results if available
    if (propertySearchResponse) {
      response += `\n\n${propertySearchResponse}`
    }
    
    // Note: Questionnaire token generation not implemented in current schema

    // Note: Message storage requires channelId and userId which aren't available in this context
    // This would need to be refactored to use the CommunicationChannel system
    // For now, we'll just return the response without storing it
    
    // Note: Profile auto-extraction not implemented in current schema

    return NextResponse.json({ message: response })
  } catch (error) {
    console.error('OpenAI API error:', error)
    
    // More specific error handling
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 401 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate response. Please check the console for details.' },
      { status: 500 }
    )
  }
}
