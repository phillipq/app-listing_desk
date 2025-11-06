'use client'

import { useState } from 'react'

interface GeocodingHelperProps {
  onCoordinatesFound: (coordinates: { lat: number; lng: number }) => void
  onAddressFound: (address: string) => void
  onAddressParsed?: (parsed: { address: string; city: string; province: string; postalCode: string }) => void
  currentAddress?: string
  currentCoordinates?: { lat: number; lng: number }
}

export default function GeocodingHelper({ 
  onCoordinatesFound, 
  onAddressFound, 
  onAddressParsed,
  currentAddress = '',
  currentCoordinates 
}: GeocodingHelperProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressInput, setAddressInput] = useState(currentAddress)
  const [gpsInput, setGpsInput] = useState({
    lat: currentCoordinates?.lat.toString() || '',
    lng: currentCoordinates?.lng.toString() || ''
  })

  const handleAddressToGPS = async () => {
    if (!addressInput.trim()) {
      setError('Please enter an address')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/geocoding/address-to-gps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: addressInput })
      })

      const data = await response.json() as { 
        error?: string
        coordinates?: { lat: number; lng: number }
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get coordinates')
      }

      if (data.coordinates) {
        onCoordinatesFound(data.coordinates)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get coordinates')
    } finally {
      setLoading(false)
    }
  }

  const handleGPSToAddress = async () => {
    if (!currentCoordinates) {
      setError('No coordinates available')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/geocoding/gps-to-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: currentCoordinates.lat,
          longitude: currentCoordinates.lng
        })
      })

      const data = await response.json() as { 
        error?: string
        address?: string
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get address')
      }

      if (data.address) {
        onAddressFound(data.address)
        setAddressInput(data.address)
        
        // Always parse the address to extract components
        if (onAddressParsed) {
          const parsed = parseAddress(data.address)
          onAddressParsed(parsed)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get address')
    } finally {
      setLoading(false)
    }
  }

  const handleGPSInput = async () => {
    if (!gpsInput.lat.trim() || !gpsInput.lng.trim()) {
      setError('Please enter both latitude and longitude')
      return
    }

    const lat = parseFloat(gpsInput.lat)
    const lng = parseFloat(gpsInput.lng)

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid numbers for latitude and longitude')
      return
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90')
      return
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/geocoding/gps-to-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng
        })
      })

      const data = await response.json() as { 
        error?: string
        address?: string
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get address')
      }

      if (data.address) {
        onAddressFound(data.address)
        setAddressInput(data.address)
        
        // Always parse the address to extract components
        if (onAddressParsed) {
          const parsed = parseAddress(data.address)
          onAddressParsed(parsed)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get address')
    } finally {
      setLoading(false)
    }
  }

  // Function to parse address into components
  const parseAddress = (fullAddress: string) => {
    // Basic parsing - this could be enhanced with more sophisticated logic
    const parts = fullAddress.split(',').map(part => part.trim())
    
    const address = parts[0] || ''
    let city = ''
    let province = ''
    let postalCode = ''

    if (parts.length >= 2) {
      city = parts[1] || ''
    }
    
    if (parts.length >= 3) {
      // For Canadian addresses, look for postal code pattern in the third part
      const thirdPart = parts[2] || ''
      
      // Canadian postal code pattern: Letter-Number-Letter Number-Letter-Number
      const postalCodeMatch = thirdPart.match(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/)
      
      if (postalCodeMatch) {
        postalCode = postalCodeMatch[0]
        // Remove postal code from the third part to get province
        province = thirdPart.replace(postalCode, '').trim()
      } else {
        // No postal code found, use the third part as province
        province = thirdPart
      }
    }

    return {
      address,
      city,
      province,
      postalCode
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-blue-900 mb-3">📍 Location Helper</h3>
      
      {error && (
        <div className="mb-3 text-sm text-gray-700 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Address to GPS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Get GPS from Address
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter full address (e.g., 123 Main St, Vancouver, BC)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-transparent"
            />
            <button
              onClick={handleAddressToGPS}
              disabled={loading}
              className="px-4 py-2 bg-keppel-500 text-seasalt-500 text-sm rounded-md hover:bg-keppel-500 disabled:opacity-50"
            >
              {loading ? 'Getting...' : 'Get GPS'}
            </button>
          </div>
        </div>

        {/* Manual GPS Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Enter GPS Coordinates
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              step="any"
              value={gpsInput.lat}
              onChange={(e) => setGpsInput(prev => ({ ...prev, lat: e.target.value }))}
              placeholder="Latitude (e.g., 49.2827)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-transparent"
            />
            <input
              type="number"
              step="any"
              value={gpsInput.lng}
              onChange={(e) => setGpsInput(prev => ({ ...prev, lng: e.target.value }))}
              placeholder="Longitude (e.g., -123.1207)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-transparent"
            />
            <button
              onClick={handleGPSInput}
              disabled={loading}
              className="px-4 py-2 bg-buff-500 text-seasalt-500 text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Getting...' : 'Get Address'}
            </button>
          </div>
        </div>

        {/* GPS to Address (from current coordinates) */}
        {currentCoordinates && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Get Address from Current GPS
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentCoordinates.lat.toFixed(6)}, {currentCoordinates.lng.toFixed(6)}
              </span>
              <button
                onClick={handleGPSToAddress}
                disabled={loading}
                className="px-4 py-2 bg-buff-500 text-seasalt-500 text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Getting...' : 'Get Address'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        💡 Tip: Use this helper to automatically fill in coordinates or addresses using Google Maps
      </div>
    </div>
  )
}
