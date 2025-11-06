import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SerpAPITrendsService } from '@/lib/serpapi-trends-service'

// GET - Fetch trending searches from SerpAPI
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get realtor by session user ID
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id }
    })

    if (!realtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // Get realtor's location from properties
    const property = await prisma.property.findFirst({
      where: { realtorId: realtor.id },
      select: { city: true, province: true }
    })

    const location = property 
      ? `${property.city}, ${property.province}`
      : 'Unknown'

    // Get geo code (CA for Canada, US for United States)
    let geoCode = 'US' // default
    if (location.includes('BC') || location.includes('AB') || location.includes('ON') || location.includes('CA')) {
      geoCode = 'CA'
    }

    // Initialize SerpAPI service
    const serpAPIService = new SerpAPITrendsService()
    
    if (!serpAPIService.isConfigured()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SerpAPI not configured',
          message: 'Please add SERPAPI_API_KEY to your .env file'
        },
        { status: 500 }
      )
    }

    // Fetch trending searches
    const trendingSearches = await serpAPIService.fetchTrendingSearches(geoCode)

    return NextResponse.json({
      success: true,
      trendingSearches,
      location,
      geoCode,
      source: 'SerpAPI',
      note: 'Free tier: 250 searches/month'
    })
  } catch (error) {
    console.error('Error fetching SerpAPI trending searches:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if it's a quota error
    if (message.includes('quota') || message.includes('limit')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'SerpAPI quota exceeded',
          message: 'You have used all 250 free searches this month. Upgrade your plan or wait until next month.',
          details: message
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending searches', details: message },
      { status: 500 }
    )
  }
}

