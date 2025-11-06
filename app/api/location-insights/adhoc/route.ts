import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DistanceProfileService } from '@/lib/distance-profile-service'

/**
 * POST /api/location-insights/adhoc
 * Generate a new ad-hoc location insights profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      address?: string
      latitude?: number
      longitude?: number
      categories?: Record<string, boolean>
      distances?: Record<string, number>
      profileName?: string
    }

    const { address, latitude, longitude, categories, distances, profileName } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const distanceProfileService = new DistanceProfileService()
    const profile = await distanceProfileService.generateDistanceProfile({
      realtorId: session.user.id,
      isAdHoc: true,
      adHocAddress: address || undefined,
      adHocLatitude: latitude,
      adHocLongitude: longitude,
      categories,
      distances,
      profileName
    })

    return NextResponse.json({
      success: true,
      profile,
      message: 'Ad-hoc location insights profile generated successfully'
    })
  } catch (error) {
    console.error('Error generating ad-hoc location insights:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate ad-hoc location insights' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/location-insights/adhoc
 * Get all ad-hoc profiles for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const distanceProfileService = new DistanceProfileService()
    const profiles = await distanceProfileService.getAdHocProfiles(session.user.id)

    return NextResponse.json(profiles)
  } catch (error) {
    console.error('Error fetching ad-hoc profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad-hoc profiles' },
      { status: 500 }
    )
  }
}

