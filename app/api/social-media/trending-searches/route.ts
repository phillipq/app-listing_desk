import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TrendingSearchService } from '@/lib/trending-search-service'

// GET - Fetch trending searches for custom search terms
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

    // Get active custom search terms
    const customTerms = await prisma.customSearchTerm.findMany({
      where: {
        realtorId: realtor.id,
        isActive: true
      }
    })

    if (customTerms.length === 0) {
      return NextResponse.json({
        success: true,
        trendingSearches: [],
        message: 'No custom search terms configured. Add search terms to see trending data.'
      })
    }

    // Get or fetch trending data
    const keywords = customTerms.map(term => term.keyword)
    const location = customTerms[0]?.location || await getRealtorLocation(realtor.id)

    // Fetch fresh trending data
    const trendingService = new TrendingSearchService()
    const trends = await trendingService.fetchTrendingSearches(
      keywords,
      location || 'Unknown',
      realtor.id
    )

    // Also fetch stored trending searches
    const storedTrends = await prisma.trendingSearch.findMany({
      where: {
        realtorId: realtor.id,
        keyword: {
          in: keywords
        }
      },
      orderBy: {
        lastUpdated: 'desc'
      }
    })

    // Merge fresh and stored data (prefer fresh if available)
    const allTrends = trends.map(fresh => {
      const stored = storedTrends.find(s => s.keyword === fresh.keyword)
      return stored ? {
        ...fresh,
        id: stored.id,
        lastUpdated: stored.lastUpdated
      } : fresh
    })

    return NextResponse.json({
      success: true,
      trendingSearches: allTrends,
      location
    })
  } catch (error) {
    console.error('Error fetching trending searches:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending searches', details: message },
      { status: 500 }
    )
  }
}

// POST - Manually refresh trending data
export async function POST(_request: NextRequest) {
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

    // Refresh trending data
    const trendingService = new TrendingSearchService()
    await trendingService.refreshTrendingData(realtor.id)

    return NextResponse.json({
      success: true,
      message: 'Trending data refreshed successfully'
    })
  } catch (error) {
    console.error('Error refreshing trending searches:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to refresh trending searches', details: message },
      { status: 500 }
    )
  }
}

async function getRealtorLocation(realtorId: string): Promise<string | null> {
  const property = await prisma.property.findFirst({
    where: { realtorId },
    select: { city: true, province: true }
  })

  if (property) {
    return `${property.city}, ${property.province}`
  }

  return null
}

