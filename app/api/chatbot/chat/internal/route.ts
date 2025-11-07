import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import OpenAI from 'openai'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import { getUserTypeFromPlan } from '../../../../../lib/subscription-access'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { message, sessionId } = await request.json() as { message: string; sessionId: string }
    
    // Find realtor by user ID
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true }
    })
    
    if (!realtor) {
      return NextResponse.json(
        { error: 'Realtor not found' },
        { status: 404 }
      )
    }
    
    // Verify session belongs to this realtor
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: sessionId }
    })
    
    if (!dbSession || dbSession.realtorId !== realtor.id) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 403 }
      )
    }

    // Find or create Lead for this session
    // First, try to find a lead that was created when the session started
    // We'll search by realtorId and source, and check if it's a new lead
    let lead = await prisma.lead.findFirst({
      where: {
        realtorId: realtor.id,
        source: 'chatbot',
        status: 'new',
        message: 'Chatbot conversation started'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If no lead found, create a new one
    if (!lead) {
      lead = await prisma.lead.create({
        data: {
          name: 'Anonymous',
          email: '',
          message: message,
          source: 'chatbot',
          status: 'new',
          isLeadReady: false,
          realtorId: realtor.id,
          messages: [{
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          }] as Prisma.InputJsonValue
        }
      })
    } else {
      // Update lead with new message
      const messages = (lead.messages as Array<{ role: string; content: string; timestamp?: string }>) || []
      messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      })
      
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          messages: messages as Prisma.InputJsonValue,
          message: message // Update the last message
        }
      })
    }

    // Determine user type (realtor or business_owner)
    const userType = await getUserTypeFromPlan(session.user.id, session.user.email || undefined)
    
    // Build context (placeholder for now - will be enhanced with real context)
    const contextInfo = ""

    // Create system prompt based on user type
    let systemPrompt = ""
    
    if (userType === 'business_owner') {
      // Generic small business assistant prompt
      systemPrompt = `You are a warm, friendly business assistant for ${realtor.name}. Your goal is to help potential customers learn about the business and gather information naturally through conversation.

PERSONALITY:
- Be warm, enthusiastic, and professional
- Use friendly language like "That's great!" or "I'd be happy to help!"
- Show genuine interest in their needs
- Be conversational, not robotic

CONVERSATION FLOW:
1. First, ask about what they're looking for or what brought them to the business
2. Gather information about their needs, preferences, or questions
3. Provide helpful information about the business and its services
4. When appropriate, ask: "Would you like someone from our team to reach out to you with more information?"
5. Only if they say yes, then ask for contact details (name, email, phone)

CRITICAL RULES:
- NEVER ask the same question twice
- Pay attention to what the user has already told you
- Keep responses brief and ask one question at a time
- Be conversational and helpful
- Focus on understanding their needs and how the business can help
- Always ask permission before requesting contact details
- Do NOT mention real estate, properties, or homes unless the user specifically asks about those topics
- Keep the conversation focused on general business services and customer needs

${contextInfo}
      `
    } else {
      // Realtor-specific prompt
      systemPrompt = `You are a warm, friendly real estate assistant for ${realtor.name} who genuinely cares about helping people find their perfect home. Your goal is to gather information naturally through conversation.

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

${contextInfo}
      `
    }

    // Create OpenAI messages array
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
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
    
    // Update lead with assistant response
    const leadMessages = (lead.messages as Array<{ role: string; content: string; timestamp?: string }>) || []
    leadMessages.push({
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString()
    })
    
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        messages: leadMessages as Prisma.InputJsonValue
      }
    })
    
    return NextResponse.json({
      message: assistantMessage,
      sessionId: dbSession.sessionToken
    })
    
  } catch (error) {
    console.error('Chatbot internal chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

