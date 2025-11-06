import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
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

    const channels = await prisma.communicationChannel.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json() as { name?: string; type?: string; config?: Record<string, unknown> }
    const { name, type, config } = body

    if (!name || !type) {
      return NextResponse.json({ 
        error: 'Name and type are required' 
      }, { status: 400 })
    }

    const channel = await prisma.communicationChannel.create({
      data: {
        name,
        type,
        // Prisma JSON type - allow plain objects
        config: (config ?? {}) as unknown as Prisma.InputJsonValue,
        userId: user.id
      }
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
