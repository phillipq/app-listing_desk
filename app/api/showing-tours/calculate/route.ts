import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleMapsRouteService } from '@/lib/google-maps-route-service'

interface TourProperty {
  id: string
  mlsId: string
  address: string
  latitude?: number
  longitude?: number
}

interface TourConfig {
  name: string
  description?: string
  showingDate?: string
  startTime: string
  endTime: string
  showingDuration: number
  startTimeType: string
  propertyDurations?: Record<string, number>
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { properties: TourProperty[]; config: TourConfig }
    const { properties, config } = body

    if (!properties || properties.length === 0) {
      return NextResponse.json({ error: 'Properties are required' }, { status: 400 })
    }

    if (!config) {
      return NextResponse.json({ error: 'Configuration is required' }, { status: 400 })
    }

    // Calculate the tour schedule
    const schedule = await calculateTourSchedule(properties, config)

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error calculating tour schedule:', error)
    return NextResponse.json({ error: 'Failed to calculate tour schedule' }, { status: 500 })
  }
}

async function calculateTourSchedule(properties: TourProperty[], config: TourConfig): Promise<TourSchedule> {
  console.log('API received config:', config)
  console.log('API received showingDuration:', config.showingDuration)
  console.log('API received propertyDurations:', config.propertyDurations)
  
  // Calculate total showing time using individual property durations
  const totalShowingTime = properties.reduce((total, property) => {
    const propertyDuration = config.propertyDurations?.[property.id] || config.showingDuration
    return total + propertyDuration
  }, 0)
  
  // Parse time window
  const startTime = parseTime(config.startTime)
  const endTime = parseTime(config.endTime)
  const timeWindowMinutes = (endTime - startTime) * 60
  
  let totalDriveTime = 0
  const scheduleItems: ScheduleItem[] = []
  let googleMapsUrl = ''
  let currentTime = startTime * 60 // Convert to minutes
  
  try {
    // Use Google Maps API for real route optimization
    const routeService = new GoogleMapsRouteService()
    
    // Convert properties to waypoints
    const waypoints = properties
      .filter(prop => prop.latitude && prop.longitude)
      .map(prop => ({
        lat: prop.latitude!,
        lng: prop.longitude!
      }))
    
    if (waypoints.length < 2) {
      throw new Error('At least 2 properties with coordinates are required for route optimization')
    }
    
    // Optimize route
    const routeResult = await routeService.optimizeRoute(waypoints)
    totalDriveTime = Math.round(routeResult.totalDuration / 60) // Convert to minutes
    
    // Generate Google Maps URL
    googleMapsUrl = routeService.generateMapsUrl(waypoints, routeResult.optimizedOrder)
    
    // Generate schedule items based on optimized route
    currentTime = startTime * 60 // Reset to start time
    
    for (let i = 0; i < routeResult.optimizedOrder.length; i++) {
      const propertyIndex = routeResult.optimizedOrder[i]
      if (propertyIndex === undefined) continue
      const property = properties[propertyIndex]
      
      if (!property) continue
      
      // Calculate the next available booking time based on user preference
      const nextBookingTime = getNextBookingTime(currentTime, config.startTimeType)
      
      // Add buffer time if needed (gap between current time and next booking time)
      if (nextBookingTime > currentTime) {
        const bufferDuration = nextBookingTime - currentTime
        const bufferTime = formatTimeFromMinutes(currentTime)
        scheduleItems.push({
          time: bufferTime,
          type: 'buffer',
          duration: bufferDuration,
          address: `Buffer time to next showing`,
          driveTime: 0
        })
        currentTime = nextBookingTime
      }
      
      // Add showing time
      const propertyDuration = config.propertyDurations?.[property.id] || config.showingDuration
      const showingTime = formatTimeFromMinutes(currentTime)
      console.log(`Creating showing item with duration: ${propertyDuration} minutes`)
      scheduleItems.push({
        time: showingTime,
        type: 'showing',
        property,
        duration: propertyDuration,
        address: property.address
      })
      
      currentTime += propertyDuration
      
      // Add travel time (except for last property)
      if (i < routeResult.optimizedOrder.length - 1) {
        const route = routeResult.routes[i]
        if (route) {
          const driveTime = Math.round(route.duration / 60) // Convert to minutes
          const travelTime = formatTimeFromMinutes(currentTime)
          const nextPropertyIndex = routeResult.optimizedOrder[i + 1]
          if (nextPropertyIndex === undefined) continue
          const nextProperty = properties[nextPropertyIndex]
          
          if (nextProperty) {
            scheduleItems.push({
              time: travelTime,
              type: 'travel',
              duration: driveTime,
              address: nextProperty.address,
              driveTime
            })
            
            currentTime += driveTime
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error calculating route with Google Maps:', error)
    
    // Fallback to simple ordering if Google Maps fails
    totalDriveTime = (properties.length - 1) * 15 // 15 minutes between properties
    currentTime = startTime * 60
    
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i]
      
      if (!property) continue
      
      // Calculate the next available booking time based on user preference
      const nextBookingTime = getNextBookingTime(currentTime, config.startTimeType)
      
      // Add buffer time if needed (gap between current time and next booking time)
      if (nextBookingTime > currentTime) {
        const bufferDuration = nextBookingTime - currentTime
        const bufferTime = formatTimeFromMinutes(currentTime)
        scheduleItems.push({
          time: bufferTime,
          type: 'buffer',
          duration: bufferDuration,
          address: `Buffer time to next showing`,
          driveTime: 0
        })
        currentTime = nextBookingTime
      }
      
      // Add showing time
      const propertyDuration = config.propertyDurations?.[property.id] || config.showingDuration
      const showingTime = formatTimeFromMinutes(currentTime)
      console.log(`Creating showing item with duration: ${propertyDuration} minutes`)
      scheduleItems.push({
        time: showingTime,
        type: 'showing',
        property,
        duration: propertyDuration,
        address: property.address
      })
      
      currentTime += propertyDuration
      
      // Add travel time (except for last property)
      if (i < properties.length - 1) {
        const driveTime = 15 // Fallback to 15 minutes
        const travelTime = formatTimeFromMinutes(currentTime)
        const nextProperty = properties[i + 1]
        
        if (nextProperty) {
          scheduleItems.push({
            time: travelTime,
            type: 'travel',
            duration: driveTime,
            address: nextProperty.address,
            driveTime
          })
          
          currentTime += driveTime
        }
      }
    }
    
    // Generate fallback Google Maps URL
    googleMapsUrl = generateGoogleMapsUrl(properties)
  }
  
  const totalDuration = totalShowingTime + totalDriveTime
  const canFitInWindow = totalDuration <= timeWindowMinutes
  
  const calculatedStartTime = formatTimeFromMinutes(startTime * 60)
  const calculatedEndTime = formatTimeFromMinutes(currentTime)
  
  return {
    totalDuration,
    canFitInWindow,
    startTime: calculatedStartTime,
    endTime: calculatedEndTime,
    totalDriveTime,
    totalShowingTime,
    scheduleItems,
    googleMapsUrl
  }
}

function parseTime(timeString: string): number {
  const parts = timeString.split(' ')
  if (parts.length < 2) return 10 // Default to 10 AM if parsing fails
  
  const time = parts[0]
  const period = parts[1]
  
  if (!time || !period) return 10 // Default to 10 AM if parsing fails
  
  const timeParts = time.split(':')
  if (timeParts.length < 2) return 10 // Default to 10 AM if parsing fails
  
  const hours = Number(timeParts[0])
  const minutes = Number(timeParts[1])
  
  if (isNaN(hours) || isNaN(minutes)) {
    return 10 // Default to 10 AM if parsing fails
  }
  
  let hour24 = hours
  if (period === 'PM' && hours !== 12) {
    hour24 += 12
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0
  }
  
  return hour24 + (minutes / 60)
}

function formatTimeFromMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const period = hours >= 12 ? 'PM' : 'AM'
  
  return `${hour12}:${mins.toString().padStart(2, '0')} ${period}`
}

function getNextBookingTime(currentTimeMinutes: number, startTimeType: string): number {
  const isOnTheHour = startTimeType === 'hour'
  
  if (isOnTheHour) {
    // For "on the hour" scheduling, round to the next available hour
    const currentHour = Math.floor(currentTimeMinutes / 60)
    const currentMinutes = currentTimeMinutes % 60
    
    // If we're past the hour (any minutes > 0), round up to next hour
    if (currentMinutes > 0) {
      return (currentHour + 1) * 60
    } else {
      return currentHour * 60
    }
  } else {
    // For "on the half-hour" scheduling, round to the next available half-hour
    const currentHour = Math.floor(currentTimeMinutes / 60)
    const currentMinutes = currentTimeMinutes % 60
    
    // Calculate potential booking times
    const hourSlot = currentHour * 60
    const halfHourSlot = currentHour * 60 + 30
    const nextHourSlot = (currentHour + 1) * 60
    
    // Find the next available slot that's not in the past
    let nextSlotMinutes
    
    if (currentMinutes <= 15) {
      // Round down to the hour (only if we're at or before 15 minutes past)
      nextSlotMinutes = hourSlot
    } else if (currentMinutes <= 45) {
      // Round to half-hour (only if we're at or before 45 minutes past)
      nextSlotMinutes = halfHourSlot
    } else {
      // Round up to next hour (if we're past 45 minutes)
      nextSlotMinutes = nextHourSlot
    }
    
    // If the calculated slot is in the past, move to the next available slot
    if (nextSlotMinutes < currentTimeMinutes) {
      if (currentMinutes <= 15) {
        // If we were trying to go to the hour but it's in the past, go to half-hour
        nextSlotMinutes = halfHourSlot
      } else if (currentMinutes <= 45) {
        // If we were trying to go to half-hour but it's in the past, go to next hour
        nextSlotMinutes = nextHourSlot
      } else {
        // If we were trying to go to next hour but it's in the past, go to next half-hour
        nextSlotMinutes = (currentHour + 1) * 60 + 30
      }
    }
    
    return nextSlotMinutes
  }
}

function generateGoogleMapsUrl(properties: TourProperty[]): string {
  // Generate a Google Maps URL with waypoints
  const baseUrl = 'https://www.google.com/maps/dir/'
  
  if (properties.length === 0) return baseUrl
  
  // Add all addresses as waypoints
  const waypoints = properties.map(prop => encodeURIComponent(prop.address)).join('/')
  
  return `${baseUrl}${waypoints}`
}
