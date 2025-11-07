'use client'

import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
// DashboardLayout is now handled by the parent layout
import GeocodingHelper from '@/components/GeocodingHelper'
import LocationInsightsMap from '@/components/LocationInsightsMap'


type LocationInsightsConfigProps = {
  onGenerate: (config: Record<string, unknown>) => void | Promise<void>
  onSaveProfile: () => void
  onBack: () => void
  isGenerating: boolean
  generationProgress: number
}

// Pre-defined profile templates
const PROFILE_TEMPLATES = [
  {
    id: 'family',
    name: 'Family Living',
    description: 'Schools, parks, daycare, grocery stores',
    categories: {
      elementary: true,
      middle_school: true,
      high_school: true,
      parks: true,
      daycare: true,
      healthcare: true,
      shopping: true,
      dining: true,
      grocery: true,
      pharmacy: true
    },
    defaultDistances: {
      elementary: 3,
      middle_school: 3,
      high_school: 5,
      parks: 3,
      daycare: 3,
      healthcare: 5,
      shopping: 5,
      dining: 3,
      grocery: 3,
      pharmacy: 2
    }
  },
  {
    id: 'urban',
    name: 'Urban Living',
    description: 'Transit, dining, shopping, nightlife',
    categories: {
      transit_stations: true,
      dining: true,
      shopping: true,
      gyms: true,
      services: true,
      bank: true,
      nightlife: true
    },
    defaultDistances: {
      transit_stations: 2,
      dining: 3,
      shopping: 5,
      gyms: 3,
      services: 2,
      bank: 2,
      nightlife: 3
    }
  },
  {
    id: 'student',
    name: 'Student Focus',
    description: 'Universities, libraries, transit, dining',
    categories: {
      university: true,
      library: true,
      transit_stations: true,
      dining: true,
      gyms: true,
      grocery: true
    },
    defaultDistances: {
      university: 5,
      library: 3,
      transit_stations: 2,
      dining: 3,
      gyms: 3,
      grocery: 3
    }
  },
  {
    id: 'senior',
    name: 'Senior Living',
    description: 'Hospitals, healthcare, pharmacies, parks',
    categories: {
      hospitals: true,
      healthcare: true,
      pharmacy: true,
      parks: true,
      grocery: true,
      bank: true
    },
    defaultDistances: {
      hospitals: 5,
      healthcare: 3,
      pharmacy: 2,
      parks: 2,
      grocery: 2,
      bank: 2
    }
  },
  {
    id: 'healthcare',
    name: 'Healthcare Focus',
    description: 'Hospitals, healthcare, pharmacies',
    categories: {
      hospitals: true,
      healthcare: true,
      pharmacy: true,
      services: true
    },
    defaultDistances: {
      hospitals: 10,
      healthcare: 5,
      pharmacy: 3,
      services: 2
    }
  },
  {
    id: 'complete',
    name: 'Complete Profile',
    description: 'All categories for comprehensive insights',
    categories: {
      elementary: true,
      middle_school: true,
      high_school: true,
      hospitals: true,
      parks: true,
      shopping: true,
      dining: true,
      services: true,
      gyms: true,
      transit_stations: true,
      daycare: true,
      healthcare: true,
      grocery: true,
      pharmacy: true,
      bank: true,
      library: true,
      university: true,
      nightlife: true
    },
    defaultDistances: {
      elementary: 3,
      middle_school: 3,
      high_school: 5,
      hospitals: 10,
      parks: 3,
      shopping: 5,
      dining: 3,
      services: 2,
      gyms: 3,
      transit_stations: 2,
      daycare: 3,
      healthcare: 5,
      grocery: 3,
      pharmacy: 2,
      bank: 2,
      library: 3,
      university: 5,
      nightlife: 3
    }
  }
]

// Category descriptions - what's included in each category
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  elementary: 'Elementary schools and primary education',
  middle_school: 'Middle schools and junior high schools',
  high_school: 'High schools and secondary schools',
  hospitals: 'Hospitals, medical centers, urgent care, and emergency facilities',
  parks: 'Parks, recreation areas, and outdoor spaces',
  shopping: 'Shopping malls, department stores, and retail centers',
  dining: 'Restaurants, cafes, food establishments, and meal takeaway',
  services: 'Banks, ATMs, gas stations, car repair shops, car washes, laundry, and general services',
  gyms: 'Gyms, fitness centers, and exercise facilities',
  transit_stations: 'Transit stations, bus stations, subway stations, and public transportation',
  daycare: 'Daycare centers and child care facilities',
  healthcare: 'Healthcare facilities, clinics, and medical services',
  grocery: 'Grocery stores and supermarkets',
  pharmacy: 'Pharmacies and drugstores',
  bank: 'Banks and ATMs',
  university: 'Universities and colleges',
  library: 'Libraries and public reading spaces',
  nightlife: 'Bars, nightclubs, lounges, and evening entertainment'
}

// Available categories with labels, default distances, and descriptions
const CATEGORIES = [
  { key: 'elementary', label: 'Elementary Schools', defaultDistance: 3, icon: '🏫' },
  { key: 'middle_school', label: 'Middle Schools', defaultDistance: 3, icon: '🏫' },
  { key: 'high_school', label: 'High Schools', defaultDistance: 5, icon: '🏫' },
  { key: 'hospitals', label: 'Hospitals', defaultDistance: 10, icon: '🏥' },
  { key: 'parks', label: 'Parks', defaultDistance: 3, icon: '🌳' },
  { key: 'shopping', label: 'Shopping', defaultDistance: 5, icon: '🛒' },
  { key: 'dining', label: 'Dining', defaultDistance: 3, icon: '🍽️' },
  { key: 'services', label: 'Services', defaultDistance: 2, icon: '🔧' },
  { key: 'gyms', label: 'Gyms & Fitness', defaultDistance: 3, icon: '💪' },
  { key: 'transit_stations', label: 'Transit Stations', defaultDistance: 2, icon: '🚇' },
  { key: 'daycare', label: 'Daycare', defaultDistance: 3, icon: '👶' },
  { key: 'healthcare', label: 'Healthcare', defaultDistance: 5, icon: '⚕️' },
  { key: 'grocery', label: 'Grocery Stores', defaultDistance: 3, icon: '🛒' },
  { key: 'pharmacy', label: 'Pharmacies', defaultDistance: 2, icon: '💊' },
  { key: 'bank', label: 'Banks & ATMs', defaultDistance: 2, icon: '🏦' },
  { key: 'university', label: 'Universities', defaultDistance: 5, icon: '🎓' },
  { key: 'library', label: 'Libraries', defaultDistance: 3, icon: '📚' },
  { key: 'nightlife', label: 'Nightlife', defaultDistance: 3, icon: '🍻' }
]

function LocationInsightsConfig({ onGenerate, onSaveProfile, onBack, isGenerating, generationProgress }: LocationInsightsConfigProps) {
  const [profileName, setProfileName] = useState('Location Insights')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  // Initialize state from CATEGORIES array
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    CATEGORIES.forEach(cat => {
      initial[cat.key] = false
    })
    return initial
  })
  
  const [categoryDistances, setCategoryDistances] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    CATEGORIES.forEach(cat => {
      initial[cat.key] = cat.defaultDistance
    })
    return initial
  })
  
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const handleTemplateSelect = (templateId: string) => {
    const template = PROFILE_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setProfileName(template.name)
      // Reset all categories first, then set only the template's categories
      const resetCategories: Record<string, boolean> = {}
      CATEGORIES.forEach(cat => {
        resetCategories[cat.key] = false
      })
      Object.entries(template.categories).forEach(([key, value]) => {
        resetCategories[key] = value === true
      })
      setSelectedCategories(resetCategories)
      
      // Reset distances to defaults, then apply template distances
      const resetDistances: Record<string, number> = {}
      CATEGORIES.forEach(cat => {
        resetDistances[cat.key] = cat.defaultDistance
      })
      Object.entries(template.defaultDistances).forEach(([key, value]) => {
        resetDistances[key] = value
      })
      setCategoryDistances(resetDistances)
    }
  }

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }))
  }

  const handleDistanceChange = (categoryKey: string, distance: number) => {
    setCategoryDistances(prev => ({
      ...prev,
      [categoryKey]: distance
    }))
  }

  const handleGenerate = () => {
    // Build categories object with radius and limit for each selected category
    const categories: Record<string, { radius: number; limit: number }> = {}
    
    Object.keys(selectedCategories).forEach(key => {
      if (selectedCategories[key]) {
        const categoryInfo = CATEGORIES.find(c => c.key === key)
        const distanceKm = categoryDistances[key] || categoryInfo?.defaultDistance || 3
        categories[key] = {
          radius: distanceKm * 1000, // Convert km to meters
          limit: key === 'hospitals' || key === 'healthcare' || key === 'transit_stations' || key === 'daycare' || key === 'gyms' ? 5 : 10
        }
      }
    })

    // Build distances object (km to meters conversion happens in API)
    const distances: Record<string, number> = {}
    Object.keys(selectedCategories).forEach(key => {
      if (selectedCategories[key]) {
        const categoryInfo = CATEGORIES.find(c => c.key === key)
        distances[key] = categoryDistances[key] || categoryInfo?.defaultDistance || 3
      }
    })

    onGenerate({ profileName, categories, distances })
  }

  const hasSelectedCategories = Object.values(selectedCategories).some(v => v)

  return (
    <div className="space-y-6">
      {/* Profile Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name</label>
        <input
          type="text"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
          placeholder="e.g., Schools & Parks"
        />
      </div>

      {/* Pre-defined Templates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Pre-defined Profiles</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROFILE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-keppel-500 bg-keppel-50'
                  : 'border-gray-200 hover:border-keppel-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{template.name}</div>
              <div className="text-sm text-gray-500 mt-1">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Categories <span className="text-gray-400">(or customize below)</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => {
            const description = CATEGORY_DESCRIPTIONS[category.key] || 'No description available'
            return (
              <div 
                key={category.key} 
                className="relative flex items-start space-x-2"
                onMouseEnter={() => setHoveredCategory(category.key)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <input
                  type="checkbox"
                  id={`category-${category.key}`}
                  checked={selectedCategories[category.key] || false}
                  onChange={() => handleCategoryToggle(category.key)}
                  className="mt-1 h-4 w-4 text-keppel-600 focus:ring-keppel-500 border-gray-300 rounded"
                />
                <label htmlFor={`category-${category.key}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center space-x-1">
                    <span>{category.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{category.label}</span>
                    <span className="text-xs text-keppel-600 cursor-help" title={description}>
                      ℹ️
                    </span>
                  </div>
                  {/* Tooltip showing what's included - positioned above to avoid covering slider */}
                  {hoveredCategory === category.key && !selectedCategories[category.key] && (
                    <div className="absolute left-0 bottom-full mb-2 z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none">
                      <div className="font-semibold mb-1">{category.label}</div>
                      <div>{description}</div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                  {/* Alternative tooltip position when category is selected - to the side */}
                  {hoveredCategory === category.key && selectedCategories[category.key] && (
                    <div className="absolute left-full ml-2 top-0 z-10 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg pointer-events-none">
                      <div className="font-semibold mb-1">{category.label}</div>
                      <div>{description}</div>
                      {/* Arrow pointing left */}
                      <div className="absolute right-full top-4 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                  {selectedCategories[category.key] && (
                    <div className="mt-2 w-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">
                          {categoryDistances[category.key] || category.defaultDistance} km
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        step={0.5}
                        value={categoryDistances[category.key] || category.defaultDistance}
                        onChange={(e) => handleDistanceChange(category.key, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, #16a085 0%, #16a085 ${((categoryDistances[category.key] || category.defaultDistance) / 20) * 100}%, #e5e7eb ${((categoryDistances[category.key] || category.defaultDistance) / 20) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                    </div>
                  )}
                </label>
              </div>
            )
          })}
        </div>
      </div>


      {isGenerating && (
        <div className="w-full bg-gray-100 rounded h-2">
          <div className="bg-keppel-500 h-2 rounded transition-all" style={{ width: `${generationProgress}%` }} />
        </div>
      )}

      <div className="flex justify-between pt-4 border-t">
        <button onClick={onBack} className="px-4 py-2 text-gray-500 hover:text-gray-700">← Back</button>
        <div className="space-x-3">
          <button onClick={onSaveProfile} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Save Profile</button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !hasSelectedCategories}
            className="px-6 py-2 bg-keppel-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isGenerating ? `Generating... ${generationProgress}%` : 'Generate Insights'}
          </button>
        </div>
      </div>
    </div>
  )
}

type DistanceProfileTabProps = { 
  property: ManualProperty
  reportId: string | null
}

interface TravelTimeData {
  drivingTime: number | null
  walkingTime: number | null
  transitTime: number | null
  distance: number | null
}

interface AmenityData {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  rating: number | null
  travelTimes: TravelTimeData[]
}

interface ReportData {
  profile: {
    profileName?: string
    [key: string]: unknown
  }
  amenitiesByCategory: Record<string, AmenityData[]>
  summary: {
    totalAmenities?: number
    averageTime?: number
    [key: string]: unknown
  }
}

function DistanceProfileTab({ property, reportId }: DistanceProfileTabProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // Get property coordinates for map (moved before conditional returns)
  const propertyLocation = useMemo(() => {
    return property.latitude && property.longitude
      ? { lat: property.latitude, lng: property.longitude }
      : null
  }, [property.latitude, property.longitude])

  // Prepare amenities data for map (with category info) - moved before conditional returns
  const amenitiesByCategory = reportData?.amenitiesByCategory || {}
  const amenitiesForMap = useMemo(() => {
    const mapData: Record<string, Array<{ id: string; name: string; latitude: number; longitude: number; category: string }>> = {}
    Object.entries(amenitiesByCategory).forEach(([category, amenities]) => {
      mapData[category] = amenities.map(amenity => ({
        id: amenity.id,
        name: amenity.name,
        latitude: amenity.latitude,
        longitude: amenity.longitude,
        category
      }))
    })
    return mapData
  }, [amenitiesByCategory])

  useEffect(() => {
    if (!reportId) return

    const fetchReportData = async () => {
      try {
        setLoading(true)
        // Check if this is an ad-hoc profile (profileId matches reportId and no mlsId)
        const isAdHoc = property.mlsId === reportId || !property.mlsId || property.mlsId.startsWith('adhoc')
        const endpoint = isAdHoc 
          ? `/api/location-insights/adhoc/${reportId}`
          : `/api/property/${property.mlsId}/distance-profile/${reportId}`
        
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json() as ReportData
          console.log('📊 Fetched report data:', {
            profile: data.profile,
            amenitiesByCategory: data.amenitiesByCategory ? Object.keys(data.amenitiesByCategory) : 'empty',
            totalCategories: data.amenitiesByCategory ? Object.keys(data.amenitiesByCategory).length : 0,
            summary: data.summary
          })
          setReportData(data)
        } else {
          const errorData = await response.json()
          console.error('❌ Failed to fetch report:', errorData)
        }
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [reportId, property.mlsId])

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500">No report data available</p>
      </div>
    )
  }

  const profile = reportData.profile
  const summary = reportData.summary || {}

  const handleGeneratePdf = async () => {
    if (!reportId) return
    
    try {
      setGeneratingPdf(true)
      
      // Determine if this is an ad-hoc profile
      const isAdHoc = property.mlsId === reportId || !property.mlsId || property.mlsId.startsWith('adhoc')
      
      // For ad-hoc profiles, we'll use the reportId as the mlsId
      // The PDF route uses getDistanceProfileById which works for both types
      const mlsIdForPdf = isAdHoc ? reportId : property.mlsId
      
      if (!mlsIdForPdf) {
        alert('Unable to generate PDF: Missing property identifier')
        return
      }
      
      // Generate PDF URL - the route works with reportId regardless of mlsId
      const pdfUrl = `/api/property/${mlsIdForPdf}/distance-profile/${reportId}/pdf`
      
      // Fetch the PDF
      const response = await fetch(pdfUrl)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('PDF generation failed:', errorText)
        throw new Error('Failed to generate PDF')
      }
      
      // Get the PDF blob
      const blob = await response.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fileName = isAdHoc 
        ? `location-insights-adhoc-${reportId}.pdf`
        : `location-insights-${mlsIdForPdf}-${reportId}.pdf`
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGeneratingPdf(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with PDF button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Location Insights Report</h2>
          <p className="text-sm text-gray-500 mt-1">
            {profile?.profileName || 'Custom Profile'} • Generated {(() => {
              const createdAt = profile?.createdAt
              if (!createdAt) return 'N/A'
              if (typeof createdAt === 'string' || typeof createdAt === 'number' || createdAt instanceof Date) {
                return new Date(createdAt).toLocaleDateString()
              }
              return 'N/A'
            })()}
          </p>
        </div>
        <button
          onClick={handleGeneratePdf}
          disabled={generatingPdf || !reportData}
          className="px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {generatingPdf ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate PDF
            </>
          )}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-keppel-600">{summary.totalAmenities || 0}</div>
          <div className="text-sm text-gray-500">Total Amenities</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{summary.averageTime ? `${Math.round(summary.averageTime)} min` : 'N/A'}</div>
          <div className="text-sm text-gray-500">Avg Travel Time</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{Object.keys(amenitiesByCategory).length}</div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-semibold text-green-600 truncate">{profile?.profileName || 'N/A'}</div>
          <div className="text-xs text-gray-500 mt-1">Profile Name</div>
        </div>
      </div>

      {/* Google Maps */}
      {propertyLocation && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Location Map</h3>
          <LocationInsightsMap
            propertyLocation={propertyLocation}
            amenitiesByCategory={amenitiesForMap}
          />
        </div>
      )}

      {/* Categories - Column Layout */}
      {Object.keys(amenitiesByCategory).length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(amenitiesByCategory).map(([category, amenities]) => {
            if (!Array.isArray(amenities) || amenities.length === 0) return null
            
            return (
              <CategoryCard
                key={category}
                category={category}
                amenities={amenities}
                propertyLocation={propertyLocation}
              />
            )
          }).filter(Boolean)}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          <p className="mb-2">No amenities found for this profile</p>
          <p className="text-xs text-gray-400">
            {summary.totalAmenities ? `Note: ${summary.totalAmenities} amenities were saved, but categories may not be properly grouped.` : 'The profile may still be generating. Please wait or refresh.'}
          </p>
        </div>
      )}
    </div>
  )
}

// Category Card Component with Collapsible and Selection
function CategoryCard({ category, amenities, propertyLocation }: { category: string; amenities: AmenityData[]; propertyLocation?: { lat: number; lng: number } | null }) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set(amenities.map(a => a.id)))

  const categoryInfo = CATEGORIES.find(c => c.key === category) || { label: category, icon: '📍' }

  // Calculate average travel times for selected amenities
  const averageTimes = useMemo(() => {
    const selected = amenities.filter(a => selectedAmenities.has(a.id))
    if (selected.length === 0) return { driving: null, transit: null, walking: null }

    const times = {
      driving: [] as number[],
      transit: [] as number[],
      walking: [] as number[]
    }

    selected.forEach(amenity => {
      const travelTime = amenity.travelTimes?.[0]
      if (travelTime) {
        if (travelTime.drivingTime !== null) times.driving.push(travelTime.drivingTime)
        if (travelTime.transitTime !== null) times.transit.push(travelTime.transitTime)
        if (travelTime.walkingTime !== null) times.walking.push(travelTime.walkingTime)
      }
    })

    return {
      driving: times.driving.length > 0 ? Math.round(times.driving.reduce((a: number, b: number) => a + b, 0) / times.driving.length) : null,
      transit: times.transit.length > 0 ? Math.round(times.transit.reduce((a: number, b: number) => a + b, 0) / times.transit.length) : null,
      walking: times.walking.length > 0 ? Math.round(times.walking.reduce((a: number, b: number) => a + b, 0) / times.walking.length) : null
    }
  }, [amenities, selectedAmenities])

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => {
      const next = new Set(prev)
      if (next.has(amenityId)) {
        next.delete(amenityId)
      } else {
        next.add(amenityId)
      }
      return next
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Category Header - Clickable to collapse/expand */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{categoryInfo.icon}</span>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-700">
              {categoryInfo.label}
            </h3>
            <div className="text-sm text-gray-500">
              {amenities.length} {amenities.length === 1 ? 'location' : 'locations'}
              {averageTimes.driving !== null && (
                <span className="ml-2">• Avg: {averageTimes.driving} min drive</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Average Times Display */}
          <div className="flex items-center space-x-3 text-sm">
            {averageTimes.driving !== null && (
              <span className="text-blue-600">🚗 {averageTimes.driving} min</span>
            )}
            {averageTimes.transit !== null && (
              <span className="text-purple-600">🚌 {averageTimes.transit} min</span>
            )}
            {averageTimes.walking !== null && (
              <span className="text-green-600">🚶 {averageTimes.walking} min</span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Collapsible Content - Table Format */}
      {!isCollapsed && (
        <div className="border-t border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.size === amenities.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAmenities(new Set(amenities.map(a => a.id)))
                        } else {
                          setSelectedAmenities(new Set())
                        }
                      }}
                      className="h-4 w-4 text-keppel-600 focus:ring-keppel-500 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Google Rating
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-blue-600 uppercase tracking-wider">
                    Drive Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-purple-600 uppercase tracking-wider">
                    Transit Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
                    Walking Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Directions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {amenities.map((amenity) => {
                  const travelTime = amenity.travelTimes?.[0]
                  const isSelected = selectedAmenities.has(amenity.id)

                  return (
                    <tr
                      key={amenity.id}
                      className={isSelected ? 'bg-keppel-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAmenity(amenity.id)}
                          className="h-4 w-4 text-keppel-600 focus:ring-keppel-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{amenity.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{amenity.address || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">
                          {amenity.rating ? (
                            <span className="flex items-center justify-center">
                              <span className="mr-1">⭐</span>
                              <span className="font-semibold">{amenity.rating.toFixed(1)}</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-blue-600">
                          {travelTime?.drivingTime !== null && travelTime?.drivingTime !== undefined
                            ? `${travelTime.drivingTime} min`
                            : <span className="text-gray-400">N/A</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-purple-600">
                          {travelTime?.transitTime !== null && travelTime?.transitTime !== undefined
                            ? `${travelTime.transitTime} min`
                            : <span className="text-gray-400">N/A</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-green-600">
                          {travelTime?.walkingTime !== null && travelTime?.walkingTime !== undefined
                            ? `${travelTime.walkingTime} min`
                            : <span className="text-gray-400">N/A</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {propertyLocation ? (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${propertyLocation.lat},${propertyLocation.lng}&destination=${amenity.latitude},${amenity.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-keppel-600 hover:text-keppel-700 hover:bg-keppel-50 rounded-md transition-colors"
                            title="Open directions in Google Maps"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Directions
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


interface ManualProperty {
  id: string
  mlsId: string
  address: string
  city: string
  province: string
  postalCode?: string
  latitude?: number
  longitude?: number
}

interface LocationInsightsReport {
  id: string
  reportName: string
  generatedAt: string
  propertyId: string
  mlsId: string
  address: string
}

interface AdHocProfile {
  id: string
  reportName: string
  address: string
  latitude: number | null
  longitude: number | null
  generatedAt: string
  totalAmenities: number
  averageTime: number
}

export default function LocationInsightsPage() {
  const { data: _session } = useSession()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'adhoc' | 'property'>('adhoc')
  const [currentStep, setCurrentStep] = useState<'input' | 'config' | 'results'>('input')
  const [selectedProperty, setSelectedProperty] = useState<ManualProperty | null>(null)
  const [manualProperties, setManualProperties] = useState<ManualProperty[]>([])
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [availableReports, setAvailableReports] = useState<LocationInsightsReport[]>([])
  const [adHocProfiles, setAdHocProfiles] = useState<AdHocProfile[]>([])
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [currentReport, setCurrentReport] = useState<ReportData | null>(null)
  const [selectedAdHocProfileId, setSelectedAdHocProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [initializedFromUrl, setInitializedFromUrl] = useState(false)

  // Load manual properties and ad-hoc profiles on component mount
  useEffect(() => {
    fetchManualProperties()
    fetchAdHocProfiles() // Always fetch ad-hoc profiles on mount
  }, [])

  // Re-fetch profiles when tab changes
  useEffect(() => {
    if (activeTab === 'adhoc') {
      fetchAdHocProfiles()
    } else if (activeTab === 'property') {
      fetchManualProperties()
    }
  }, [activeTab])

  // Handle URL query parameters to directly open a report
  useEffect(() => {
    if (initializedFromUrl) return // Only run once
    
    const propertyParam = searchParams.get('property')
    const reportParam = searchParams.get('report')
    
    if (!propertyParam || !reportParam) {
      setInitializedFromUrl(true)
      return
    }
    
    // Wait for manual properties to load before trying to find the property
    if (manualProperties.length === 0) {
      return // Will retry when manualProperties updates
    }
    
    // Find the property by mlsId
    const property = manualProperties.find(p => p.mlsId === propertyParam)
    
    if (!property) {
      setInitializedFromUrl(true)
      return
    }
    
    // Switch to property tab
    setActiveTab('property')
    
    // Select the property
    setSelectedProperty(property)
    setCoordinates({ lat: property.latitude!, lng: property.longitude! })
    setAddress(`${property.address}, ${property.city}, ${property.province}`)
    
    // Fetch reports and select the specific one (skip auto-select since we have a specific report)
    fetchReports(property.mlsId, true).then(reports => {
      const targetReport = reports.find(r => r.id === reportParam)
      if (targetReport) {
        setSelectedReportId(targetReport.id)
        // Fetch full report data
        fetch(`/api/property/${property.mlsId}/distance-profile/${targetReport.id}`)
          .then(res => res.json() as Promise<ReportData>)
          .then(data => {
            setCurrentReport(data)
            setCurrentStep('results')
            setInitializedFromUrl(true)
          })
          .catch(err => {
            console.error('Error fetching report:', err)
            setInitializedFromUrl(true)
          })
      } else {
        setInitializedFromUrl(true)
      }
    }).catch(err => {
      console.error('Error fetching reports:', err)
      setInitializedFromUrl(true)
    })
  }, [searchParams, manualProperties, initializedFromUrl])

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  const fetchManualProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/property/manual')
      const data = await response.json() as { 
        properties?: ManualProperty[]
        error?: string
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch properties')
      }
      
      setManualProperties(data.properties || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdHocProfiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/location-insights/adhoc')
      if (response.ok) {
        const profiles = await response.json() as AdHocProfile[]
        setAdHocProfiles(profiles)
      } else {
        console.error('Failed to fetch ad-hoc profiles')
      }
    } catch (err) {
      console.error('Error fetching ad-hoc profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCoordinatesFound = (coords: { lat: number; lng: number }) => {
    setCoordinates(coords)
  }

  const handleAddressFound = (addr: string) => {
    setAddress(addr)
  }

  const handlePropertySelect = async (property: ManualProperty) => {
    setSelectedProperty(property)
    setCoordinates({ lat: property.latitude!, lng: property.longitude! })
    setAddress(`${property.address}, ${property.city}, ${property.province}`)
    
    // Check if this property has existing reports
    try {
      const reports = await fetchReports(property.mlsId)
      if (reports.length > 0) {
        // Has reports, go to results
        setCurrentStep('results')
        const newestReport = reports[0]
        if (newestReport) {
          setSelectedReportId(newestReport.id)
          // Fetch full report data
          fetch(`/api/property/${property.mlsId}/distance-profile/${newestReport.id}`)
            .then(res => res.json() as Promise<ReportData>)
            .then(data => setCurrentReport(data))
            .catch(err => console.error('Error fetching report:', err))
        }
      } else {
        // No reports, go to config
        setCurrentStep('config')
      }
    } catch (error) {
      console.error('Error checking reports:', error)
      // If error, just go to config
      setCurrentStep('config')
    }
  }

  const handleAddressSubmit = () => {
    if (!coordinates) {
      setError('Please enter a valid address or select a property')
      return
    }
    setCurrentStep('config')
  }

  const handleGenerateInsights = async (config: Record<string, unknown>) => {
    if (activeTab === 'adhoc') {
      // Generate ad-hoc profile
      if (!coordinates) {
        setError('No location selected for insights generation')
        return
      }

      try {
        setIsGenerating(true)
        setGenerationProgress(0)
        setError(null)

        const categories = config.categories as Record<string, boolean> || {}
        const distances = config.distances as Record<string, number> || {}
        const profileName = config.profileName as string | undefined

        const response = await fetch('/api/location-insights/adhoc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            categories,
            distances,
            profileName
          })
        })

        if (response.ok) {
          const data = await response.json() as { profile: { id: string } }
          setSelectedAdHocProfileId(data.profile.id)
          await fetchAdHocProfiles()
          setCurrentStep('results')
          // Fetch the full report data
          const reportResponse = await fetch(`/api/location-insights/adhoc/${data.profile.id}`)
          if (reportResponse.ok) {
            const reportData = await reportResponse.json() as ReportData
            setCurrentReport(reportData)
          }
        } else {
          const errorData = await response.json() as { error: string }
          throw new Error(errorData.error || 'Failed to generate insights')
        }
      } catch (error) {
        console.error('Error generating insights:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setIsGenerating(false)
        setGenerationProgress(0)
      }
      return
    }

    // Property-based generation (existing logic)
    if (!selectedProperty && !coordinates) {
      setError('No location selected for insights generation')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationProgress(0)
      setError(null)

      setGenerationProgress(20)

      // For custom addresses, we need to create a property first
      let propertyToUse = selectedProperty
      if (!propertyToUse && coordinates) {
        // Create a new manual property for the custom address
        const createPropertyResponse = await fetch('/api/property/manual', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: address,
            city: 'Custom Location',
            province: 'Custom',
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            price: 0,
            bedrooms: 0,
            bathrooms: 0,
            propertyType: 'Custom',
            description: 'Custom location for location insights'
          })
        })

        if (!createPropertyResponse.ok) {
          const errorData = await createPropertyResponse.json() as { error: string }
          throw new Error(errorData.error || 'Failed to create property for custom location')
        }

        const createdProperty = await createPropertyResponse.json() as { property: ManualProperty }
        propertyToUse = createdProperty.property
      }

      if (!propertyToUse) {
        throw new Error('No property available for insights generation')
      }

      setGenerationProgress(40)

      // Start the generation (this is async and will continue on server even if client navigates away)
      const response = await fetch(`/api/property/${propertyToUse.mlsId}/distance-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: config.categories,
          distances: config.distances,
          profileName: config.profileName
        })
      })

      setGenerationProgress(60)

      if (response.ok) {
        const responseData = await response.json() as { profile?: { id?: string } }
        const profileId = responseData.profile?.id
        
        // Start polling for completion if generation is still in progress
        if (profileId) {
          setGenerationProgress(80)
          
          // Poll for completion every 3 seconds (server continues processing even if user navigates away)
          const pollInterval = setInterval(async () => {
            try {
              // Check if the new report is ready (has amenities)
              const checkResponse = await fetch(`/api/property/${propertyToUse!.mlsId}/distance-profile/${profileId}`)
              if (checkResponse.ok) {
                const checkData = await checkResponse.json() as { summary?: { totalAmenities?: number }, amenitiesByCategory?: Record<string, unknown> }
                const totalAmenities = checkData.summary?.totalAmenities || 0
                const hasCategories = checkData.amenitiesByCategory && Object.keys(checkData.amenitiesByCategory).length > 0
                
                if (totalAmenities > 0 && hasCategories) {
                  // Generation complete!
                  clearInterval(pollInterval)
                  setPollingInterval(null)
                  setGenerationProgress(100)
                  setIsGenerating(false)
                  
                  // Reload reports and select the new one
                  const reportsList = await fetchReports(propertyToUse!.mlsId)
                  
                  // Wait a moment for state to update, then select the report
                  setTimeout(() => {
                    const newReport = reportsList.find((r: LocationInsightsReport) => r.id === profileId) || reportsList[0]
                    if (newReport && propertyToUse) {
                      setSelectedReportId(newReport.id)
                      // Fetch full report data
                      fetch(`/api/property/${propertyToUse.mlsId}/distance-profile/${newReport.id}`)
                        .then(res => res.json() as Promise<ReportData>)
                        .then(data => setCurrentReport(data))
                        .catch(err => console.error('Error fetching report:', err))
                    }
                    setCurrentStep('results')
                  }, 500)
                } else if (totalAmenities > 0) {
                  // Has amenities but categories not grouped yet - refresh and show
                  clearInterval(pollInterval)
                  setPollingInterval(null)
                  setGenerationProgress(100)
                  setIsGenerating(false)
                  const reportsList = await fetchReports(propertyToUse!.mlsId)
                  setTimeout(() => {
                    const newReport = reportsList.find((r: LocationInsightsReport) => r.id === profileId) || reportsList[0]
                    if (newReport && propertyToUse) {
                      setSelectedReportId(newReport.id)
                      // Fetch full report data
                      fetch(`/api/property/${propertyToUse.mlsId}/distance-profile/${newReport.id}`)
                        .then(res => res.json() as Promise<ReportData>)
                        .then(data => setCurrentReport(data))
                        .catch(err => console.error('Error fetching report:', err))
                    }
                    setCurrentStep('results')
                  }, 500)
                }
              }
            } catch (error) {
              console.error('Error polling for completion:', error)
            }
          }, 3000)
          
          setPollingInterval(pollInterval)

          // Stop polling after 10 minutes max
          setTimeout(() => {
            clearInterval(pollInterval)
            setPollingInterval(null)
            setIsGenerating(false)
            setGenerationProgress(100)
            // Still navigate to results even if polling stopped
            setCurrentStep('results')
            fetchReports(propertyToUse!.mlsId).then((reportsList) => {
              const newReport = reportsList.find((r: LocationInsightsReport) => r.id === profileId) || reportsList[0]
              if (newReport && propertyToUse) {
                setSelectedReportId(newReport.id)
                // Fetch full report data
                fetch(`/api/property/${propertyToUse.mlsId}/distance-profile/${newReport.id}`)
                  .then(res => res.json() as Promise<ReportData>)
                  .then(data => setCurrentReport(data))
                  .catch(err => console.error('Error fetching report:', err))
              }
            })
          }, 10 * 60 * 1000)
        } else {
          // If we got a response but no profile ID, assume it's complete immediately
          setGenerationProgress(100)
          await fetchReports(propertyToUse.mlsId)
          setCurrentStep('results')
          setIsGenerating(false)
        }
      } else {
        const errorData = await response.json() as { error: string }
        throw new Error(errorData.error || 'Failed to generate insights')
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const fetchReports = async (mlsId: string, skipAutoSelect?: boolean): Promise<LocationInsightsReport[]> => {
    try {
      const response = await fetch(`/api/property/${mlsId}/distance-profile/reports`)
      if (response.ok) {
        const reports = await response.json() as LocationInsightsReport[]
        setAvailableReports(reports)
        
        // Only auto-select if no report is currently selected and we're not skipping auto-select
        if (!skipAutoSelect && reports.length > 0 && !selectedReportId) {
          const newestReport = reports[0]
          if (newestReport) {
            setSelectedReportId(newestReport.id)
            // Don't set currentReport here - it will be fetched when needed
          }
        }
        return reports
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
    return []
  }

  const handleBackToInput = () => {
    setCurrentStep('input')
    setSelectedProperty(null)
    setCoordinates(null)
    setAddress('')
    setError(null)
  }

  const handleBackToConfig = () => {
    setCurrentStep('config')
    setError(null)
  }

  if (loading) {
    return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500"></div>
          </div>
        </div>
      
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-700">Location Insights</h1>
          <p className="mt-2 text-gray-500">
            Generate location insights for any address or property
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => {
                setActiveTab('adhoc')
                setCurrentStep('input')
                setSelectedProperty(null)
                setCoordinates(null)
                setAddress('')
                setError(null)
                fetchAdHocProfiles()
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'adhoc'
                  ? 'border-keppel-500 text-keppel-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ad-Hoc Insights
            </button>
            <button
              onClick={() => {
                setActiveTab('property')
                setCurrentStep('input')
                setSelectedProperty(null)
                setCoordinates(null)
                setAddress('')
                setError(null)
                fetchManualProperties()
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'property'
                  ? 'border-keppel-500 text-keppel-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Property Insights
            </button>
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-soft-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Address Input */}
        {currentStep === 'input' && (
          <div className="space-y-6">
            {activeTab === 'adhoc' ? (
              <>
                {/* Ad-Hoc: Saved Profiles List */}
                {adHocProfiles.length > 0 && (
                  <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Saved Ad-Hoc Profiles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adHocProfiles.map((profile) => (
                        <div
                          key={profile.id}
                          onClick={() => {
                            setSelectedAdHocProfileId(profile.id)
                            setAddress(profile.address)
                            if (profile.latitude && profile.longitude) {
                              setCoordinates({ lat: profile.latitude, lng: profile.longitude })
                            }
                            setCurrentStep('results')
                            // Fetch report data
                            fetch(`/api/location-insights/adhoc/${profile.id}`)
                              .then(res => res.json() as Promise<ReportData>)
                              .then(data => setCurrentReport(data))
                              .catch(err => console.error('Error fetching profile:', err))
                          }}
                          className="p-4 border border-gray-200 rounded-xl shadow-soft-sm hover:shadow-soft-md cursor-pointer transition-all duration-200 hover:border-keppel-300"
                        >
                          <h3 className="font-medium text-gray-700">{profile.reportName}</h3>
                          <p className="text-sm text-gray-500 mt-1">{profile.address}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {profile.totalAmenities} amenities • {new Date(profile.generatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ad-Hoc: Address Input Section */}
                <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Enter Location</h2>
                  <p className="text-gray-500 mb-6">
                    Enter an address or use GPS coordinates to generate location insights
                  </p>
                  
                  <GeocodingHelper
                    onCoordinatesFound={handleCoordinatesFound}
                    onAddressFound={handleAddressFound}
                    currentAddress={address}
                    currentCoordinates={coordinates || undefined}
                  />

                  <div className="mt-6">
                    <button
                      onClick={handleAddressSubmit}
                      disabled={!coordinates}
                      className="w-full flex justify-center items-center px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-xl shadow-soft-sm hover:shadow-soft-md focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      Continue to Configuration
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Property: Address Input Section */}
                <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
                  <h2 className="text-xl font-semibold text-gray-700 mb-4">Enter Location</h2>
                  <p className="text-gray-500 mb-6">
                    Enter an address or use GPS coordinates to generate location insights
                  </p>
                  
                  <GeocodingHelper
                    onCoordinatesFound={handleCoordinatesFound}
                    onAddressFound={handleAddressFound}
                    currentAddress={address}
                    currentCoordinates={coordinates || undefined}
                  />

                  <div className="mt-6">
                    <button
                      onClick={handleAddressSubmit}
                      disabled={!coordinates}
                      className="w-full flex justify-center items-center px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-xl shadow-soft-sm hover:shadow-soft-md focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    >
                      Continue to Configuration
                    </button>
                  </div>
                </div>

                {/* Property: Manual Properties Selection */}
                {manualProperties.length > 0 && (
                  <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Or Select from Manual Properties</h2>
                    <p className="text-gray-500 mb-6">
                      Choose from your existing manual properties
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Address
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Location
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              MLS ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Coordinates
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {manualProperties.map((property) => (
                            <tr
                              key={property.id}
                              onClick={() => handlePropertySelect(property)}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {property.address}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {property.city}, {property.province}
                                </div>
                                {property.postalCode && (
                                  <div className="text-xs text-gray-500">
                                    {property.postalCode}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-mono">
                                  {property.mlsId}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {property.latitude && property.longitude ? (
                                  <div className="text-xs text-gray-500 font-mono">
                                    {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400">
                                    Not available
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <span className="text-keppel-600 hover:text-keppel-900">
                                  Select →
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 'config' && (
          <div className="space-y-6">
            <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Configure Location Insights</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedProperty ? `Property: ${selectedProperty.address}` : `Address: ${address}`}
                  </p>
                </div>
                <button
                  onClick={handleBackToInput}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  ← Back to Location
                </button>
              </div>

              <LocationInsightsConfig
                onGenerate={handleGenerateInsights}
                onSaveProfile={() => {}} // We'll implement this later
                onBack={handleBackToInput}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
              />
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 'results' && (
          <div className="space-y-6">
            <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Location Insights Results</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedProperty ? `Property: ${selectedProperty.address}` : `Address: ${address}`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleBackToConfig}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    ← Back to Config
                  </button>
                  <button
                    onClick={handleBackToInput}
                    className="px-4 py-2 bg-buff-500 text-gray-700 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-200"
                  >
                    New Location
                  </button>
                </div>
              </div>

              {/* Report Selection */}
              {availableReports.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Report to View
                  </label>
                  <select
                    value={selectedReportId || ''}
                    onChange={async (e) => {
                      const reportId = e.target.value
                      setSelectedReportId(reportId)
                      if (reportId && selectedProperty) {
                        // Fetch full report data
                        try {
                          const response = await fetch(`/api/property/${selectedProperty.mlsId}/distance-profile/${reportId}`)
                          if (response.ok) {
                            const data = await response.json() as ReportData
                            setCurrentReport(data)
                          }
                        } catch (err) {
                          console.error('Error fetching report:', err)
                        }
                      } else {
                        setCurrentReport(null)
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 transition-all duration-200 text-gray-700"
                  >
                    <option value="">Select a report...</option>
                    {availableReports.map((report) => (
                      <option key={report.id} value={report.id}>
                        {report.reportName} - {new Date(report.generatedAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Report Display */}
              {activeTab === 'property' && currentReport && selectedProperty && selectedReportId && (
                <DistanceProfileTab property={selectedProperty} reportId={selectedReportId} />
              )}

              {activeTab === 'adhoc' && currentReport && selectedAdHocProfileId && (
                <DistanceProfileTab 
                  property={{
                    id: selectedAdHocProfileId,
                    mlsId: selectedAdHocProfileId,
                    address: address || (currentReport.profile.adHocAddress as string | undefined) || 'Unknown location',
                    latitude: coordinates?.lat || (currentReport.summary.propertyLocation as { lat: number; lng: number } | null | undefined)?.lat || 0,
                    longitude: coordinates?.lng || (currentReport.summary.propertyLocation as { lat: number; lng: number } | null | undefined)?.lng || 0,
                    city: '',
                    province: ''
                  }} 
                  reportId={selectedAdHocProfileId} 
                />
              )}

              {!currentReport && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <p className="text-gray-500 mb-4">Select a report to view insights</p>
                  <button
                    onClick={handleBackToConfig}
                    className="px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600"
                  >
                    Generate New Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  )
}
