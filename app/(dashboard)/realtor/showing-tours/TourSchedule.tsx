'use client'

import { useState } from 'react'

interface TourProperty {
  id: string
  mlsId: string
  address: string
  latitude?: number
  longitude?: number
}

interface ScheduleItem {
  time: string
  type: 'showing' | 'travel' | 'buffer'
  property?: TourProperty
  duration: number
  address: string
  driveTime?: number
}

interface TourSchedule {
  totalDuration: number
  canFitInWindow: boolean
  startTime: string
  endTime: string
  totalDriveTime: number
  totalShowingTime: number
  scheduleItems: ScheduleItem[]
  googleMapsUrl?: string
}

interface TourConfig {
  name: string
  description?: string
  showingDate?: string
  startTime: string
  endTime: string
  showingDuration: number
  startTimeType: string
}

interface TourScheduleProps {
  schedule: TourSchedule
  properties: TourProperty[]
  config: TourConfig
  onSave: () => void
  onBack: () => void
  onStartOver: () => void
  loading: boolean
}

export default function TourSchedule({ schedule, properties, config, onSave, onBack, onStartOver, loading }: TourScheduleProps) {
  const [_showGoogleMaps, _setShowGoogleMaps] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'grid' | 'compact'>('timeline')

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatBookingTime = (time: string) => {
    const date = new Date(`2000-01-01 ${time}`)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    
    // Get the user's preference for scheduling
    const isOnTheHour = config.startTimeType === 'hour'
    
    if (isOnTheHour) {
      // For "on the hour" scheduling, round to the next available hour
      let roundedHours = hours
      let _roundedMinutes = 0
      
      // If we're past the hour (any minutes > 0), round up to next hour
      if (minutes > 0) {
        roundedHours = hours + 1
        _roundedMinutes = 0
      }
      
      // Handle hour overflow
      if (roundedHours >= 24) {
        roundedHours = 0
      }
      
      const roundedDate = new Date(`2000-01-01 ${roundedHours}:00`)
      return roundedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      // For "on the half-hour" scheduling, round to the next available half-hour
      let roundedHours = hours
      let roundedMinutes = 0
      
      if (minutes <= 15) {
        // Round down to the hour
        roundedMinutes = 0
      } else if (minutes <= 45) {
        // Round to half-hour
        roundedMinutes = 30
      } else {
        // Round up to next hour
        roundedHours = hours + 1
        roundedMinutes = 0
      }
      
      // Handle hour overflow
      if (roundedHours >= 24) {
        roundedHours = 0
      }
      
      const roundedDate = new Date(`2000-01-01 ${roundedHours}:${roundedMinutes.toString().padStart(2, '0')}`)
      return roundedDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getStatusColor = () => {
    if (schedule.canFitInWindow) {
      return 'text-gray-700 bg-green-50 border-green-200'
    } else {
      return 'text-gray-700 bg-red-50 border-red-200'
    }
  }

  const getStatusIcon = () => {
    if (schedule.canFitInWindow) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    } else {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  }

  const openGoogleMaps = () => {
    if (schedule.googleMapsUrl) {
      window.open(schedule.googleMapsUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      {/* Tour Summary */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Tour Schedule</h2>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="ml-2">
              {schedule.canFitInWindow ? 'Tour fits in time window' : 'Tour exceeds time window'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-keppel-500 rounded-xl p-4 shadow-soft-sm">
            <div className="text-sm font-medium text-seasalt-500 opacity-90">Total Duration</div>
            <div className="text-2xl font-bold text-seasalt-500">{Math.round(schedule.totalDuration / 60 * 10) / 10}h</div>
          </div>
          <div className="bg-buff-500 rounded-xl p-4 shadow-soft-sm">
            <div className="text-sm font-medium text-seasalt-500 opacity-90">Properties</div>
            <div className="text-2xl font-bold text-seasalt-500">{properties.length}</div>
          </div>
          <div className="bg-seasalt-500 rounded-xl p-4 shadow-soft-sm">
            <div className="text-sm font-medium text-gray-700 opacity-90">Drive Time</div>
            <div className="text-2xl font-bold text-gray-700">{Math.round(schedule.totalDriveTime / 60 * 10) / 10}h</div>
          </div>
          <div className="bg-buff-500 rounded-xl p-4 shadow-soft-sm">
            <div className="text-sm font-medium text-seasalt-500 opacity-90">Showing Time</div>
            <div className="text-2xl font-bold text-seasalt-500">{Math.round(schedule.totalShowingTime / 60 * 10) / 10}h</div>
          </div>
        </div>
        
        {/* Save Tour Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onSave}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-keppel-500 text-seasalt-500 rounded-xl shadow-soft-sm hover:shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {loading ? 'Saving Tour...' : 'Save Tour'}
          </button>
        </div>
      </div>

      {/* Recommended Showing Times */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Recommended Showing Times</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedule.scheduleItems
            .filter(item => item.type === 'showing')
            .map((item, index) => (
              <div key={index} className="flex items-center p-4 bg-keppel-500 rounded-xl shadow-soft-sm border border-pumpkin-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft-sm">
                    <span className="text-gray-700 font-semibold text-sm">{index + 1}</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="text-sm font-medium text-gray-700 opacity-90">
                    Property {index + 1}
                  </div>
                  <div className="text-lg font-bold text-gray-700">
                    {formatBookingTime(item.time)}
                  </div>
                  <div className="text-xs text-gray-700 opacity-75 truncate">
                    MLS: {item.property?.mlsId || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-700 opacity-75 truncate">
                    {item.address}
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
          <p className="text-sm text-gray-700">
            <strong>Booking Tip:</strong> Use these times when scheduling appointments with your clients. 
            The times account for travel between properties and your specified showing duration.
            {config.startTimeType === 'hour' ? 
              ' Times are rounded to the nearest hour to match your scheduling preference.' :
              ' Times are rounded to the nearest hour or half-hour to match your scheduling preference.'
            }
          </p>
        </div>
      </div>

      {/* Schedule Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-700">Detailed Schedule</h3>
          
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'timeline' 
                  ? 'bg-white text-gray-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Timeline
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 ${
                viewMode === 'compact' 
                  ? 'bg-white text-gray-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Compact
            </button>
          </div>
        </div>
        
        {/* Timeline View */}
        {viewMode === 'timeline' && (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            
            <div className="space-y-6">
              {schedule.scheduleItems.map((item, index) => {
                const getTypeColor = () => {
                  switch (item.type) {
                    case 'showing': return 'bg-keppel-500'
                    case 'travel': return 'bg-buff-500'
                    case 'buffer': return 'bg-seasalt-500'
                    default: return 'bg-gray-400'
                  }
                }
                
                const getTypeIcon = () => {
                  switch (item.type) {
                    case 'showing': return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    )
                    case 'travel': return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    )
                    case 'buffer': return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )
                    default: return (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="3" />
                      </svg>
                    )
                  }
                }
                
                return (
                  <div key={index} className="relative flex items-start">
                    {/* Timeline Node */}
                    <div className="relative z-10 flex items-center justify-center w-16 h-16">
                      <div className={`w-12 h-12 rounded-full ${getTypeColor()} flex items-center justify-center text-white shadow-soft-md`}>
                        {getTypeIcon()}
                      </div>
                    </div>
                    
                    {/* Content Card */}
                    <div className="flex-1 ml-6 -mt-2">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="text-lg font-semibold text-gray-700">
                                {formatTime(item.time)}
                              </div>
                              <div className="px-3 py-1 bg-slate-100 text-gray-700 rounded-full text-sm font-medium">
                                {item.duration} min
                              </div>
                            </div>
                            
                            <div className="text-lg font-medium text-gray-700 mb-1">
                              {item.type === 'showing' ? 'Property Showing' : 
                               item.type === 'travel' ? 'Travel to Next Property' : 
                               'Buffer Time to Next Showing'}
                            </div>
                            
                            <div className="text-gray-500 mb-2">{item.address}</div>
                            
                            {item.driveTime && (
                              <div className="text-sm text-gray-500">
                                Drive time: {item.driveTime} minutes
                              </div>
                            )}
                          </div>
                          
                          {/* Duration Bar */}
                          <div className="ml-4 flex-shrink-0">
                            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getTypeColor().replace('bg-gradient-', 'bg-').replace('-500', '-400')} rounded-full`}
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 text-center mt-1">
                              {item.duration}min
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.scheduleItems.map((item, index) => {
              const getTypeColor = () => {
                switch (item.type) {
                  case 'showing': return 'bg-keppel-500'
                  case 'travel': return 'bg-buff-500'
                  case 'buffer': return 'bg-seasalt-500'
                  default: return 'bg-gray-400'
                }
              }
              
              const getTypeIcon = () => {
                switch (item.type) {
                  case 'showing': return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )
                  case 'travel': return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  )
                  case 'buffer': return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                  default: return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="3" />
                    </svg>
                  )
                }
              }
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-soft-sm hover:shadow-soft-md transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full ${getTypeColor()} flex items-center justify-center text-white shadow-soft-sm`}>
                      {getTypeIcon()}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-700">{formatTime(item.time)}</div>
                      <div className="text-sm text-gray-500">{item.duration} min</div>
                    </div>
                  </div>
                  
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    {item.type === 'showing' ? 'Property Showing' : 
                     item.type === 'travel' ? 'Travel to Next Property' : 
                     'Buffer Time to Next Showing'}
                  </div>
                  
                  <div className="text-gray-500 text-sm mb-3">{item.address}</div>
                  
                  {item.driveTime && (
                    <div className="text-xs text-gray-500">
                      Drive time: {item.driveTime} minutes
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Compact View */}
        {viewMode === 'compact' && (
          <div className="space-y-2">
            {schedule.scheduleItems.map((item, index) => {
              const getTypeColor = () => {
                switch (item.type) {
                  case 'showing': return 'bg-pumpkin-100 text-pumpkin-800'
                  case 'travel': return 'bg-bice-100 text-bice-800'
                  case 'buffer': return 'bg-silver-100 text-silver-800'
                  default: return 'bg-slate-100 text-gray-700'
                }
              }
              
              const getTypeIcon = () => {
                switch (item.type) {
                  case 'showing': return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  )
                  case 'travel': return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  )
                  case 'buffer': return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                  default: return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="3" />
                    </svg>
                  )
                }
              }
              
              return (
                <div key={index} className="flex items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-sm font-medium text-gray-700">{formatTime(item.time)}</div>
                    <div className="text-xs text-gray-500">{item.duration}min</div>
                  </div>
                  
                  <div className="flex-1 ml-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-700">{getTypeIcon()}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
                        {item.type === 'showing' ? 'Property Showing' : 
                         item.type === 'travel' ? 'Travel' : 
                         'Buffer Time'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{item.address}</div>
                    {item.driveTime && (
                      <div className="text-xs text-gray-500">Drive: {item.driveTime}min</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Google Maps Integration */}
      {schedule.googleMapsUrl && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Navigation</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Get turn-by-turn directions for your entire tour route.
              </p>
            </div>
            <button
              onClick={openGoogleMaps}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-buff-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-buff-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Configuration
            </button>
            <button
              onClick={onStartOver}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
