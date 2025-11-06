import { NextRequest, NextResponse } from 'next/server'
import { aiMessageProcessor } from '@/lib/ai-message-processor'
import { notificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/prisma'
import { twilioService } from '@/lib/twilio-service'

// TypeScript interfaces for Twilio webhook data
interface TwilioWebhookBody {
  MessageSid?: string
  AccountSid?: string
  From?: string
  To?: string
  Body?: string
  NumMedia?: number
  MediaUrl0?: string
  [key: string]: unknown
}

interface WhatsAppChannelConfig {
  accountSid: string
  authToken: string
  [key: string]: unknown
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TwilioWebhookBody
    
    // Verify Twilio webhook signature
    const signature = request.headers.get('x-twilio-signature')
    const url = request.url
    
    // Convert body to Record<string, string> for signature verification
    const signatureParams: Record<string, string> = {}
    for (const [key, value] of Object.entries(body)) {
      signatureParams[key] = String(value ?? '')
    }
    
    if (!signature || !twilioService.verifyWebhookSignature(signature, url, signatureParams)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Process Twilio webhook
    if (body.MessageSid) {
      await processTwilioMessage(body)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processTwilioMessage(body: TwilioWebhookBody) {
  try {
    const phoneNumber = body.From?.replace('whatsapp:', '') || 'unknown'
    const messageContent = body.Body || 'Media message'
    const timestamp = new Date()
    const messageSid = body.MessageSid
    const messageType = (body.NumMedia || 0) > 0 ? 'media' : 'text'
    const toNumber = body.To?.replace('whatsapp:', '') || 'unknown'

    // Find the communication channel by Twilio Account SID (for multi-tenant support)
    const channel = await prisma.communicationChannel.findFirst({
      where: {
        type: 'whatsapp',
        isActive: true,
        config: {
          path: ['accountSid'],
          equals: body.AccountSid
        }
      }
    })

    if (!channel) {
      console.error('No WhatsApp channel found for number:', toNumber)
      return
    }

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: {
        phone: phoneNumber
      }
    })

    if (!lead) {
      // Create new lead from WhatsApp message
      lead = await prisma.lead.create({
        data: {
          phone: phoneNumber,
          name: 'Unknown', // Will be updated when user provides name
          email: '',
          message: messageContent, // Use the incoming message content
          isLeadReady: false,
          source: 'whatsapp',
          status: 'new',
          realtorId: undefined, // Will be assigned based on business logic
          userId: channel.userId, // Use channel's user ID
          createdAt: timestamp
        }
      })
    }


    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        leadId: lead.id,
        channelId: channel.id
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          leadId: lead.id,
          channelId: channel.id,
          status: 'active',
          lastMessageAt: timestamp
        }
      })
    }

    // Use AI routing to determine how to handle the message
    const routingDecision = await aiMessageProcessor.routeMessage(messageContent, conversation.id)
    
    // Create message record with routing information
    const message = await prisma.message.create({
      data: {
        channelId: channel.id,
        conversationId: conversation.id,
        from: phoneNumber,
        to: body.To?.replace('whatsapp:', '') || 'unknown',
        content: messageContent,
        timestamp: timestamp,
        isIncoming: true,
        source: 'incoming',
        platform: 'whatsapp',
        leadId: lead.id,
        userId: 'system',
        aiProcessed: routingDecision.shouldAutoRespond,
        aiResponse: routingDecision.response,
        requiresHuman: routingDecision.requiresHuman,
        humanNotified: false,
        metadata: {
          type: 'whatsapp',
          messageSid: messageSid,
          messageType: messageType,
          mediaUrl: body.MediaUrl0 || null,
          numMedia: body.NumMedia || 0,
          routingDecision: {
            confidence: routingDecision.confidence,
            reasoning: routingDecision.reasoning,
            suggestedAction: routingDecision.suggestedAction
          }
        }
      }
    })

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: timestamp,
        status: 'active'
      }
    })

    // Update lead timestamp
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        updatedAt: timestamp
      }
    })

    // Handle the routing decision
    if (routingDecision.shouldAutoRespond && routingDecision.response) {
      // Send AI response via Twilio subclient
      try {
        const config = channel.config as WhatsAppChannelConfig
        await twilioService.sendWhatsAppMessageFromSubclient(
          config.accountSid,
          config.authToken,
          toNumber,
          phoneNumber,
          routingDecision.response
        )
        
        // Create outgoing message record
        await prisma.message.create({
          data: {
            channelId: channel.id,
            conversationId: conversation.id,
            from: body.To?.replace('whatsapp:', '') || 'unknown',
            to: phoneNumber,
            content: routingDecision.response,
            timestamp: new Date(),
            isIncoming: false,
            source: 'outgoing_ai',
            platform: 'whatsapp',
            leadId: lead.id,
            userId: 'system',
            aiProcessed: true,
            metadata: {
              type: 'whatsapp',
              messageType: 'text',
              routingDecision: {
                confidence: routingDecision.confidence,
                reasoning: routingDecision.reasoning
              }
            }
          }
        })
      } catch (sendError) {
        console.error('Error sending AI response:', sendError)
      }
    } else if (routingDecision.requiresHuman) {
      // Notify realtor for manual response
      try {
        // Update message to mark as requiring human attention
        await prisma.message.update({
          where: { id: message.id },
          data: {
            requiresHuman: true,
            humanNotified: true
          }
        })
        
        // Send notification to realtor
        await notificationService.notifyRealtor({
          type: 'message_requires_human',
          messageId: message.id,
          conversationId: conversation.id,
          leadId: lead.id,
          content: messageContent,
          platform: 'whatsapp',
          priority: 'high',
          metadata: {
            routingDecision: routingDecision,
            phoneNumber: phoneNumber
          }
        })
        
        // Process with AI for lead qualification (background processing)
        await aiMessageProcessor.processMessage(lead.id, messageContent)
      } catch (aiError) {
        console.error('AI processing error:', aiError)
      }
    }

  } catch (error) {
    console.error('Error processing Twilio message:', error)
  }
}

export async function GET(request: NextRequest) {
  // WhatsApp webhook verification
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
