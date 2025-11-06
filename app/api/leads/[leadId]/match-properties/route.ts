import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { vectorSearchService } from '@/lib/vector-search'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { leadId } = await params

    // Get lead details
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        realtorId: session.user.id
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Get lead profile from session if available
    // For now, we'll extract preferences from the lead's message and AI summary
    const leadProfile = {
      message: lead.message || '',
      aiSummary: lead.aiSummary || '',
      name: lead.name,
      email: lead.email,
      phone: lead.phone
    }

    // Build search query from lead profile
    const searchQueryParts: string[] = []
    
    if (leadProfile.aiSummary) {
      searchQueryParts.push(leadProfile.aiSummary)
    }
    
    if (leadProfile.message) {
      searchQueryParts.push(leadProfile.message)
    }

    // Extract preferences from AI summary if available
    const summary = leadProfile.aiSummary || leadProfile.message || ''
    const bedroomsMatch = summary.match(/(\d+)\s*(?:bed|bedroom|bedrooms)/i)
    const bathroomsMatch = summary.match(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom|bathrooms)/i)
    const priceMatch = summary.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g)
    const locationMatch = summary.match(/(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i)

    const searchQuery = searchQueryParts.join(' ').trim() || 'property real estate'

    // Build filters from extracted preferences
    const filters: {
      location?: string
      minPrice?: number
      maxPrice?: number
      bedrooms?: number
      bathrooms?: number
      propertyType?: string
    } = {}

    if (locationMatch && locationMatch[1]) {
      filters.location = locationMatch[1]
    }

    if (priceMatch && priceMatch.length > 0) {
      const prices = priceMatch.map(p => parseFloat(p.replace(/[$,]/g, ''))).filter(p => !isNaN(p))
      if (prices.length > 0) {
        filters.maxPrice = Math.max(...prices)
        filters.minPrice = Math.min(...prices)
      }
    }

    if (bedroomsMatch && bedroomsMatch[1]) {
      filters.bedrooms = parseInt(bedroomsMatch[1], 10)
    }

    if (bathroomsMatch && bathroomsMatch[1]) {
      filters.bathrooms = parseFloat(bathroomsMatch[1])
    }

    // Perform vector search
    const results = await vectorSearchService.searchSimilarProperties(
      searchQuery,
      {
        ...filters,
        realtorId: session.user.id
      },
      10 // Return top 10 matches
    )

    // Get full property details from database
    const propertyIds = results
      .map(r => r.mlsId || r.id)
      .filter(Boolean) as string[]

    if (propertyIds.length === 0) {
      return NextResponse.json({
        success: true,
        properties: [],
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email
        },
        searchQuery,
        totalMatches: 0
      })
    }

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

    // Merge search results with property data
    const matchedProperties = results.map(result => {
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
        matchReason: `Matched based on: ${searchQuery.substring(0, 100)}...`
      }
    }).filter(Boolean)

    // Sort by match score (highest first)
    matchedProperties.sort((a, b) => {
      const scoreA = a?.matchPercentage || 0
      const scoreB = b?.matchPercentage || 0
      return scoreB - scoreA
    })

    return NextResponse.json({
      success: true,
      properties: matchedProperties,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone
      },
      searchQuery,
      totalMatches: matchedProperties.length
    })

  } catch (error) {
    console.error('Lead matching error:', error)
    return NextResponse.json(
      { error: 'Failed to match lead to properties' },
      { status: 500 }
    )
  }
}

