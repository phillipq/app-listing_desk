import { NextRequest, NextResponse } from 'next/server'
import { DistanceProfileService } from '@/lib/distance-profile-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const { mlsId } = await params

    if (!mlsId) {
      return NextResponse.json({ error: 'MLS ID is required' }, { status: 400 })
    }

    // Get property by MLS ID
    const { prisma } = await import('@/lib/prisma')
    const property = await prisma.property.findUnique({
      where: { mlsId }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get all distance profiles for this property
    const distanceProfileService = new DistanceProfileService()
    const reports = await distanceProfileService.getAllDistanceProfiles(property.id)

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
