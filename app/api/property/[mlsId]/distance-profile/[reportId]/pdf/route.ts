import jsPDF from 'jspdf'
import { NextRequest, NextResponse } from 'next/server'
import { distanceProfileService } from '@/lib/distance-profile-service'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string; reportId: string }> }
) {
  try {
    const { mlsId, reportId } = await params
    
    // Get the distance profile data
    const profile = await distanceProfileService.getDistanceProfileById(reportId)
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Generate PDF using jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Add header
    pdf.setFillColor(102, 126, 234) // Blue gradient color
    pdf.rect(0, 0, pageWidth, 40, 'F')
    
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(24)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Location Insights Report', pageWidth / 2, 20, { align: 'center' })
    
    pdf.setFontSize(16)
    pdf.text(`${profile.profile.profileName || 'Custom Profile'} - Generated ${new Date(profile.profile.createdAt).toLocaleDateString()}`, pageWidth / 2, 30, { align: 'center' })
    
    // Reset text color for content
    pdf.setTextColor(0, 0, 0)
    
    // Add property information
    let yPosition = 60
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Property Information', 20, yPosition)
    
    yPosition += 15
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    const categories = Object.keys(profile.amenitiesByCategory)
    const totalAmenities = Object.values(profile.amenitiesByCategory).flat().length
    const travelStats = calculateTravelStats(profile.amenitiesByCategory)
    
    // Debug: Log travel stats
    console.log('Travel stats:', travelStats)
    console.log('Sample amenity:', Object.values(profile.amenitiesByCategory).flat()[0])
    
    pdf.text(`MLS ID: ${mlsId}`, 20, yPosition)
    yPosition += 10
    pdf.text(`Total Amenities: ${totalAmenities}`, 20, yPosition)
    yPosition += 10
    pdf.text(`Categories: ${categories.length}`, 20, yPosition)
    yPosition += 10
    pdf.text(`Generated: ${new Date(profile.profile.createdAt).toLocaleString()}`, 20, yPosition)
    
    // Add travel time comparison
    yPosition += 20
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Average Travel Times by Transportation Mode', 20, yPosition)
    
    yPosition += 15
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    // Create a simple bar chart for travel times
    const maxTime = Math.max(travelStats.driving, travelStats.walking, travelStats.transit)
    const barWidth = 100
    const barHeight = 8
    
    // Driving bar
    const drivingWidth = maxTime > 0 ? (travelStats.driving / maxTime) * barWidth : 0
    pdf.setFillColor(90, 161, 151) // keppel color
    pdf.rect(20, yPosition, drivingWidth, barHeight, 'F')
    pdf.text(`Driving: ${travelStats.driving.toFixed(1)} minutes`, 130, yPosition + 6)
    yPosition += 15
    
    // Walking bar
    const walkingWidth = maxTime > 0 ? (travelStats.walking / maxTime) * barWidth : 0
    pdf.setFillColor(231, 165, 115) // buff color
    pdf.rect(20, yPosition, walkingWidth, barHeight, 'F')
    pdf.text(`Walking: ${travelStats.walking.toFixed(1)} minutes`, 130, yPosition + 6)
    yPosition += 15
    
    // Transit bar
    const transitWidth = maxTime > 0 ? (travelStats.transit / maxTime) * barWidth : 0
    pdf.setFillColor(123, 123, 123) // gray color
    pdf.rect(20, yPosition, transitWidth, barHeight, 'F')
    pdf.text(`Transit: ${travelStats.transit.toFixed(1)} minutes`, 130, yPosition + 6)
    yPosition += 20
    
    // Add category breakdown
    yPosition += 20
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Category Breakdown', 20, yPosition)
    
    yPosition += 15
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    // Create a table-like layout for categories
    const col1X = 20
    const col2X = 100
    const col3X = 150
    let currentY = yPosition
    
    // Header
    pdf.setFont('helvetica', 'bold')
    pdf.text('Category', col1X, currentY)
    pdf.text('Count', col2X, currentY)
    pdf.text('Percentage', col3X, currentY)
    currentY += 10
    
    // Draw header line
    pdf.setDrawColor(200, 200, 200)
    pdf.line(col1X, currentY - 2, 180, currentY - 2)
    currentY += 5
    
    pdf.setFont('helvetica', 'normal')
    
    categories.forEach(category => {
      // Skip duplicate categories with extra text
      if (category.includes('(') && category.includes(')')) {
        return
      }
      const amenities = profile.amenitiesByCategory[category] || []
      const percentage = totalAmenities > 0 ? ((amenities.length / totalAmenities) * 100).toFixed(1) : '0.0'
      
      pdf.text(getCategoryDisplayName(category), col1X, currentY)
      pdf.text(amenities.length.toString(), col2X, currentY)
      pdf.text(`${percentage}%`, col3X, currentY)
      currentY += 8
    })
    
    // Add key insights
    yPosition += 10
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Key Insights', 20, yPosition)
    
    yPosition += 15
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    
    const quickAccess = getQuickAccessInsight(profile.amenitiesByCategory)
    const walkableInsight = getWalkableInsight(profile.amenitiesByCategory)
    const transitInsight = getTransitInsight(profile.amenitiesByCategory)
    
    pdf.text(`Quick Access: ${quickAccess}`, 20, yPosition)
    yPosition += 10
    pdf.text(`Walkable Amenities: ${walkableInsight}`, 20, yPosition)
    yPosition += 10
    pdf.text(`Transit Access: ${transitInsight}`, 20, yPosition)
    
    // Get property location for maps
    let propertyLocation: { lat: number; lng: number } | null = null
    if (profile.profile.isAdHoc && profile.profile.adHocLatitude && profile.profile.adHocLongitude) {
      propertyLocation = {
        lat: profile.profile.adHocLatitude,
        lng: profile.profile.adHocLongitude
      }
    } else if (profile.profile.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: profile.profile.propertyId },
        select: { latitude: true, longitude: true }
      })
      if (property?.latitude && property?.longitude) {
        propertyLocation = {
          lat: property.latitude,
          lng: property.longitude
        }
      }
    }
    
    // Add Google Maps for each category
    if (propertyLocation) {
      yPosition += 20
      
      // Generate maps for each category
      const validCategories = categories.filter(cat => {
        // Skip duplicate categories with extra text
        if (cat.includes('(') && cat.includes(')')) {
          return false
        }
        const amenities = profile.amenitiesByCategory[cat] || []
        return amenities.length > 0 && amenities.some(a => a.latitude && a.longitude)
      })
      
      for (const category of validCategories) {
        const amenities = profile.amenitiesByCategory[category] || []
        const amenitiesWithCoords = amenities.filter(a => a.latitude && a.longitude)
        
        if (amenitiesWithCoords.length === 0) continue
        
        // Start each category on a new page to ensure it fits
        pdf.addPage()
        yPosition = 20
        
        // Limit to 20 amenities for map display (Google Static Maps API limit)
        const limitedAmenities = amenitiesWithCoords.slice(0, 20)
        
        // Category header
        pdf.setFontSize(18)
        pdf.setFont('helvetica', 'bold')
        pdf.text(getCategoryDisplayName(category), 20, yPosition)
        yPosition += 12
        
        // Show count of amenities
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 100, 100)
        const shownCount = limitedAmenities.length
        if (amenitiesWithCoords.length > 20) {
          pdf.text(`Showing ${shownCount} of ${amenitiesWithCoords.length} locations`, 20, yPosition)
        } else {
          pdf.text(`${shownCount} location${shownCount !== 1 ? 's' : ''}`, 20, yPosition)
        }
        yPosition += 10
        
        // Reset text color
        pdf.setTextColor(0, 0, 0)
        
        // Generate Google Static Map with numbered markers
        try {
          const mapImageUrl = generateStaticMapUrl(propertyLocation, limitedAmenities, category)
          const mapImage = await fetchMapImage(mapImageUrl)
          
          if (mapImage) {
            // Adjust map size to leave room for amenity list
            // Smaller map: 120mm x 120mm instead of 170mm
            const mapWidth = 120 // mm
            const mapHeight = 120 // mm
            
            // Center the map horizontally
            const mapX = (pageWidth - mapWidth) / 2
            pdf.addImage(mapImage, 'PNG', mapX, yPosition, mapWidth, mapHeight)
            yPosition += mapHeight + 8
            
            // Add legend
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'normal')
            pdf.setTextColor(100, 100, 100)
            pdf.text('Legend: Red marker (P) = Property, Numbered markers = Amenities', pageWidth / 2, yPosition, { align: 'center' })
            yPosition += 10
          }
        } catch (error) {
          console.error(`Error generating map for category ${category}:`, error)
          pdf.setFontSize(10)
          pdf.setTextColor(128, 128, 128)
          pdf.text(`Map unavailable for ${getCategoryDisplayName(category)}`, 20, yPosition)
          yPosition += 10
        }
        
        // Reset text color
        pdf.setTextColor(0, 0, 0)
        
        // Add amenity list with numbers in columns
        yPosition += 5
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Amenities List:', 20, yPosition)
        yPosition += 8
        
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        
        // Calculate column layout
        // Use 2 columns for better space utilization
        const numColumns = 2
        const columnWidth = (pageWidth - 40) / numColumns // 40mm for margins
        const itemsPerColumn = Math.ceil(limitedAmenities.length / numColumns)
        
        // Track starting Y position for each column
        const startY = yPosition
        let lineHeight = 12 // Height per amenity item in mm
        
        // Calculate if we have enough space - if not, reduce font sizes
        const maxItemsPerColumn = Math.floor((pageHeight - startY - 15) / lineHeight)
        const needsCompactLayout = itemsPerColumn > maxItemsPerColumn
        
        if (needsCompactLayout) {
          // Use smaller font for compact layout
          pdf.setFontSize(8)
          lineHeight = 10
        }
        
        // Split amenities into columns
        for (let col = 0; col < numColumns; col++) {
          const columnX = 20 + (col * columnWidth)
          let currentY = startY
          
          // Get amenities for this column
          const columnStart = col * itemsPerColumn
          const columnEnd = Math.min(columnStart + itemsPerColumn, limitedAmenities.length)
          const columnAmenities = limitedAmenities.slice(columnStart, columnEnd)
          
          columnAmenities.forEach((amenity, indexInColumn) => {
            const globalIndex = columnStart + indexInColumn
            const number = globalIndex + 1
            const amenityName = typeof amenity.name === 'string' ? amenity.name : 'Unknown'
            const amenityAddress = typeof amenity.address === 'string' ? amenity.address : ''
            
            // Get travel times if available
            const travelTimes = amenity.travelTimes?.[0]
            const drivingTime = travelTimes?.drivingTime
            const walkingTime = travelTimes?.walkingTime
            
            // Format travel time info
            let travelInfo = ''
            if (typeof drivingTime === 'number') {
              travelInfo = ` • ${Math.round(drivingTime)} min`
            } else if (typeof walkingTime === 'number') {
              travelInfo = ` • ${Math.round(walkingTime)} min`
            }
            
            // Draw numbered circle
            const circleX = columnX
            const circleY = currentY - 3
            pdf.setFillColor(90, 161, 151) // keppel color
            pdf.circle(circleX, circleY, 3, 'F')
            pdf.setTextColor(255, 255, 255)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(7)
            pdf.text(number.toString(), circleX, circleY + 1, { align: 'center' })
            
            // Reset colors and font
            pdf.setTextColor(0, 0, 0)
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(needsCompactLayout ? 8 : 9)
            
            // Amenity name and details - truncate if too long
            const textX = columnX + 8
            const maxTextWidth = columnWidth - 12 // Leave space for number and margin
            
            // Truncate name if needed (estimate: ~2.5 chars per mm for 9pt font)
            let displayName = amenityName
            const maxCharsForName = Math.floor(maxTextWidth * 2.5)
            if (displayName.length > maxCharsForName) {
              displayName = displayName.substring(0, maxCharsForName - 3) + '...'
            }
            
            pdf.text(displayName, textX, currentY)
            currentY += (needsCompactLayout ? 3.5 : 4)
            
            // Address (smaller, gray)
            if (amenityAddress) {
              pdf.setFontSize(needsCompactLayout ? 7 : 8)
              pdf.setTextColor(100, 100, 100)
              
              // Truncate address (estimate: ~2.8 chars per mm for 8pt font)
              let displayAddress = amenityAddress
              const maxCharsForAddress = Math.floor(maxTextWidth * 2.8)
              if (displayAddress.length > maxCharsForAddress) {
                displayAddress = displayAddress.substring(0, maxCharsForAddress - 3) + '...'
              }
              
              pdf.text(displayAddress, textX, currentY)
              currentY += (needsCompactLayout ? 3 : 3.5)
              pdf.setTextColor(0, 0, 0)
              pdf.setFontSize(needsCompactLayout ? 8 : 9)
            }
            
            // Travel time (smaller, keppel green)
            if (travelInfo) {
              pdf.setFontSize(needsCompactLayout ? 7 : 8)
              pdf.setTextColor(90, 161, 151)
              pdf.text(travelInfo, textX, currentY)
              currentY += (needsCompactLayout ? 2.5 : 3)
              pdf.setTextColor(0, 0, 0)
              pdf.setFontSize(needsCompactLayout ? 8 : 9)
            }
            
            currentY += (needsCompactLayout ? 2 : 2.5) // Space between items
          })
          
          // Update yPosition to the maximum height used by any column
          yPosition = Math.max(yPosition, currentY)
        }
      }
    }
    
    // Add footer
    pdf.setFontSize(10)
    pdf.setTextColor(108, 117, 125)
    pdf.text(`Generated by Location Insights Dashboard - ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="location-insights-${mlsId}-${reportId}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}


type AmenityTravel = { drivingTime: number | null; walkingTime: number | null; transitTime: number | null }
type AmenityItem = { travelTimes?: AmenityTravel[] }

function calculateTravelStats(
  amenities: Record<string, AmenityItem[]>
): { driving: number; walking: number; transit: number } {
  const stats = { driving: 0, walking: 0, transit: 0 }
  const counts = { driving: 0, walking: 0, transit: 0 }

  const items = Object.values(amenities).flat()
  for (const item of items) {
    const tt = item.travelTimes?.[0]
    if (!tt) continue
    if (typeof tt.drivingTime === 'number') {
      stats.driving += tt.drivingTime
      counts.driving++
    }
    if (typeof tt.walkingTime === 'number') {
      stats.walking += tt.walkingTime
      counts.walking++
    }
    if (typeof tt.transitTime === 'number') {
      stats.transit += tt.transitTime
      counts.transit++
    }
  }

  if (counts.driving > 0) stats.driving /= counts.driving
  if (counts.walking > 0) stats.walking /= counts.walking
  if (counts.transit > 0) stats.transit /= counts.transit

  return stats
}

function getCategoryDisplayName(category: string): string {
  const displayNames: { [key: string]: string } = {
    'grocery': 'Grocery Stores',
    'pharmacy': 'Pharmacies',
    'gym': 'Gyms & Fitness',
    'shopping': 'Shopping Centers',
    'restaurants': 'Restaurants',
    'nightlife': 'Nightlife & Bars',
    'transit': 'Public Transit',
    'schools': 'Schools',
    'hospitals': 'Hospitals',
    'parks': 'Parks & Recreation',
    'dining': 'Dining',
    'services': 'Services'
  }
  return displayNames[category] || category
}

function getQuickAccessInsight(amenities: Record<string, AmenityItem[]>): string {
  const categories = Object.keys(amenities)
  const totalAmenities = Object.values(amenities).flat().length
  return `${totalAmenities} amenities across ${categories.length} categories within easy reach`
}

function getWalkableInsight(amenities: Record<string, AmenityItem[]>): string {
  const walkableCount = Object.values(amenities)
    .flat()
    .filter((amenity: AmenityItem) => {
      const tt = amenity.travelTimes?.[0]
      return typeof tt?.walkingTime === 'number' && tt.walkingTime <= 10
    }).length
  return `${walkableCount} amenities within 10 minutes walking distance`
}

function getTransitInsight(amenities: Record<string, AmenityItem[]>): string {
  const transitCount = Object.values(amenities)
    .flat()
    .filter((amenity: AmenityItem) => {
      const tt = amenity.travelTimes?.[0]
      return typeof tt?.transitTime === 'number' && tt.transitTime <= 15
    }).length
  return `${transitCount} amenities accessible via public transit within 15 minutes`
}

/**
 * Generate Google Static Maps URL for a category with numbered markers
 */
function generateStaticMapUrl(
  propertyLocation: { lat: number; lng: number },
  amenities: Array<{ latitude: number; longitude: number; name?: string }>,
  _category: string
): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }
  
  // Base URL for Static Maps API
  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
  
  // Map size (480x480 pixels for smaller map)
  const size = '480x480'
  
  // Map type
  const maptype = 'roadmap'
  
  // Property marker (red with "P" label)
  const propertyMarker = `markers=color:red|label:P|${propertyLocation.lat},${propertyLocation.lng}`
  
  // Amenity markers with numbers (blue with numbered labels 1-20)
  // Google Static Maps API supports numbered labels from 0-99
  // We need separate marker groups for each numbered marker
  const limitedAmenities = amenities.slice(0, 20)
  
  // Build numbered markers - each marker needs its own group
  const amenityMarkerGroups: string[] = []
  limitedAmenities.forEach((amenity, index) => {
    const number = index + 1
    // Use green markers with numbers 1-20
    const marker = `markers=color:0x5AA197|label:${number}|${amenity.latitude},${amenity.longitude}`
    amenityMarkerGroups.push(marker)
  })
  
  const allMarkerGroups = [propertyMarker, ...amenityMarkerGroups].join('&')
  
  // Calculate center point for better map view
  const allPoints = [propertyLocation, ...limitedAmenities.map(a => ({ lat: a.latitude, lng: a.longitude }))]
  const centerLat = allPoints.reduce((sum, p) => sum + p.lat, 0) / allPoints.length
  const centerLng = allPoints.reduce((sum, p) => sum + p.lng, 0) / allPoints.length
  
  // Calculate zoom level based on spread of points
  const maxDist = Math.max(...allPoints.map(p => {
    const latDiff = p.lat - centerLat
    const lngDiff = p.lng - centerLng
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
  }))
  
  // Approximate zoom level
  let zoom = 13
  if (maxDist > 0.1) zoom = 11
  else if (maxDist > 0.05) zoom = 12
  else if (maxDist > 0.02) zoom = 13
  else if (maxDist > 0.01) zoom = 14
  else zoom = 15
  
  // Build the URL with center and zoom
  const url = `${baseUrl}?${allMarkerGroups}&center=${centerLat},${centerLng}&zoom=${zoom}&size=${size}&maptype=${maptype}&key=${apiKey}`
  
  return url
}

/**
 * Fetch map image from Google Static Maps API
 */
async function fetchMapImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`Failed to fetch map image: ${response.status} ${response.statusText}`)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Convert to base64 data URL for jsPDF
    const base64 = buffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error('Error fetching map image:', error)
    return null
  }
}
