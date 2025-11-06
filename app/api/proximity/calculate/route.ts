import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { googleMapsService } from '../../../../lib/google-maps'
import { proximityService } from '../../../../lib/proximity'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { propertyId, address, coordinates } = await request.json() as {
      propertyId?: string
      address?: string
      coordinates?: { latitude: number; longitude: number }
    }

    if (!propertyId && !address && !coordinates) {
      return NextResponse.json(
        { error: 'Property ID, address, or coordinates required' },
        { status: 400 }
      )
    }

    console.log('🎯 Calculating proximity data...')

    let location: { latitude: number; longitude: number }

    if (coordinates) {
      // Use provided coordinates
      location = coordinates
    } else if (address) {
      // Geocode the address
      const geocodeResult = await googleMapsService.geocodeAddress(address)
      if (!geocodeResult) {
        return NextResponse.json(
          { error: 'Could not geocode address' },
          { status: 400 }
        )
      }
      location = {
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude
      }
    } else {
      return NextResponse.json(
        { error: 'Coordinates or address required' },
        { status: 400 }
      )
    }

    // Calculate proximity data
    const proximityData = await googleMapsService.calculatePropertyProximity(location)

    // If we have a propertyId, store the proximity data
    if (propertyId) {
      await proximityService.calculatePropertyProximity(propertyId)
    }

    return NextResponse.json({
      success: true,
      location,
      proximityData,
      count: proximityData.length
    })

  } catch (error) {
    console.error('Error calculating proximity:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Proximity calculation failed', details: message },
      { status: 500 }
    )
  }
}