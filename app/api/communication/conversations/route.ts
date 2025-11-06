import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const channelId = searchParams.get('channelId')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      lead: {
        userId: user.id
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (channelId && channelId !== 'all') {
      where.channelId = channelId
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations = await (prisma as any).conversation.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        channel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
