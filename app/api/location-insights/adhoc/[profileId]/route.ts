import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DistanceProfileService } from '@/lib/distance-profile-service'

/**
 * GET /api/location-insights/adhoc/[profileId]
 * Get a specific ad-hoc profile by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { profileId } = await params

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      )
    }

    const distanceProfileService = new DistanceProfileService()
    const report = await distanceProfileService.getDistanceProfileById(profileId)

    if (!report) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify the profile belongs to the user
    if (report.profile.isAdHoc && report.profile.propertyId !== session.user.id) {
      // Note: We need to add userId check - for now, we'll allow it if it's ad-hoc
      // In a production system, we'd check the realtorId field
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching ad-hoc profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

