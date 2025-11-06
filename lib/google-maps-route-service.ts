interface LatLng {
  lat: number
  lng: number
}

interface RouteResult {
  distance: number // in meters
  duration: number // in seconds
  polyline: string
}

interface RouteOptimizationResult {
  optimizedOrder: number[]
  totalDistance: number
  totalDuration: number
  routes: RouteResult[]
}

export class GoogleMapsRouteService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('Google Maps API key is required')
    }
  }

  /**
   * Calculate the optimal route through multiple waypoints
   */
  async optimizeRoute(waypoints: LatLng[]): Promise<RouteOptimizationResult> {
    if (waypoints.length < 2) {
      throw new Error('At least 2 waypoints are required')
    }

    // For now, we'll use a simple nearest neighbor algorithm
    // In a production system, you'd want to use Google's optimization API
    const optimizedOrder = this.nearestNeighborOptimization(waypoints)
    
    // Calculate routes between consecutive points
    const routes: RouteResult[] = []
    let totalDistance = 0
    let totalDuration = 0

    for (let i = 0; i < optimizedOrder.length - 1; i++) {
      const fromIndex = optimizedOrder[i]
      const toIndex = optimizedOrder[i + 1]
      
      if (fromIndex === undefined || toIndex === undefined) continue
      
      const from = waypoints[fromIndex]
      const to = waypoints[toIndex]
      
      if (!from || !to) continue
      
      try {
        const route = await this.calculateRoute(from, to)
        routes.push(route)
        totalDistance += route.distance
        totalDuration += route.duration
      } catch (error) {
        console.error(`Error calculating route from ${i} to ${i + 1}:`, error)
        // Fallback to straight-line distance
        const fallbackRoute = this.calculateStraightLineRoute(from, to)
        routes.push(fallbackRoute)
        totalDistance += fallbackRoute.distance
        totalDuration += fallbackRoute.duration
      }
    }

    return {
      optimizedOrder,
      totalDistance,
      totalDuration,
      routes
    }
  }

  /**
   * Calculate route between two points using Google Maps Directions API
   */
  private async calculateRoute(origin: LatLng, destination: LatLng): Promise<RouteResult> {
    const originStr = `${origin.lat},${origin.lng}`
    const destinationStr = `${destination.lat},${destination.lng}`
    
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&key=${this.apiKey}&mode=driving&departure_time=now`
    
    const response = await fetch(url)
    const data = await response.json() as {
      status: string
      routes: Array<{
        legs: Array<{
          distance: { value: number }
          duration: { value: number }
        }>
        overview_polyline: { points: string }
      }>
    }

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`)
    }

    const route = data.routes[0]
    if (!route || !route.legs[0]) {
      throw new Error('No route data available')
    }
    
    const leg = route.legs[0]

    return {
      distance: leg.distance.value,
      duration: leg.duration.value,
      polyline: route.overview_polyline.points
    }
  }

  /**
   * Simple nearest neighbor optimization algorithm
   */
  private nearestNeighborOptimization(waypoints: LatLng[]): number[] {
    if (waypoints.length <= 2) {
      return Array.from({ length: waypoints.length }, (_, i) => i)
    }

    const visited = new Set<number>()
    const order: number[] = [0] // Start with first waypoint
    visited.add(0)

    let current = 0

    while (visited.size < waypoints.length) {
      let nearest = -1
      let minDistance = Infinity

      for (let i = 0; i < waypoints.length; i++) {
        if (!visited.has(i)) {
          const currentPoint = waypoints[current]
          const targetPoint = waypoints[i]
          if (currentPoint && targetPoint) {
            const distance = this.calculateDistance(currentPoint, targetPoint)
            if (distance < minDistance) {
              minDistance = distance
              nearest = i
            }
          }
        }
      }

      if (nearest !== -1) {
        order.push(nearest)
        visited.add(nearest)
        current = nearest
      }
    }

    return order
  }

  /**
   * Calculate straight-line distance between two points (Haversine formula)
   */
  private calculateDistance(point1: LatLng, point2: LatLng): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * Calculate fallback route using straight-line distance
   */
  private calculateStraightLineRoute(origin: LatLng, destination: LatLng): RouteResult {
    const distance = this.calculateDistance(origin, destination)
    // Estimate driving time as 1 minute per 100 meters (rough average)
    const duration = Math.max(60, Math.round(distance / 100 * 60))
    
    return {
      distance,
      duration,
      polyline: '' // No polyline for straight-line routes
    }
  }

  /**
   * Generate Google Maps URL for the optimized route
   */
  generateMapsUrl(waypoints: LatLng[], optimizedOrder: number[]): string {
    if (waypoints.length === 0) return 'https://maps.google.com'
    
    const orderedWaypoints = optimizedOrder.map(index => waypoints[index]).filter(Boolean)
    if (orderedWaypoints.length === 0) return 'https://maps.google.com'
    
    const origin = orderedWaypoints[0]
    const destination = orderedWaypoints[orderedWaypoints.length - 1]
    const waypointStops = orderedWaypoints.slice(1, -1)
    
    if (!origin || !destination) return 'https://maps.google.com'
    
    let url = `https://www.google.com/maps/dir/${origin.lat},${origin.lng}`
    
    if (waypointStops.length > 0) {
      url += `/${waypointStops.map(wp => wp ? `${wp.lat},${wp.lng}` : '').filter(Boolean).join('/')}`
    }
    
    url += `/${destination.lat},${destination.lng}`
    
    return url
  }
}
