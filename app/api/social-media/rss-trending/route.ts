import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TrendingSearchService } from '@/lib/trending-search-service'
import { SerpAPITrendsService } from '@/lib/serpapi-trends-service'

// GET - Fetch trending topics from Google Trends RSS feed
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

    // Get realtor's location from properties (for display)
    const property = await prisma.property.findFirst({
      where: { realtorId: realtor.id },
      select: { city: true, province: true }
    })

    const location = property 
      ? `${property.city}, ${property.province}`
      : 'Canada'

    // Get RSS geo code - default to Canada (CA) as requested
    const trendingService = new TrendingSearchService()
    let geoCode = trendingService.getRSSGeoCode(location)
    
    // Force Canada if location detection fails or defaults to US
    // User specifically requested Canada for overall trending searches
    if (geoCode === 'US' || !property) {
      geoCode = 'CA'
    }
    
    // Try SerpAPI first if configured (more detailed data)
    const serpAPIService = new SerpAPITrendsService()
    let trendingTopics: Array<{
      title: string
      link: string
      pubDate: string
      description?: string
      category?: string
      traffic?: string
      picture?: string
      pictureSource?: string
    }> = []

    if (serpAPIService.isConfigured()) {
      try {
        const serpTrends = await serpAPIService.fetchTrendingSearches(geoCode)
        
        // Convert SerpAPI format to RSS-like format for consistency
        trendingTopics = serpTrends.map((trend) => ({
          title: trend.title,
          link: trend.link || `https://trends.google.com/trending/explore?q=${encodeURIComponent(trend.title)}&geo=${geoCode}`,
          pubDate: trend.date || new Date().toISOString(),
          description: trend.snippet || trend.stories?.[0]?.title,
          category: undefined, // SerpAPI doesn't provide categories directly
          traffic: trend.traffic,
          picture: trend.thumbnail,
          pictureSource: trend.stories?.[0]?.source
        }))
      } catch (error) {
        console.warn('SerpAPI failed, falling back to RSS feed:', error instanceof Error ? error.message : String(error))
        // Fall through to RSS feed
      }
    }

    // Fallback to RSS feed if SerpAPI not configured or failed
    if (trendingTopics.length === 0) {
      const rssTrends = await trendingService.fetchTrendingFromRSS(geoCode)
      trendingTopics = rssTrends
    }

    return NextResponse.json({
      success: true,
      trendingTopics,
      location,
      geoCode,
      source: serpAPIService.isConfigured() && trendingTopics.length > 0 ? 'SerpAPI' : 'RSS',
      note: serpAPIService.isConfigured() 
        ? 'Using SerpAPI (Free tier: 250 searches/month)' 
        : 'RSS feed refreshes every 2 hours'
    })
  } catch (error) {
    console.error('Error fetching RSS trending topics:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to fetch RSS trending topics', details: message },
      { status: 500 }
    )
  }
}

