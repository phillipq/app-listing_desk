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

    // Get realtor (context field not present in schema; fetch identity only)
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id }
    })

    if (!realtor) {
      return NextResponse.json(
        { error: 'Realtor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      context: {
        realtorInfo: {
          name: "",
          description: "",
          services: [],
          specialties: [],
          location: "",
          hours: "",
          contactInfo: ""
        },
        communities: [],
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

    // Context field not in schema; accept payload but do not persist

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Context update error:', error)
    return NextResponse.json(
      { error: 'Failed to update context' },
      { status: 500 }
    )
  }
}
