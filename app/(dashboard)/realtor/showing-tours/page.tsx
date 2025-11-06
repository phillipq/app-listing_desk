'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import SavedTours from './SavedTours'
import ShowingTourPlanner from './ShowingTourPlanner'

interface Property {
  id: string
  mlsId: string
  address: string
  city: string
  province: string
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  latitude?: number
  longitude?: number
}

interface ShowingTour {
  id: string
  name: string
  description?: string
  showingDate?: string
  startTime: string
  endTime: string
  showingDuration: number
  startTimeType: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  properties: TourProperty[]
  schedule?: TourSchedule
}

interface TourProperty {
  id: string
  order: number
  mlsId: string
  address: string
  latitude?: number
  longitude?: number
}

interface TourSchedule {
  id: string
  totalDuration: number
  canFitInWindow: boolean
  startTime: string
  endTime: string
  totalDriveTime: number
  totalShowingTime: number
  scheduleItems: {
    time: string
    type: 'showing' | 'travel' | 'buffer'
    property?: {
      id: string
      mlsId: string
      address: string
      latitude?: number
      longitude?: number
    }
    duration: number
    address: string
    driveTime?: number
  }[]
  googleMapsUrl?: string
}

export default function ShowingTourPage() {
  const { data: session } = useSession()
  const [properties, setProperties] = useState<Property[]>([])
  const [savedTours, setSavedTours] = useState<ShowingTour[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'planner' | 'saved'>('planner')
  const [loadedTour, setLoadedTour] = useState<ShowingTour | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      loadProperties()
      loadSavedTours()
    }
  }, [session])

  const loadProperties = async () => {
    try {
      console.log('Loading properties...')
      const response = await fetch('/api/properties')
      console.log('Properties response status:', response.status)
      
      if (response.ok) {
        const data = await response.json() as Property[]
        console.log('Properties loaded:', data)
        setProperties(data)
      } else {
        const errorData = await response.json()
        console.error('Error loading properties:', errorData)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const loadSavedTours = async () => {
    try {
      const response = await fetch('/api/showing-tours')
      if (response.ok) {
        const data = await response.json() as ShowingTour[]
        setSavedTours(data)
      }
    } catch (error) {
      console.error('Error loading saved tours:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTourSaved = () => {
    loadSavedTours()
    setLoadedTour(null) // Clear loaded tour after saving
  }

  const handleTourDeleted = () => {
    loadSavedTours()
  }

  const handleTourLoaded = (tour: ShowingTour) => {
    setLoadedTour(tour)
    setActiveTab('planner')
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading showing tour planner...</p>
          </div>
        </div>
      
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Showing Tour Planner</h1>
              <p className="mt-2 text-gray-500">
                Plan and optimize your property showing tours with automatic route calculation and scheduling.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('planner')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'planner'
                    ? 'border-keppel-500 text-gray-700'
                    : 'border-transparent text-gray-700 hover:text-gray-700 hover:border-slate-300'
                }`}
              >
                🏠 Plan New Tour
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'saved'
                    ? 'border-keppel-500 text-gray-700'
                    : 'border-transparent text-gray-700 hover:text-gray-700 hover:border-slate-300'
                }`}
              >
                📋 Saved Tours ({savedTours.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'planner' && (
          <ShowingTourPlanner
            properties={properties}
            onTourSaved={handleTourSaved}
            // @ts-expect-error - Type compatibility issue between different ShowingTour interfaces
            loadedTour={loadedTour}
          />
        )}

        {activeTab === 'saved' && (
          <SavedTours
            tours={savedTours}
            onTourDeleted={handleTourDeleted}
            onTourLoaded={handleTourLoaded}
          />
        )}
      </div>
    
  )
}
