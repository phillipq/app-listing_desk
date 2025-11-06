import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { ProximityPreference, proximityService } from '../../../../lib/proximity'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Get proximity preferences for the session
    const preferences = await proximityService.getProximityPreferences(sessionId)

    return NextResponse.json({
      success: true,
      preferences
    })

  } catch (error) {
    console.error('Error getting proximity preferences:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to get preferences', details: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId, preferences } = await request.json() as { sessionId?: string; preferences?: ProximityPreference }

    if (!sessionId || !preferences) {
      return NextResponse.json(
        { error: 'Session ID and preferences required' },
        { status: 400 }
      )
    }

    // Store proximity preferences
    await proximityService.storeProximityPreferences(sessionId, preferences)

    return NextResponse.json({
      success: true,
      message: 'Proximity preferences saved'
    })

  } catch (error) {
    console.error('Error saving proximity preferences:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to save preferences', details: message },
      { status: 500 }
    )
  }
}