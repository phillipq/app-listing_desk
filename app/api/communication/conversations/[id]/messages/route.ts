import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        lead: {
          userId: user.id
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: {
        leadId: conversation.leadId,
        channelId: conversation.channelId
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const body = await request.json() as { content?: string }
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ 
        error: 'Message content is required' 
      }, { status: 400 })
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        lead: {
          userId: user.id
        }
      },
      include: {
        lead: true,
        channel: true
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Create outgoing message
    const message = await prisma.message.create({
      data: {
        channelId: conversation.channelId,
        from: user.email || 'system',
        to: conversation.lead.email || conversation.lead.phone || 'unknown',
        content: content.trim(),
        timestamp: new Date(),
        isIncoming: false,
        platform: conversation.channel.type,
        leadId: conversation.leadId,
        userId: user.id,
        metadata: {
          type: 'outgoing',
          channel: conversation.channel.type
        }
      },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        status: 'active'
      }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
