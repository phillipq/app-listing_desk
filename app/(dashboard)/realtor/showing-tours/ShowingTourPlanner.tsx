'use client'

import { useEffect, useState } from 'react'
import PropertyInput from './PropertyInput'
import PropertyList from './PropertyList'
import TourConfiguration from './TourConfiguration'
import TourSchedule from './TourSchedule'

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

interface TourConfig {
  name: string
  description?: string
  showingDate?: string
  startTime: string
  endTime: string
  showingDuration: number
  startTimeType: string
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

interface ScheduleItem {
  time: string
  type: 'showing' | 'travel'
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

interface ShowingTourPlannerProps {
  properties: Property[]
  onTourSaved: () => void
  loadedTour?: ShowingTour | null
}

export default function ShowingTourPlanner({ properties, onTourSaved, loadedTour }: ShowingTourPlannerProps) {
  const [step, setStep] = useState<'input' | 'properties' | 'config' | 'schedule'>('input')
  const [mlsInput, setMlsInput] = useState('')
  const [tourProperties, setTourProperties] = useState<TourProperty[]>([])
  const [tourConfig, setTourConfig] = useState<TourConfig>({
    name: '',
    description: '',
    showingDate: '',
    startTime: '10:00 AM',
    endTime: '2:00 PM',
    showingDuration: 30,
    startTimeType: 'hour'
  })
  const [schedule, setSchedule] = useState<TourSchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tourLoaded, setTourLoaded] = useState(false)

  // Handle loaded tour
  useEffect(() => {
    if (loadedTour && !tourLoaded) {
      console.log('Loading tour with duration:', loadedTour.showingDuration)
      console.log('Loading tour properties:', loadedTour.properties)
      console.log('Properties length:', loadedTour.properties?.length)
      const newConfig = {
        name: loadedTour.name,
        description: loadedTour.description || '',
        showingDate: loadedTour.showingDate || '',
        startTime: loadedTour.startTime,
        endTime: loadedTour.endTime,
        showingDuration: loadedTour.showingDuration,
        startTimeType: loadedTour.startTimeType
      }
      setTourConfig(newConfig)
      setTourProperties(loadedTour.properties)
      setTourLoaded(true)
      setStep('schedule')
      
      // Calculate immediately with the new config
      setTimeout(() => {
        console.log('Recalculating with loaded tour config:', newConfig)
        console.log('Tour properties at calculation time:', loadedTour.properties)
        handleCalculateTourWithConfigAndProperties(newConfig, loadedTour.properties)
      }, 100)
    }
  }, [loadedTour, tourLoaded])

  const handleMlsSubmit = (mlsNumbers: string[]) => {
    console.log('MLS numbers submitted:', mlsNumbers)
    console.log('Available properties:', properties)
    
    // Find properties that match the MLS numbers
    const foundProperties = mlsNumbers
      .map(mls => properties.find(p => p.mlsId === mls))
      .filter(Boolean) as Property[]

    console.log('Found properties:', foundProperties)

    if (foundProperties.length === 0) {
      setError('No properties found for the provided MLS numbers. Please check that the MLS numbers are correct and that you have properties in your database.')
      return
    }

    // Convert to TourProperty format
    const tourProps: TourProperty[] = foundProperties.map((prop, _index) => ({
      id: prop.id,
      mlsId: prop.mlsId,
      address: prop.address,
      city: prop.city,
      province: prop.province,
      price: prop.price,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      propertyType: prop.propertyType,
      latitude: prop.latitude,
      longitude: prop.longitude
    }))

    setTourProperties(tourProps)
    setStep('properties')
    setError(null)
  }

  const handlePropertyReorder = (reorderedProperties: TourProperty[]) => {
    setTourProperties(reorderedProperties)
  }

  const handlePropertyRemove = (propertyId: string) => {
    setTourProperties(prev => prev.filter(p => p.id !== propertyId))
  }

  const handleConfigSubmit = (config: TourConfig) => {
    setTourConfig(config)
    setStep('config')
  }

  const handleCalculateTourWithConfigAndProperties = async (config: TourConfig, properties: TourProperty[]) => {
    console.log('handleCalculateTourWithConfigAndProperties called with properties:', properties)
    console.log('properties.length:', properties.length)
    
    if (properties.length === 0) {
      setError('Please add at least one property to the tour.')
      return
    }

    console.log('Calculating tour with provided config:', config)
    console.log('Showing duration:', config.showingDuration)

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/showing-tours/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: properties,
          config: config
        })
      })

      if (response.ok) {
        const scheduleData = await response.json() as TourSchedule
        setSchedule(scheduleData)
        setStep('schedule')
      } else {
        const errorData = await response.json() as { error: string }
        setError(errorData.error || 'Failed to calculate tour schedule.')
      }
    } catch (error) {
      console.error('Error calculating tour:', error)
      setError('Failed to calculate tour schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateTour = async (config?: TourConfig) => {
    if (tourProperties.length === 0) {
      setError('Please add at least one property to the tour.')
      return
    }

    const configToUse = config || tourConfig
    console.log('Calculating tour with config:', configToUse)
    console.log('Showing duration:', configToUse.showingDuration)

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/showing-tours/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: tourProperties,
          config: configToUse
        })
      })

        if (response.ok) {
          const scheduleData = await response.json() as TourSchedule
          setSchedule(scheduleData)
          setStep('schedule')
        } else {
          const errorData = await response.json() as { error: string }
          setError(errorData.error || 'Failed to calculate tour schedule.')
        }
    } catch (error) {
      console.error('Error calculating tour:', error)
      setError('Failed to calculate tour schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTour = async () => {
    if (!schedule) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/showing-tours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: tourConfig.name,
          description: tourConfig.description,
          showingDate: tourConfig.showingDate,
          startTime: tourConfig.startTime,
          endTime: tourConfig.endTime,
          showingDuration: tourConfig.showingDuration,
          startTimeType: tourConfig.startTimeType,
          properties: tourProperties,
          schedule: schedule
        })
      })

      if (response.ok) {
        onTourSaved()
        setStep('input')
        setMlsInput('')
        setTourProperties([])
        setTourConfig({
          name: '',
          description: '',
          showingDate: '',
          startTime: '10:00 AM',
          endTime: '2:00 PM',
          showingDuration: 30,
          startTimeType: 'hour'
        })
        setSchedule(null)
        alert('Tour saved successfully!')
      } else {
        const errorData = await response.json() as { error: string }
        setError(errorData.error || 'Failed to save tour.')
      }
    } catch (error) {
      console.error('Error saving tour:', error)
      setError('Failed to save tour. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    switch (step) {
      case 'properties':
        setStep('input')
        break
      case 'config':
        setStep('properties')
        break
      case 'schedule':
        setStep('config')
        break
    }
  }

  const handleStartOver = () => {
    setStep('input')
    setMlsInput('')
    setTourProperties([])
    setTourConfig({
      name: '',
      description: '',
      showingDate: '',
      startTime: '10:00 AM',
      endTime: '2:00 PM',
      showingDuration: 30,
      startTimeType: 'hour'
    })
    setSchedule(null)
    setError(null)
  }

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center ${step === 'input' ? 'text-gray-700' : 'text-gray-500'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'input' ? 'bg-keppel-500 text-seasalt-500' : 'bg-slate-200 text-gray-500'
          }`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Input Properties</span>
        </div>
        <div className={`w-8 h-1 ${step === 'properties' || step === 'config' || step === 'schedule' ? 'bg-keppel-500' : 'bg-slate-200'}`}></div>
        <div className={`flex items-center ${step === 'properties' ? 'text-gray-700' : step === 'config' || step === 'schedule' ? 'text-gray-500' : 'text-gray-300'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'properties' ? 'bg-keppel-500 text-seasalt-500' : step === 'config' || step === 'schedule' ? 'bg-slate-200 text-gray-500' : 'bg-slate-100 text-gray-500'
          }`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Reorder Properties</span>
        </div>
        <div className={`w-8 h-1 ${step === 'config' || step === 'schedule' ? 'bg-keppel-500' : 'bg-slate-200'}`}></div>
        <div className={`flex items-center ${step === 'config' ? 'text-gray-700' : step === 'schedule' ? 'text-gray-500' : 'text-gray-300'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'config' ? 'bg-keppel-500 text-seasalt-500' : step === 'schedule' ? 'bg-slate-200 text-gray-500' : 'bg-slate-100 text-gray-500'
          }`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Configure Tour</span>
        </div>
        <div className={`w-8 h-1 ${step === 'schedule' ? 'bg-keppel-500' : 'bg-slate-200'}`}></div>
        <div className={`flex items-center ${step === 'schedule' ? 'text-gray-700' : 'text-gray-300'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'schedule' ? 'bg-keppel-500 text-seasalt-500' : 'bg-slate-100 text-gray-500'
          }`}>
            4
          </div>
          <span className="ml-2 text-sm font-medium">View Schedule</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      {step === 'input' && (
        <PropertyInput
          mlsInput={mlsInput}
          setMlsInput={setMlsInput}
          onSubmit={handleMlsSubmit}
          properties={properties}
        />
      )}

      {step === 'properties' && (
        <PropertyList
          properties={tourProperties}
          onReorder={handlePropertyReorder}
          onRemove={handlePropertyRemove}
          onNext={() => setStep('config')}
          onBack={handleBack}
        />
      )}

      {step === 'config' && (
        <TourConfiguration
          config={tourConfig}
          properties={tourProperties}
          onSubmit={handleConfigSubmit}
          onCalculate={handleCalculateTour}
          onBack={handleBack}
          loading={loading}
        />
      )}

      {step === 'schedule' && schedule && (
        <TourSchedule
          schedule={schedule}
          properties={tourProperties}
          config={tourConfig}
          onSave={handleSaveTour}
          onBack={handleBack}
          onStartOver={handleStartOver}
          loading={loading}
        />
      )}
    </div>
  )
}
