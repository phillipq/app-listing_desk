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

    const { businessName, existingNumber, integrationType } = await request.json() as { 
      businessName: string
      existingNumber: string
      integrationType: 'sms_voicemail' | 'whatsapp_sms_voicemail'
    }
    
    if (!businessName || !existingNumber) {
      return NextResponse.json({ error: 'Business name and phone number are required' }, { status: 400 })
    }

    // Check if user already has channels connected
    const existingChannels = await prisma.communicationChannel.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    if (existingChannels.length > 0) {
      return NextResponse.json({ 
        error: 'Communication channels are already connected. Please disconnect existing channels first.',
        existingChannels: existingChannels.map(c => ({ id: c.id, name: c.name, type: c.type }))
      }, { status: 400 })
    }

    // Verify phone number availability
    const verification = await twilioService.verifyPhoneNumberOwnership(existingNumber)
    
    if (!verification.available && !verification.canPort) {
      return NextResponse.json({ 
        error: `Phone number ${existingNumber} is not available for integration. ${verification.message}` 
      }, { status: 400 })
    }

    // Create Twilio subclient for this user
    const subclient = await twilioService.createSubclient(
      session.user.id,
      businessName
    )

    // Configure webhooks
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`
    const smsWebhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/sms`
    const voicemailWebhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/voicemail`
    
    // Integrate existing number
    const numberIntegration = await twilioService.integrateExistingNumber(
      subclient.accountSid,
      subclient.authToken,
      existingNumber,
      webhookUrl,
      smsWebhookUrl,
      voicemailWebhookUrl
    )

    // Store subclient credentials securely
    await prisma.socialToken.create({
      data: {
        userId: session.user.id,
        platform: 'twilio_existing_number',
        pageId: subclient.accountSid,
        accessToken: subclient.authToken,
        instagramBusinessId: existingNumber,
        metadata: {
          friendlyName: subclient.friendlyName,
          status: subclient.status,
          existingNumber: existingNumber,
          integrationType: integrationType,
          numberSid: numberIntegration.sid
        }
      }
    })

    // Create communication channels based on integration type
    const channels = []
    
    if (integrationType === 'whatsapp_sms_voicemail') {
      // WhatsApp channel (if number supports it)
      channels.push(
        prisma.communicationChannel.create({
          data: {
            userId: session.user.id,
            name: `WhatsApp - ${businessName}`,
            type: 'whatsapp',
            isActive: true,
            config: {
              accountSid: subclient.accountSid,
              authToken: subclient.authToken,
              phoneNumber: existingNumber,
              webhookUrl: webhookUrl,
              subclient: true,
              existingNumber: true
            }
          }
        })
      )
    }

    // SMS channel (always included)
    channels.push(
      prisma.communicationChannel.create({
        data: {
          userId: session.user.id,
          name: `SMS - ${businessName}`,
          type: 'sms',
          isActive: true,
          config: {
            accountSid: subclient.accountSid,
            authToken: subclient.authToken,
            phoneNumber: existingNumber,
            webhookUrl: smsWebhookUrl,
            subclient: true,
            existingNumber: true
          }
        }
      })
    )

    // Voicemail channel (always included)
    channels.push(
      prisma.communicationChannel.create({
        data: {
          userId: session.user.id,
          name: `Voicemail - ${businessName}`,
          type: 'voicemail',
          isActive: true,
          config: {
            accountSid: subclient.accountSid,
            authToken: subclient.authToken,
            phoneNumber: existingNumber,
            webhookUrl: voicemailWebhookUrl,
            subclient: true,
            existingNumber: true
          }
        }
      })
    )

    const createdChannels = await Promise.all(channels)
    if (!createdChannels.length) {
      return NextResponse.json({ error: 'Failed to create communication channels' }, { status: 500 })
    }
    const primaryChannel = createdChannels[0]
    if (!primaryChannel) {
      return NextResponse.json({ error: 'Failed to create primary communication channel' }, { status: 500 })
    }

    // Create voicemail greeting
    const voicemailGreeting = await twilioService.createVoicemailGreetingForSubclient(
      subclient.accountSid,
      subclient.authToken,
      businessName
    )

    return NextResponse.json({
      success: true,
      channelId: primaryChannel.id,
      phoneNumber: existingNumber,
      integrationType: integrationType,
      voicemailGreeting: voicemailGreeting.greeting ?? null,
      message: `Your existing number ${existingNumber} has been successfully integrated! You can now track SMS and voicemails through our platform.`,
      nextSteps: [
        'Update your voicemail greeting to the provided message',
        'Test SMS and voicemail functionality',
        'Monitor your unified inbox for incoming messages'
      ]
    })

  } catch (error) {
    console.error('Existing number connect error:', error)
    return NextResponse.json({ 
      error: 'Failed to integrate existing number. Please try again or contact support.' 
    }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's existing number channels
    const channels = await prisma.communicationChannel.findMany({
      where: {
        userId: session.user.id,
        type: { in: ['sms', 'voicemail', 'whatsapp'] },
        isActive: true,
        config: {
          path: ['existingNumber'],
          equals: true
        }
      },
      select: {
        id: true,
        name: true,
        type: true,
        config: true,
        createdAt: true
      }
    })

    return NextResponse.json({ channels })

  } catch (error) {
    console.error('Error fetching existing number channels:', error)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}
