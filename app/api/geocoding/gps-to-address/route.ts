import { NextRequest, NextResponse } from 'next/server'
import GoogleMapsService from '@/lib/google-maps-service'

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json() as { latitude?: number; longitude?: number }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinate values' },
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
    
    // Use reverse geocoding to get address from coordinates
    const address = await googleMaps.reverseGeocode({ lat: latitude, lng: longitude })

    if (!address) {
      return NextResponse.json(
        { error: 'Could not find address for the provided coordinates' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      address,
      coordinates: { lat: latitude, lng: longitude }
    })

  } catch (error) {
    console.error('Error reverse geocoding coordinates:', error)
    return NextResponse.json(
      { error: 'Failed to reverse geocode coordinates' },
      { status: 500 }
    )
  }
}
