'use client'

import { useEffect, useRef, useState } from 'react'

// Google Maps types
declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: unknown) => {
          fitBounds: (bounds: unknown) => void
        }
        Marker: new (options: unknown) => {
          setMap: (map: unknown | null) => void
          getPosition: () => { lat: () => number; lng: () => number } | null
          addListener: (event: string, handler: () => void) => void
        }
        InfoWindow: new (options: unknown) => {
          open: (map: unknown, marker: unknown) => void
        }
        LatLngBounds: new () => {
          extend: (location: unknown) => void
        }
        MapTypeId: {
          ROADMAP: string
        }
        SymbolPath: {
          CIRCLE: string
        }
      }
    }
  }
}

interface CategoryInfo {
  key: string
  label: string
  icon: string
  color: string
}

interface LocationInsightsMapProps {
  propertyLocation: { lat: number; lng: number }
  amenitiesByCategory: Record<string, Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    category: string
  }>>
  selectedCategories?: string[]
  categoryInfo?: CategoryInfo[]
  onCategoryToggle?: (category: string, isVisible: boolean) => void
}

export default function LocationInsightsMap({
  propertyLocation,
  amenitiesByCategory,
  selectedCategories: propSelectedCategories,
  categoryInfo,
  onCategoryToggle
}: LocationInsightsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const markersRef = useRef<unknown[]>([])
  const categoryMarkersRef = useRef<Record<string, unknown[]>>({})
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(
    new Set(propSelectedCategories || Object.keys(amenitiesByCategory))
  )

  // Category colors for markers (expanded list)
  const categoryColors: Record<string, string> = {
    elementary: '#FF6B6B',
    middle_school: '#4ECDC4',
    high_school: '#45B7D1',
    parks: '#96CEB4',
    daycare: '#FFEAA7',
    healthcare: '#FF7675',
    hospitals: '#DDA15E',
    shopping: '#74B9FF',
    dining: '#FD79A8',
    grocery: '#55A3FF',
    pharmacy: '#A29BFE',
    services: '#6C5CE7',
    gyms: '#FDCB6E',
    transit_stations: '#E17055',
    bank: '#00B894',
    banks: '#00B894',
    university: '#9B59B6',
    library: '#3498DB',
    nightlife: '#E74C3C',
    default: '#636E72'
  }

  // Category labels mapping
  const categoryLabels: Record<string, string> = {
    elementary: 'Elementary Schools',
    middle_school: 'Middle Schools',
    high_school: 'High Schools',
    parks: 'Parks',
    daycare: 'Daycare',
    healthcare: 'Healthcare',
    hospitals: 'Hospitals',
    shopping: 'Shopping',
    dining: 'Dining',
    grocery: 'Grocery Stores',
    pharmacy: 'Pharmacies',
    services: 'Services',
    gyms: 'Gyms & Fitness',
    transit_stations: 'Transit Stations',
    bank: 'Banks & ATMs',
    banks: 'Banks & ATMs',
    university: 'Universities',
    library: 'Libraries',
    nightlife: 'Nightlife'
  }

  // Category icons mapping
  const categoryIcons: Record<string, string> = {
    elementary: '🏫',
    middle_school: '🏫',
    high_school: '🏫',
    parks: '🌳',
    daycare: '👶',
    healthcare: '⚕️',
    hospitals: '🏥',
    shopping: '🛒',
    dining: '🍽️',
    grocery: '🛒',
    pharmacy: '💊',
    services: '🔧',
    gyms: '💪',
    transit_stations: '🚇',
    bank: '🏦',
    banks: '🏦',
    university: '🎓',
    library: '📚',
    nightlife: '🍻'
  }

  const handleCategoryToggle = (category: string) => {
    const newVisible = new Set(visibleCategories)
    const isCurrentlyVisible = newVisible.has(category)
    
    if (isCurrentlyVisible) {
      newVisible.delete(category)
      // Hide markers for this category
      const markers = categoryMarkersRef.current[category] || []
      markers.forEach(marker => {
        ;(marker as { setMap: (map: unknown) => void }).setMap(null)
      })
    } else {
      newVisible.add(category)
      // Show markers for this category
      const markers = categoryMarkersRef.current[category] || []
      const mapInstance = mapInstanceRef.current
      if (mapInstance) {
        markers.forEach(marker => {
          ;(marker as { setMap: (map: unknown) => void }).setMap(mapInstance)
        })
      }
    }
    
    setVisibleCategories(newVisible)
    if (onCategoryToggle) {
      onCategoryToggle(category, !isCurrentlyVisible)
    }
    
    // Refit bounds after toggling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (mapInstanceRef.current && win.google?.maps) {
      const gmaps = win.google.maps
      const bounds = new gmaps.LatLngBounds()
      bounds.extend(propertyLocation as never)
      
      // Include property marker and all visible category markers
      const allVisibleMarkers = [
        ...markersRef.current.filter(m => m !== null),
        ...Object.entries(categoryMarkersRef.current)
          .filter(([cat]) => newVisible.has(cat))
          .flatMap(([, markers]) => markers)
      ]
      
      if (allVisibleMarkers.length > 0) {
        allVisibleMarkers.forEach(marker => {
          const position = (marker as { getPosition: () => { lat: () => number; lng: () => number } | null }).getPosition()
          if (position) bounds.extend(position as never)
        })
        
        const map = mapInstanceRef.current as { fitBounds: (bounds: unknown) => void } | null
        if (map) {
          map.fitBounds(bounds)
        }
      }
    }
  }

  // Load Google Maps script
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (typeof window !== 'undefined' && win.google?.maps) {
      setIsLoaded(true)
      return
    }

    // Check if script already exists
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).google?.maps) {
          setIsLoaded(true)
          clearInterval(checkGoogle)
        }
      }, 100)
      return () => clearInterval(checkGoogle)
    }

    const script = document.createElement('script')
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    if (!apiKey) {
      console.warn('Google Maps API key not found')
      setLoadError(true)
      return
    }
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => {
      setLoadError(true)
      console.error('Failed to load Google Maps script')
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup not needed - script can stay loaded
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (!mapRef.current || !isLoaded || typeof window === 'undefined' || !win.google?.maps) return

    const gmaps = win.google.maps

    // Initialize map
    const map = new gmaps.Map(mapRef.current, {
      center: propertyLocation,
      zoom: 13,
      mapTypeId: gmaps.MapTypeId.ROADMAP
    } as never)

    mapInstanceRef.current = map

    // Add property marker (larger, different color)
    const propertyMarker = new gmaps.Marker({
      position: propertyLocation,
      map: map,
      title: 'Property Location',
      icon: {
        path: gmaps.SymbolPath.CIRCLE,
        scale: 14, // Increased from 10 to 14 for bigger property marker
        fillColor: '#16a085',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3 // Increased for better visibility
      }
    } as never)

    // Clear existing markers
    ;(markersRef.current as Array<{ setMap: (map: unknown) => void }>).forEach(marker => marker.setMap(null))
    Object.values(categoryMarkersRef.current).flat().forEach(marker => {
      ;(marker as { setMap: (map: unknown) => void }).setMap(null)
    })
    markersRef.current = [propertyMarker]
    categoryMarkersRef.current = {}

    // Add amenities markers by category
    const categoriesToShow = Array.from(visibleCategories).filter(cat => 
      amenitiesByCategory[cat] && amenitiesByCategory[cat].length > 0
    )
    
    categoriesToShow.forEach(category => {
      const amenities = amenitiesByCategory[category] || []
      const color = categoryColors[category] || categoryColors.default
      const categoryMarkerList: unknown[] = []

      amenities.forEach(amenity => {
        const marker = new gmaps.Marker({
          position: { lat: amenity.latitude, lng: amenity.longitude },
          map: map,
          title: amenity.name,
          icon: {
            path: gmaps.SymbolPath.CIRCLE,
            scale: 12, // Increased from 6 to 12 for bigger icons
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2 // Increased stroke weight for better visibility
          },
          label: {
            text: category.charAt(0).toUpperCase(),
            color: '#fff',
            fontSize: '12px', // Increased from 10px
            fontWeight: 'bold'
          }
        } as never)

        // Info window
        const infoWindow = new gmaps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <strong>${amenity.name}</strong>
              <div style="color: #666; font-size: 12px; margin-top: 4px;">${categoryLabels[category] || category}</div>
            </div>
          `
        } as never)

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
        })

        markersRef.current.push(marker)
        categoryMarkerList.push(marker)
      })

      categoryMarkersRef.current[category] = categoryMarkerList
    })

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new gmaps.LatLngBounds()
      bounds.extend(propertyLocation as never)
      ;(markersRef.current as Array<{ getPosition: () => { lat: () => number; lng: () => number } | null }>).forEach(marker => {
        const position = marker.getPosition()
        if (position) bounds.extend(position as never)
      })
      map.fitBounds(bounds)
    }

    return () => {
      ;(markersRef.current as Array<{ setMap: (map: unknown) => void }>).forEach(marker => marker.setMap(null))
      Object.values(categoryMarkersRef.current).flat().forEach(marker => {
        ;(marker as { setMap: (map: unknown) => void }).setMap(null)
      })
      markersRef.current = []
      categoryMarkersRef.current = {}
    }
  }, [propertyLocation, amenitiesByCategory, visibleCategories, isLoaded])

  // Update visible categories when prop changes or amenities change
  useEffect(() => {
    if (propSelectedCategories && propSelectedCategories.length > 0) {
      setVisibleCategories(new Set(propSelectedCategories))
    } else {
      // If no prop, show all categories with amenities by default
      const categoriesWithData = Object.keys(amenitiesByCategory).filter(
        cat => amenitiesByCategory[cat] && amenitiesByCategory[cat].length > 0
      )
      setVisibleCategories(new Set(categoriesWithData))
    }
  }, [propSelectedCategories, amenitiesByCategory])

  // Get all available categories from amenitiesByCategory
  const availableCategories = Object.keys(amenitiesByCategory).filter(
    cat => amenitiesByCategory[cat] && amenitiesByCategory[cat].length > 0
  )

  if (loadError) {
    return (
      <div className="w-full h-[500px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Failed to load Google Maps. Please check your API key configuration.</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] rounded-lg border border-gray-200 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Map */}
      <div 
        ref={mapRef} 
        className="w-full h-[500px] rounded-lg border border-gray-200"
        style={{ minHeight: '500px' }}
      />
      
      {/* Legend */}
      {availableCategories.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 max-h-[400px] overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Map Legend</h4>
          <div className="space-y-2">
            {availableCategories.map(category => {
              const color = categoryColors[category] || categoryColors.default
              const label = categoryInfo?.find(c => c.key === category)?.label || categoryLabels[category] || category
              const icon = categoryInfo?.find(c => c.key === category)?.icon || categoryIcons[category] || '📍'
              const isVisible = visibleCategories.has(category)
              const count = amenitiesByCategory[category]?.length || 0

              return (
                <label
                  key={category}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-keppel-600 focus:ring-keppel-500"
                  />
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: isVisible ? color : '#ccc' }}
                  />
                  <span className="text-sm text-gray-700 flex items-center space-x-1">
                    <span>{icon}</span>
                    <span>{label}</span>
                    <span className="text-xs text-gray-500">({count})</span>
                  </span>
                </label>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-keppel-500" />
              <span className="text-xs text-gray-600">Property Location</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

