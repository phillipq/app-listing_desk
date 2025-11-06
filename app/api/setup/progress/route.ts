import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all communication channels for the user
    const channels = await prisma.communicationChannel.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      select: {
        type: true,
        name: true,
        createdAt: true
      }
    })

    // Get Instagram social tokens
    const instagramTokens = await prisma.socialToken.findMany({
      where: {
        userId: session.user.id,
        platform: 'instagram',
        expiresAt: {
          gt: new Date() // Only active tokens
        }
      },
      select: {
        platform: true,
        createdAt: true
      }
    })

    // Determine which integrations are connected
    const connectedChannels = {
      whatsapp: channels.some(c => c.type === 'whatsapp'),
      instagram: instagramTokens.length > 0,
      sms: channels.some(c => c.type === 'sms'),
      voicemail: channels.some(c => c.type === 'voicemail')
    }

    // Calculate progress based on what's actually connected
    const totalPossible = Object.values(connectedChannels).length
    const connectedCount = Object.values(connectedChannels).filter(Boolean).length
    const progressPercentage = totalPossible > 0 ? Math.round((connectedCount / totalPossible) * 100) : 0

    return NextResponse.json({
      connectedChannels,
      progress: {
        connected: connectedCount,
        total: totalPossible,
        percentage: progressPercentage
      },
      channels: channels.map(c => ({
        type: c.type,
        name: c.name,
        connectedAt: c.createdAt
      })),
      instagram: instagramTokens.map(t => ({
        platform: t.platform,
        connectedAt: t.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching setup progress:', error)
    return NextResponse.json({ error: 'Failed to fetch setup progress' }, { status: 500 })
  }
}
