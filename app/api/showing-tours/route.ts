import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tours = await prisma.showingTour.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tours)
  } catch (error) {
    console.error('Error fetching showing tours:', error)
    return NextResponse.json({ error: 'Failed to fetch tours' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      name?: string
      description?: string | null
      showingDate?: string | null
      startTime?: string | null
      endTime?: string | null
      showingDuration?: number | null
      startTimeType?: string | null
      properties?: Array<{ id: string; mlsId: string; address: string; latitude: number; longitude: number }>
      schedule?: {
        totalDuration: number
        canFitInWindow: boolean
        startTime: string
        endTime: string
        totalDriveTime: number
        totalShowingTime: number
        scheduleItems: unknown
        googleMapsUrl?: string | null
      }
    }
    const { name, description, showingDate: _showingDate, startTime: _startTime, endTime: _endTime, showingDuration: _showingDuration, startTimeType: _startTimeType, properties, schedule } = body

    if (!name || !properties || properties.length === 0) {
      return NextResponse.json({ error: 'Name and properties are required' }, { status: 400 })
    }

    // Create the tour
    const tour = {
      id: `tour_${Math.random().toString(36).slice(2)}`,
      name: name ?? '',
      description: description ?? null
    }

    // Create tour properties
    const tourProperties = properties

    // Create schedule if provided
    const tourSchedule = schedule ?? null

    return NextResponse.json({
      ...tour,
      properties: tourProperties,
      schedule: tourSchedule
    })
  } catch (error) {
    console.error('Error creating showing tour:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create tour', details: message }, { status: 500 })
  }
}
