import { NextRequest, NextResponse } from 'next/server'
import { aiMessageProcessor } from '@/lib/ai-message-processor'
import { notificationService } from '@/lib/notification-service'
import { prisma } from '@/lib/prisma'
import { twilioService } from '@/lib/twilio-service'


export async function POST(request: NextRequest) {
  try {
    interface TwilioVoicemailWebhookBody {
      From?: string
      To?: string
      CallSid?: string
      RecordingUrl?: string
      TranscriptionText?: string
      RecordingDuration?: string
      AccountSid?: string
      [key: string]: unknown
    }

    const body = await request.json() as TwilioVoicemailWebhookBody
    
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

    // Process Twilio voicemail webhook
    if (body.CallSid) {
      await processVoicemailMessage(body)
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Voicemail webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processVoicemailMessage(body: {
  From?: string
  To?: string
  CallSid?: string
  RecordingUrl?: string
  TranscriptionText?: string
  RecordingDuration?: string
  AccountSid?: string
  [key: string]: unknown
}) {
  try {
    const phoneNumber = body.From
    const toNumber = body.To
    const callSid = body.CallSid
    const recordingUrl = body.RecordingUrl
    const transcriptionText = body.TranscriptionText || ''
    const timestamp = new Date()

    // Find the communication channel by Twilio Account SID (for multi-tenant support)
    const channel = await prisma.communicationChannel.findFirst({
      where: {
        type: 'voicemail',
        isActive: true,
        config: {
          path: ['accountSid'],
          equals: body.AccountSid
        }
      }
    })

    if (!channel) {
      console.error('No voicemail channel found for number:', toNumber)
      return
    }

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: {
        phone: phoneNumber
      }
    })

    if (!lead) {
      // Create new lead from voicemail
      lead = await prisma.lead.create({
        data: {
          phone: phoneNumber ?? '',
          name: 'Unknown',
          email: '',
          source: 'voicemail',
          status: 'new',
          message: transcriptionText,
          isLeadReady: false
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

    // Process voicemail with Twilio service
    const cfg = channel.config as unknown as { accountSid?: string; authToken?: string }
    const voicemailData = await twilioService.handleVoicemailFromSubclient(
      cfg.accountSid ?? '',
      cfg.authToken ?? '',
      recordingUrl ?? '',
      transcriptionText,
      phoneNumber ?? '',
      toNumber ?? ''
    )

    // Use AI routing to determine how to handle the voicemail
    const routingDecision = await aiMessageProcessor.routeMessage(voicemailData.transcription, conversation.id)
    
    // Create message record with routing information
    const message = await prisma.message.create({
      data: {
        channelId: channel.id,
        conversationId: conversation.id,
        from: phoneNumber ?? '',
        to: toNumber ?? '',
        content: voicemailData.transcription,
        timestamp: timestamp,
        isIncoming: true,
        source: 'incoming',
        platform: 'voicemail',
        leadId: lead.id,
        userId: 'system',
        aiProcessed: routingDecision.shouldAutoRespond,
        aiResponse: routingDecision.response,
        requiresHuman: routingDecision.requiresHuman,
        humanNotified: false,
        metadata: {
          type: 'voicemail',
          callSid: callSid ?? '',
          recordingUrl: recordingUrl ?? '',
          transcriptionText: transcriptionText,
          duration: body.RecordingDuration ? parseInt(body.RecordingDuration, 10) : 0,
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
      // Send AI response via SMS (since voicemail is one-way)
      try {
        const config = channel.config as unknown as { accountSid?: string; authToken?: string }
        await twilioService.sendSMSFromSubclient(
          config.accountSid ?? '',
          config.authToken ?? '',
          toNumber ?? '',
          phoneNumber ?? '',
          `Thank you for your voicemail. ${routingDecision.response}`
        )
        
        // Create outgoing message record
        await prisma.message.create({
          data: {
            channelId: channel.id,
            conversationId: conversation.id,
            from: toNumber ?? '',
            to: phoneNumber ?? '',
            content: `Thank you for your voicemail. ${routingDecision.response}`,
            timestamp: new Date(),
            isIncoming: false,
            source: 'outgoing_ai',
            platform: 'sms', // Response sent via SMS
            leadId: lead.id,
            userId: 'system',
            aiProcessed: true,
            metadata: {
              type: 'sms',
              messageType: 'text',
              originalVoicemailId: message.id,
              routingDecision: {
                confidence: routingDecision.confidence,
                reasoning: routingDecision.reasoning
              }
            }
          }
        })
      } catch (sendError) {
        console.error('Error sending AI response to voicemail:', sendError)
      }
    } else if (routingDecision.requiresHuman) {
      // Notify realtor for manual response
      try {
        // Update message to mark as requiring human attention
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).message.update({
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
          content: voicemailData.transcription,
          platform: 'voicemail',
          priority: 'high',
          metadata: {
            routingDecision: routingDecision,
            phoneNumber: phoneNumber,
            recordingUrl: recordingUrl,
            callSid: callSid
          }
        })
        
        // Process with AI for lead qualification (background processing)
        await aiMessageProcessor.processMessage(lead.id, voicemailData.transcription)
      } catch (aiError) {
        console.error('AI processing error:', aiError)
      }
    }

  } catch (error) {
    console.error('Error processing voicemail message:', error)
  }
}

export async function GET(request: NextRequest) {
  // Voicemail webhook verification
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.VOICEMAIL_VERIFY_TOKEN) {
    return new NextResponse(challenge)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}