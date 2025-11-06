import { NextRequest, NextResponse } from 'next/server'
import { aiMessageProcessor } from '@/lib/ai-message-processor'
import { instagramService } from '@/lib/instagram-service'


export async function POST(request: NextRequest) {
  try {
    type InstagramMessage = {
      id: string
      message?: { text?: string }
      [key: string]: unknown
    }

    type InstagramChangeValue = {
      messages?: InstagramMessage[]
      metadata?: { access_token?: string }
      [key: string]: unknown
    }

    type InstagramEntry = {
      id?: string
      changes: Array<{
        field: string
        value: InstagramChangeValue
      }>
    }

    type InstagramWebhookBody = {
      object?: string
      entry?: InstagramEntry[]
    }

    const body = (await request.json()) as InstagramWebhookBody
    
    // Process Instagram webhook
    if (body.object === 'instagram' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages ?? []
            for (const message of messages) {
              await processInstagramMessage(message, change.value.metadata)
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Instagram webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processInstagramMessage(
  message: { id: string; message?: { text?: string } },
  metadata?: { access_token?: string }
) {
  try {
    // Get access token from metadata or channel config
    const accessToken = metadata?.access_token || process.env.INSTAGRAM_ACCESS_TOKEN
    
    if (!accessToken) {
      console.error('No Instagram access token available')
      return
    }

    // Normalize to expected structure for instagramService
    const normalized = {
      id: message.id,
      from: { id: 'unknown' },
      created_time: new Date().toISOString(),
      message: { text: message.message?.text ?? '' }
    }

    const result = await instagramService.processIncomingMessage(normalized, accessToken)
    
    if (result && result.lead) {
      // Process with AI for lead qualification
      try {
        const messageContent = message.message?.text || 'Media message'
        await aiMessageProcessor.processMessage(result.lead.id, messageContent)
      } catch (aiError) {
        console.error('AI processing error:', aiError)
      }
    }

  } catch (error) {
    console.error('Error processing Instagram message:', error)
  }
}

export async function GET(request: NextRequest) {
  // Instagram webhook verification
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    return new NextResponse(challenge)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
