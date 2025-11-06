import { NextRequest, NextResponse } from 'next/server'
import GoogleMapsService from '@/lib/google-maps-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Address parameter is required' },
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

    const googleMaps = new GoogleMapsService()
    const coordinates = await googleMaps.geocodeAddress(address)

    if (!coordinates) {
      return NextResponse.json(
        { error: 'Could not find coordinates for the provided address' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      address
    })

  } catch (error) {
    console.error('Error geocoding address:', error)
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    )
  }
}
