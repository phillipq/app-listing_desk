import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DistanceProfileService } from '@/lib/distance-profile-service'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string; reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId, reportId } = await params
    const body = await request.json().catch(() => ({})) as {
      distances?: Record<string, number>;
      refresh?: boolean;
    }
    const { distances, refresh } = body

    // Get the property
    const property = await prisma.property.findFirst({
      where: {
        mlsId: mlsId,
        status: 'active'
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check if property has coordinates
    if (!property.latitude || !property.longitude) {
      return NextResponse.json(
        { error: 'Property coordinates are required for distance profile generation' },
        { status: 400 }
      )
    }

    // Check if Google Maps API key is configured
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // Get the existing distance profile
    const distanceProfileService = new DistanceProfileService()
    const existingProfile = await distanceProfileService.getDistanceProfileById(reportId)
    
    if (!existingProfile) {
      return NextResponse.json({ error: 'Distance profile not found' }, { status: 404 })
    }

    // Update the profile with new radius settings
    const updatedProfile = await distanceProfileService.updateDistanceProfileRadius(
      reportId, 
      distances || {},
      refresh || false
    )

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: 'Search radius updated successfully'
    })

  } catch (error) {
    console.error('Error updating distance profile radius:', error)
    return NextResponse.json(
      { error: 'Failed to update distance profile radius' },
      { status: 500 }
    )
  }
}
