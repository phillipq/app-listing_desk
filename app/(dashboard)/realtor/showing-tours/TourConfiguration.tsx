'use client'

import { useState } from 'react'

interface TourConfig {
  name: string
  description?: string
  showingDate?: string
  startTime: string
  endTime: string
  showingDuration: number
  startTimeType: string
}

interface TourProperty {
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
  customDuration?: number
}

interface TourConfigurationProps {
  config: TourConfig
  properties: TourProperty[]
  onSubmit: (config: TourConfig) => void
  onCalculate: (config?: TourConfig) => void
  onBack: () => void
  loading: boolean
}

export default function TourConfiguration({ config, properties, onSubmit, onCalculate, onBack, loading }: TourConfigurationProps) {
  const [formData, setFormData] = useState<TourConfig>(config)
  const [propertyDurations, setPropertyDurations] = useState<Record<string, number>>(
    properties.reduce((acc: Record<string, number>, property: TourProperty) => {
      acc[property.id] = property.customDuration || config.showingDuration
      return acc
    }, {} as Record<string, number>)
  )
  const [showPropertyDurations, setShowPropertyDurations] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Include property durations in the config
    const configWithDurations = {
      ...formData,
      propertyDurations
    }
    onSubmit(configWithDurations)
    onCalculate(configWithDurations) // Pass formData with durations
  }

  const handleInputChange = (field: keyof TourConfig, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePropertyDurationChange = (propertyId: string, duration: number) => {
    setPropertyDurations(prev => ({
      ...prev,
      [propertyId]: duration
    }))
  }

  const handleUseDefaultDuration = (propertyId: string) => {
    setPropertyDurations(prev => ({
      ...prev,
      [propertyId]: formData.showingDuration
    }))
  }

  const timeOptions = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM'
  ]

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ]

  const getTimeWindow = () => {
    const start = new Date(`2000-01-01 ${formData.startTime}`)
    const end = new Date(`2000-01-01 ${formData.endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10
    return diffHours
  }

  const timeWindow = getTimeWindow()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700">Tour Configuration</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Configuration - Reordered Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1: Tour Name */}
          <div>
            <label htmlFor="tour-name" className="block text-xs font-medium text-gray-700 mb-1">
              Tour Name *
            </label>
            <input
              type="text"
              id="tour-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Saturday Morning Tour"
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              required
            />
          </div>

          {/* Row 1: Showing Date */}
          <div>
            <label htmlFor="showing-date" className="block text-xs font-medium text-gray-700 mb-1">
              Showing Date
            </label>
            <input
              type="date"
              id="showing-date"
              value={formData.showingDate || ''}
              onChange={(e) => handleInputChange('showingDate', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
            />
          </div>

          {/* Row 1: Start Time */}
          <div>
            <label htmlFor="start-time" className="block text-xs font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <select
              id="start-time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Default Duration */}
          <div>
            <label htmlFor="showing-duration" className="block text-xs font-medium text-gray-700 mb-1">
              Default Duration
            </label>
            <select
              id="showing-duration"
              value={formData.showingDuration}
              onChange={(e) => handleInputChange('showingDuration', parseInt(e.target.value))}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Booking Preference */}
          <div>
            <label htmlFor="start-time-type" className="block text-xs font-medium text-gray-700 mb-1">
              Time Preference
            </label>
            <select
              id="start-time-type"
              value={formData.startTimeType}
              onChange={(e) => handleInputChange('startTimeType', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
            >
              <option value="hour">On the hour</option>
              <option value="half-hour">Hour & half-hour</option>
            </select>
          </div>

          {/* Row 2: End Time */}
          <div>
            <label htmlFor="end-time" className="block text-xs font-medium text-gray-700 mb-1">
              End Time
            </label>
            <select
              id="end-time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
            >
              {timeOptions.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description - Compact */}
        <div>
          <label htmlFor="tour-description" className="block text-xs font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="tour-description"
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
          />
        </div>
        
        {/* Time Window Info - Compact */}
        {timeWindow > 0 && (
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Available Time:</strong> {timeWindow} hours
            </p>
          </div>
        )}

        {/* Property-Specific Durations - Collapsible */}
        {properties.length > 0 && (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setShowPropertyDurations(!showPropertyDurations)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 mb-2"
            >
              <span>Property-Specific Durations ({properties.length})</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${showPropertyDurations ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showPropertyDurations && (
              <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {properties.map((property) => {
                    const isUsingDefault = propertyDurations[property.id] === formData.showingDuration
                    return (
                      <div key={property.id} className="flex items-center gap-2 text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 truncate">
                            {property.address || 'Address not available'}, {property.city || 'City'}
                          </div>
                        </div>
                        <select
                          value={propertyDurations[property.id]}
                          onChange={(e) => handlePropertyDurationChange(property.id, parseInt(e.target.value))}
                          className="w-28 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                        >
                          {durationOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleUseDefaultDuration(property.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded transition-colors ${
                            isUsingDefault
                              ? 'bg-keppel-100 text-keppel-800'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title={isUsingDefault ? 'Using default duration' : 'Set to default'}
                        >
                          {isUsingDefault ? (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="border-t pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-keppel-500 hover:bg-keppel-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Calculate Tour
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
