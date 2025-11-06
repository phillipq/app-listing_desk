import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { vectorSearchService } from '@/lib/vector-search'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      query: string
      filters?: {
        location?: string
        minPrice?: number
        maxPrice?: number
        propertyType?: string
        bedrooms?: number
        bathrooms?: number
      }
      limit?: number
    }

    const { query, filters = {}, limit = 10 } = body

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Build filters based on realtor's properties only
    const searchFilters = {
      ...filters,
      realtorId: session.user.id
    }

    // First, get all property IDs for this realtor to filter vector results
    const realtorProperties = await prisma.property.findMany({
      where: {
        realtorId: session.user.id,
        status: 'active'
      },
      select: {
        mlsId: true,
        id: true
      }
    })

    const realtorPropertyIds = new Set<string>(
      realtorProperties
        .map(p => p.mlsId || p.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )

    // Perform vector search
    const results = await vectorSearchService.searchSimilarProperties(
      query,
      searchFilters,
      limit * 2 // Get more results to filter down
    )

    // Filter results to only include properties belonging to this realtor
    const filteredResults = results.filter(r => {
      const propId = r.mlsId || r.id
      return typeof propId === 'string' && propId.length > 0 && realtorPropertyIds.has(propId)
    }).slice(0, limit)

    const propertyIds = filteredResults
      .map(r => r.mlsId || r.id)
      .filter(Boolean) as string[]

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        properties: [],
        query,
        totalMatches: 0
      })
    }

    // Get full property details from database
    const properties = await prisma.property.findMany({
      where: {
        realtorId: session.user.id,
        OR: [
          { mlsId: { in: propertyIds } },
          { id: { in: propertyIds } }
        ],
        status: 'active'
      },
      select: {
        id: true,
        mlsId: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
        description: true,
        squareFootage: true,
        yearBuilt: true,
        images: true,
        status: true,
        latitude: true,
        longitude: true
      }
    })

    // Merge search results with property data and preserve match scores
    const enrichedProperties = filteredResults.map(result => {
      const property = properties.find(p => 
        (p.mlsId && p.mlsId === result.mlsId) || 
        (!p.mlsId && p.id === result.id) ||
        (p.mlsId === result.id) ||
        (p.id === result.mlsId)
      )
      if (!property) return null
      
      return {
        ...property,
        matchScore: typeof result.matchScore === 'number' ? result.matchScore : 0,
        matchPercentage: typeof result.matchPercentage === 'number' ? result.matchPercentage : 0,
        similarityScore: typeof result.similarity_score === 'number' ? result.similarity_score : 0,
        searchQuery: query
      }
    }).filter(Boolean)

    // Sort by match score (highest first)
    enrichedProperties.sort((a, b) => {
      const scoreA = a?.matchPercentage || 0
      const scoreB = b?.matchPercentage || 0
      return scoreB - scoreA
    })

    return NextResponse.json({
      success: true,
      properties: enrichedProperties,
      query,
      totalMatches: enrichedProperties.length
    })

  } catch (error) {
    console.error('Vector search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform vector search' },
      { status: 500 }
    )
  }
}

