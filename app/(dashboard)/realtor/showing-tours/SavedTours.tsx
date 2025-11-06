'use client'

import { useState } from 'react'

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

interface SavedToursProps {
  tours: ShowingTour[]
  onTourDeleted: (tourId: string) => void
  onTourLoaded: (tour: ShowingTour) => void
}

export default function SavedTours({ tours, onTourDeleted, onTourLoaded }: SavedToursProps) {
  const [_selectedTour, setSelectedTour] = useState<ShowingTour | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDeleteTour = async (tourId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/showing-tours/${tourId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onTourDeleted(tourId)
        setSelectedTour(null)
        setShowDeleteConfirm(null)
      } else {
        alert('Failed to delete tour. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting tour:', error)
      alert('Failed to delete tour. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadTour = (tour: ShowingTour) => {
    setSelectedTour(tour)
    onTourLoaded(tour)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusColor = (tour: ShowingTour) => {
    if (tour.schedule?.canFitInWindow) {
      return 'text-gray-700 bg-green-50 border-green-200'
    } else {
      return 'text-gray-700 bg-red-50 border-red-200'
    }
  }

  if (tours.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-700">No saved tours</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first showing tour to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tours List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-700">Saved Tours</h2>
          <p className="text-sm text-gray-500">Manage your saved showing tours</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {tours.map((tour) => (
            <div key={tour.id} className="p-6 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-700 truncate">{tour.name}</h3>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tour)}`}>
                      {tour.schedule?.canFitInWindow ? 'Fits in window' : 'Exceeds window'}
                    </div>
                  </div>
                  
                  {tour.description && (
                    <p className="mt-1 text-sm text-gray-500">{tour.description}</p>
                  )}
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <span>{tour.properties.length} propert{tour.properties.length === 1 ? 'y' : 'ies'}</span>
                    <span>•</span>
                    <span>{tour.startTime} - {tour.endTime}</span>
                    <span>•</span>
                    <span>{tour.showingDuration}min per property</span>
                    {tour.showingDate && (
                      <>
                        <span>•</span>
                        <span>{new Date(tour.showingDate).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-500">
                    Created {formatDate(tour.createdAt)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLoadTour(tour)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Load
                  </button>
                  
                  {tour.schedule?.googleMapsUrl && (
                    <button
                      onClick={() => window.open(tour.schedule?.googleMapsUrl, '_blank')}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Maps
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDeleteConfirm(tour.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-buff-500"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mt-2">Delete Tour</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this tour? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTour(showDeleteConfirm)}
                  disabled={loading}
                  className="px-4 py-2 bg-buff-500 text-seasalt-500 text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-buff-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
