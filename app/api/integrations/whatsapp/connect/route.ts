import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { twilioService } from '@/lib/twilio-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessName } = await request.json() as { businessName: string }
    
    if (!businessName) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    // Check if user already has WhatsApp connected
    const existingChannel = await prisma.communicationChannel.findFirst({
      where: {
        userId: session.user.id,
        type: 'whatsapp',
        isActive: true
      }
    })

    if (existingChannel) {
      return NextResponse.json({ 
        error: 'WhatsApp is already connected',
        channelId: existingChannel.id 
      }, { status: 400 })
    }

    // Create Twilio subclient for this user
    const subclient = await twilioService.createSubclient(
      session.user.id,
      businessName
    )

    if (!subclient.whatsappNumber) {
      return NextResponse.json({ 
        error: 'Unable to provision WhatsApp number. Please try again later.' 
      }, { status: 500 })
    }

    // Configure webhooks for this subclient
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`
    const smsWebhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/sms`
    const voicemailWebhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/voicemail`
    
    await Promise.all([
      twilioService.configureWhatsAppWebhook(
        subclient.accountSid,
        subclient.authToken,
        webhookUrl
      ),
      twilioService.configureSMSWebhook(
        subclient.accountSid,
        subclient.authToken,
        smsWebhookUrl
      ),
      twilioService.configureVoicemailWebhook(
        subclient.accountSid,
        subclient.authToken,
        voicemailWebhookUrl
      )
    ])

    // Store subclient credentials securely
    await prisma.socialToken.create({
      data: {
        userId: session.user.id,
        platform: 'twilio_whatsapp',
        pageId: subclient.accountSid,
        accessToken: subclient.authToken,
        instagramBusinessId: subclient.whatsappNumber,
        metadata: {
          friendlyName: subclient.friendlyName,
          status: subclient.status,
          smsNumber: subclient.smsNumber
        }
      }
    })

    // Create communication channels for all services
    const channels = await Promise.all([
      // WhatsApp channel
      prisma.communicationChannel.create({
        data: {
          userId: session.user.id,
          name: `WhatsApp - ${businessName}`,
          type: 'whatsapp',
          isActive: true,
          config: {
            accountSid: subclient.accountSid,
            authToken: subclient.authToken,
            phoneNumber: subclient.whatsappNumber,
            webhookUrl: webhookUrl,
            subclient: true
          }
        }
      }),
      // SMS channel
      prisma.communicationChannel.create({
        data: {
          userId: session.user.id,
          name: `SMS - ${businessName}`,
          type: 'sms',
          isActive: true,
          config: {
            accountSid: subclient.accountSid,
            authToken: subclient.authToken,
            phoneNumber: subclient.smsNumber,
            webhookUrl: smsWebhookUrl,
            subclient: true
          }
        }
      }),
      // Voicemail channel
      prisma.communicationChannel.create({
        data: {
          userId: session.user.id,
          name: `Voicemail - ${businessName}`,
          type: 'voicemail',
          isActive: true,
          config: {
            accountSid: subclient.accountSid,
            authToken: subclient.authToken,
            phoneNumber: subclient.smsNumber, // Same number for voicemail
            webhookUrl: voicemailWebhookUrl,
            subclient: true
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      channelId: channels[0].id, // WhatsApp channel
      phoneNumber: subclient.whatsappNumber,
      message: 'WhatsApp, SMS, and Voicemail connected successfully! You can now receive messages at your dedicated number.'
    })

  } catch (error) {
    console.error('WhatsApp connect error:', error)
    return NextResponse.json({ 
      error: 'Failed to connect WhatsApp. Please try again.' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's WhatsApp channels
    const channels = await prisma.communicationChannel.findMany({
      where: {
        userId: session.user.id,
        type: 'whatsapp',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        config: true,
        createdAt: true
      }
    })

    return NextResponse.json({ channels })

  } catch (error) {
    console.error('Error fetching WhatsApp channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}
