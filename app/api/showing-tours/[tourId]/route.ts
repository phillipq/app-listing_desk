import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tourId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tourId } = await params

    // Verify the tour belongs to the realtor
    const tour = await prisma.showingTour.findUnique({
      where: { id: tourId }
    })

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }

    // Delete the tour (cascade will handle related records)
    await prisma.showingTour.delete({
      where: {
        id: tourId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting showing tour:', error)
    return NextResponse.json({ error: 'Failed to delete tour' }, { status: 500 })
  }
}
