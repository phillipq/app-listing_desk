import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user (business owner)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return default context structure (context field not in schema yet)
    return NextResponse.json({
      context: {
        businessInfo: {
          name: "",
          description: "",
          services: [],
          specialties: [],
          location: "",
          hours: "",
          contactInfo: ""
        },
        additionalContext: ""
      }
    })

  } catch (error) {
    console.error('Context fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch context' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { context } = await request.json() as { context?: unknown }

    // Validate context structure
    if (!context || typeof context !== 'object') {
      return NextResponse.json(
        { error: 'Invalid context data' },
        { status: 400 }
      )
    }

    // Context field not in schema yet; accept payload but do not persist
    // TODO: Add context field to User model in Prisma schema

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Context update error:', error)
    return NextResponse.json(
      { error: 'Failed to update context' },
      { status: 500 }
    )
  }
}

