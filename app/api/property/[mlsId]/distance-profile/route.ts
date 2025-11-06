import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DistanceProfileService } from '@/lib/distance-profile-service'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId } = await params
    const body = await request.json().catch(() => ({})) as {
      refresh?: boolean;
      categories?: Record<string, boolean>;
      distances?: Record<string, number>;
      profileName?: string;
    }
    const { refresh, categories, distances, profileName } = body

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

    // If not refreshing, deactivate existing profiles first
    if (!refresh) {
      await prisma.distanceProfile.updateMany({
        where: {
          propertyId: property.id,
          isActive: true
        },
        data: {
          isActive: false
        }
      })
    }

    // Generate or refresh distance profile
    const distanceProfileService = new DistanceProfileService()
    const profile = await distanceProfileService.generateDistanceProfile({
      propertyId: property.id,
      realtorId: session.user.id,
      isAdHoc: false,
      categories,
      distances,
      profileName
    })

    return NextResponse.json({
      success: true,
      profile,
      message: refresh ? 'Distance profile refreshed successfully' : 'Distance profile generated successfully'
    })

  } catch (error) {
    console.error('Error generating distance profile:', error)
    return NextResponse.json(
      { error: 'Failed to generate distance profile' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId } = await params

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

    // Get existing distance profile
    const distanceProfileService = new DistanceProfileService()
    const profile = await distanceProfileService.getDistanceProfile(property.id)

    if (!profile) {
      return NextResponse.json(
        { error: 'No distance profile found for this property' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      profile
    })

  } catch (error) {
    console.error('Error fetching distance profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch distance profile' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId } = await params

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

    // Delete distance profile
    const distanceProfileService = new DistanceProfileService()
    await distanceProfileService.deleteDistanceProfile(property.id)

    return NextResponse.json({
      success: true,
      message: 'Distance profile deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting distance profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete distance profile' },
      { status: 500 }
    )
  }
}