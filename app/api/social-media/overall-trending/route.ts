import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TrendingSearchService } from '@/lib/trending-search-service'

// GET - Fetch overall trending searches (general real estate keywords)
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

    // Default real estate trending keywords
    const defaultKeywords = [
      'real estate',
      'homes for sale',
      'houses for sale',
      'property listings'
    ]

    // Fetch trending data for these keywords
    // Force location to Canada for overall trending as requested
    const trendingService = new TrendingSearchService()
    const trends = await trendingService.fetchTrendingSearches(
      defaultKeywords,
      location.includes('Canada') || !property ? 'Canada' : location,
      realtor.id
    )

    return NextResponse.json({
      success: true,
      trendingSearches: trends,
      location
    })
  } catch (error) {
    console.error('Error fetching overall trending searches:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overall trending searches', details: message },
      { status: 500 }
    )
  }
}

// POST - Refresh overall trending data
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get realtor
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id }
    })

    if (!realtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // Get location
    const property = await prisma.property.findFirst({
      where: { realtorId: realtor.id },
      select: { city: true, province: true }
    })

    const location = property 
      ? `${property.city}, ${property.province}`
      : 'Canada'

    // Fetch fresh data
    // Force location to Canada for overall trending as requested
    const defaultKeywords = [
      'real estate',
      'homes for sale',
      'houses for sale',
      'property listings'
    ]

    const trendingService = new TrendingSearchService()
    await trendingService.fetchTrendingSearches(
      defaultKeywords,
      location.includes('Canada') || !property ? 'Canada' : location,
      realtor.id
    )

    return NextResponse.json({
      success: true,
      message: 'Overall trending data refreshed successfully'
    })
  } catch (error) {
    console.error('Error refreshing overall trending searches:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to refresh overall trending searches', details: message },
      { status: 500 }
    )
  }
}

