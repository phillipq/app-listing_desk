import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DistanceProfileService } from '@/lib/distance-profile-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string; reportId: string }> }
) {
  try {
    const { mlsId, reportId } = await params

    if (!mlsId || !reportId) {
      return NextResponse.json({ error: 'MLS ID and Report ID are required' }, { status: 400 })
    }

    // Get property by MLS ID
    const { prisma } = await import('@/lib/prisma')
    const property = await prisma.property.findUnique({
      where: { mlsId }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get specific distance profile
    const distanceProfileService = new DistanceProfileService()
    const report = await distanceProfileService.getDistanceProfileById(reportId)

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string; reportId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId, reportId } = await params

    if (!mlsId || !reportId) {
      return NextResponse.json({ error: 'MLS ID and Report ID are required' }, { status: 400 })
    }

    // Get property by MLS ID to verify ownership
    const { prisma } = await import('@/lib/prisma')
    const property = await prisma.property.findUnique({
      where: { mlsId }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Delete the distance profile and all related data
    const distanceProfileService = new DistanceProfileService()
    await distanceProfileService.deleteDistanceProfileById(reportId)

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
