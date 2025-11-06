import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { MLSProperty, mlsService } from '../../../../lib/mls'
import { mlsFreshnessService as _mlsFreshnessService } from '../../../../lib/mls-freshness'
import { prisma as _prisma } from '../../../../lib/prisma'
import { propertyCacheService, PropertyData } from '../../../../lib/property-cache'
import { vectorSearchService } from '../../../../lib/vector-search'

interface LeadCriteria {
  location?: string
  priceRange?: { min?: number; max?: number }
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
  mustHaves?: string[]
  niceToHaves?: string[]
  sessionId?: string
}

interface PropertyWithScore extends PropertyData {
  matchScore: number
  matchPercentage: number
  smartMatchDetails: {
    mustHaveMatches: string[]
    niceToHaveMatches: string[]
  }
}

// Traditional search function
async function performTraditionalSearch(properties: PropertyData[], leadCriteria: LeadCriteria): Promise<PropertyWithScore[]> {
  return properties.map(property => {
    let score = 0
    let maxScore = 0

    // Location match (30 points)
    maxScore += 30
    if (leadCriteria.location) {
      const locationLower = leadCriteria.location.toLowerCase()
      const city = typeof property.city === 'string' ? property.city.toLowerCase() : ''
      const neighborhood = typeof property.neighborhood === 'string' ? property.neighborhood.toLowerCase() : ''
      const locationMatch = city.includes(locationLower) || neighborhood.includes(locationLower)
      if (locationMatch) score += 30
    } else {
      score += 15 // Partial points if no location specified
    }

    // Price match (25 points)
    maxScore += 25
    const price = typeof property.price === 'number' ? property.price : 0
    if (leadCriteria.priceRange?.min !== undefined && leadCriteria.priceRange?.max !== undefined) {
      if (price >= leadCriteria.priceRange.min && price <= leadCriteria.priceRange.max) {
        score += 25
      } else if (price < leadCriteria.priceRange.min) {
        score += 10 // Partial points for properties under budget
      }
    } else if (leadCriteria.priceRange?.max !== undefined) {
      if (price <= leadCriteria.priceRange.max) {
        score += 20
      }
    } else if (leadCriteria.priceRange?.min !== undefined) {
      if (price >= leadCriteria.priceRange.min) {
        score += 20
      }
    } else {
      score += 12 // Partial points if no price specified
    }

    // Property type match (20 points)
    maxScore += 20
    const propertyType = typeof property.propertyType === 'string' ? property.propertyType : ''
    if (leadCriteria.propertyType && propertyType === leadCriteria.propertyType) {
      score += 20
    } else if (!leadCriteria.propertyType) {
      score += 10 // Partial points if no type specified
    }

    // Bedroom match (15 points)
    maxScore += 15
    const bedrooms = typeof property.bedrooms === 'number' ? property.bedrooms : 0
    if (leadCriteria.bedrooms !== undefined) {
      if (bedrooms >= leadCriteria.bedrooms) {
        score += 15
      } else if (bedrooms >= leadCriteria.bedrooms - 1) {
        score += 10 // Partial points for close match
      }
    } else {
      score += 7 // Partial points if no bedroom requirement
    }

    // Bathroom match (10 points)
    maxScore += 10
    const bathrooms = typeof property.bathrooms === 'number' ? property.bathrooms : 0
    if (leadCriteria.bathrooms !== undefined) {
      if (bathrooms >= leadCriteria.bathrooms) {
        score += 10
      } else if (bathrooms >= leadCriteria.bathrooms - 0.5) {
        score += 7 // Partial points for close match
      }
    } else {
      score += 5 // Partial points if no bathroom requirement
    }

    // Smart matching based on must-haves and nice-to-haves (30 points)
    maxScore += 30
    let smartMatchScore = 0
    
    if (leadCriteria.mustHaves && leadCriteria.mustHaves.length > 0) {
      const mustHaves = leadCriteria.mustHaves.map(item => item.toLowerCase())
      const description = typeof property.description === 'string' ? property.description : ''
      const features = Array.isArray(property.features) ? property.features.join(' ') : ''
      const amenities = Array.isArray(property.amenities) ? property.amenities.join(' ') : ''
      const parking = typeof property.parking === 'string' ? property.parking : ''
      const heating = typeof property.heating === 'string' ? property.heating : ''
      const cooling = typeof property.cooling === 'string' ? property.cooling : ''
      const neighborhood = typeof property.neighborhood === 'string' ? property.neighborhood : ''
      const propertyText = `${description} ${features} ${amenities} ${parking} ${heating} ${cooling} ${neighborhood}`.toLowerCase()
      
      // Check for must-haves in property description
      const mustHaveMatches = mustHaves.filter(mustHave => 
        propertyText.includes(mustHave.toLowerCase())
      ).length
      
      // Must-haves are worth 20 points (high priority)
      smartMatchScore += (mustHaveMatches / mustHaves.length) * 20
    }
    
    if (leadCriteria.niceToHaves && leadCriteria.niceToHaves.length > 0) {
      const niceToHaves = leadCriteria.niceToHaves.map(item => item.toLowerCase())
      const description = typeof property.description === 'string' ? property.description : ''
      const features = Array.isArray(property.features) ? property.features.join(' ') : ''
      const amenities = Array.isArray(property.amenities) ? property.amenities.join(' ') : ''
      const parking = typeof property.parking === 'string' ? property.parking : ''
      const heating = typeof property.heating === 'string' ? property.heating : ''
      const cooling = typeof property.cooling === 'string' ? property.cooling : ''
      const neighborhood = typeof property.neighborhood === 'string' ? property.neighborhood : ''
      const propertyText = `${description} ${features} ${amenities} ${parking} ${heating} ${cooling} ${neighborhood}`.toLowerCase()
      
      // Check for nice-to-haves in property description
      const niceToHaveMatches = niceToHaves.filter(niceToHave => 
        propertyText.includes(niceToHave.toLowerCase())
      ).length
      
      // Nice-to-haves are worth 10 points (lower priority)
      smartMatchScore += (niceToHaveMatches / niceToHaves.length) * 10
    }
    
    score += smartMatchScore

    // Calculate percentage match
    const matchPercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

    // Build smart match details
    const description = typeof property.description === 'string' ? property.description : ''
    const features = Array.isArray(property.features) ? property.features.join(' ') : ''
    const amenities = Array.isArray(property.amenities) ? property.amenities.join(' ') : ''
    const parking = typeof property.parking === 'string' ? property.parking : ''
    const heating = typeof property.heating === 'string' ? property.heating : ''
    const cooling = typeof property.cooling === 'string' ? property.cooling : ''
    const neighborhood = typeof property.neighborhood === 'string' ? property.neighborhood : ''
    const searchText = `${description} ${features} ${amenities} ${parking} ${heating} ${cooling} ${neighborhood}`.toLowerCase()

    return {
      ...property,
      matchScore: score,
      matchPercentage,
      smartMatchDetails: {
        mustHaveMatches: leadCriteria.mustHaves ? 
          leadCriteria.mustHaves.filter(item => searchText.includes(item.toLowerCase())) : [],
        niceToHaveMatches: leadCriteria.niceToHaves ? 
          leadCriteria.niceToHaves.filter(item => searchText.includes(item.toLowerCase())) : []
      }
    } as PropertyWithScore
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as { leadCriteria?: LeadCriteria }
    const { leadCriteria } = body

    if (!leadCriteria) {
      return NextResponse.json(
        { error: 'Lead criteria is required' },
        { status: 400 }
      )
    }

    // Build search criteria for Repliers API
    console.log('📋 Lead criteria:', leadCriteria)

    // Search for properties using the property cache service (with embeddings)
    console.log('🔍 Fetching properties with caching and embeddings...')
    
    // Use property cache service to get properties with embeddings
    let properties = await propertyCacheService.getProperties({
      city: leadCriteria.location,
      province: leadCriteria.location,
      location: leadCriteria.location,
      minPrice: leadCriteria.priceRange?.min,
      maxPrice: leadCriteria.priceRange?.max,
      bedrooms: leadCriteria.bedrooms,
      bathrooms: leadCriteria.bathrooms,
      propertyType: leadCriteria.propertyType
    }, {
      searchProperties: async (filters) => {
        const results = await mlsService.searchProperties({
          location: filters.location,
          priceRange: filters.minPrice !== undefined && filters.maxPrice !== undefined ? {
            min: filters.minPrice,
            max: filters.maxPrice
          } : filters.minPrice !== undefined ? {
            min: filters.minPrice,
            max: filters.minPrice * 2 // Provide a reasonable max
          } : filters.maxPrice !== undefined ? {
            min: 0,
            max: filters.maxPrice
          } : undefined,
          bedrooms: filters.bedrooms,
          bathrooms: filters.bathrooms,
          propertyType: filters.propertyType
        })
        // Convert MLSProperty[] to PropertyData[]
        return results.map(p => ({
          id: p.id || p.mlsId,
          mlsId: p.mlsId,
          address: p.address,
          city: p.city,
          province: p.province,
          price: p.price,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          propertyType: p.propertyType,
          squareFootage: p.squareFootage,
          images: p.images || [],
          description: p.description,
          rawData: p as unknown as Record<string, unknown>
        }))
      }
    })
    
    console.log(`📊 Found ${properties.length} properties with exact criteria`)
    
    // If no exact matches, try with relaxed criteria
    if (properties.length === 0) {
      console.log('🔍 No exact matches, trying relaxed criteria...')
      
      // Try without price filter first
      properties = await propertyCacheService.getProperties({
        city: leadCriteria.location,
        province: leadCriteria.location,
        location: leadCriteria.location,
        bedrooms: leadCriteria.bedrooms,
        bathrooms: leadCriteria.bathrooms,
        propertyType: leadCriteria.propertyType
      }, {
        searchProperties: async (filters) => {
          const results = await mlsService.searchProperties({
            location: filters.location,
            bedrooms: filters.bedrooms,
            bathrooms: filters.bathrooms,
            propertyType: filters.propertyType
          })
          return results.map(p => ({
            id: p.id || p.mlsId,
            mlsId: p.mlsId,
            address: p.address,
            city: p.city,
            province: p.province,
            price: p.price,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            propertyType: p.propertyType,
            squareFootage: p.squareFootage,
            images: p.images || [],
            description: p.description,
            rawData: p as unknown as Record<string, unknown>
          }))
        }
      })
      
      console.log(`📊 Found ${properties.length} properties without price filter`)
      
      // If still no matches, try with just city and property type
      if (properties.length === 0) {
        console.log('🔍 Still no matches, trying with just city and property type...')
        properties = await propertyCacheService.getProperties({
          city: leadCriteria.location,
          province: leadCriteria.location,
          location: leadCriteria.location,
          propertyType: leadCriteria.propertyType
        }, {
          searchProperties: async (filters) => {
            const results = await mlsService.searchProperties({
              location: filters.location,
              propertyType: filters.propertyType
            })
            return results.map(p => ({
              id: p.id || p.mlsId,
              mlsId: p.mlsId,
              address: p.address,
              city: p.city,
              province: p.province,
              price: p.price,
              bedrooms: p.bedrooms,
              bathrooms: p.bathrooms,
              propertyType: p.propertyType,
              squareFootage: p.squareFootage,
              images: p.images || [],
              description: p.description,
              rawData: p as unknown as Record<string, unknown>
            }))
          }
        })
        
        console.log(`📊 Found ${properties.length} properties with just city and type`)
      }
    }
    
    console.log(`📊 Final result: ${properties.length} properties`)

    // Smart pre-filtering: Filter by basic criteria first, then apply text search
    console.log(`📊 Pre-filtering ${properties.length} properties...`)
    
    // Step 1: Basic filtering (fast) - Use same flexible logic as client-side filtering
    const preFilteredProperties = properties.filter(property => {
      // Location filter (flexible)
      if (leadCriteria.location) {
        const locationFilter = leadCriteria.location.toLowerCase()
        const city = typeof property.city === 'string' ? property.city.toLowerCase() : ''
        const neighborhood = typeof property.neighborhood === 'string' ? property.neighborhood.toLowerCase() : ''
        const address = typeof property.address === 'string' ? property.address.toLowerCase() : ''
        
        const locationMatch = city.includes(locationFilter) || 
                             neighborhood.includes(locationFilter) || 
                             address.includes(locationFilter)
        if (!locationMatch) return false
      }
      
      // Price filter
      const price = typeof property.price === 'number' ? property.price : 0
      if (leadCriteria.priceRange?.min !== undefined && price < leadCriteria.priceRange.min) return false
      if (leadCriteria.priceRange?.max !== undefined && price > leadCriteria.priceRange.max) return false
      
      // Property type filter (flexible matching)
      if (leadCriteria.propertyType) {
        const targetType = leadCriteria.propertyType.toLowerCase()
        const type = typeof property.propertyType === 'string' ? property.propertyType.toLowerCase() : ''
        const description = typeof property.description === 'string' ? property.description.toLowerCase() : ''
        
        const typeMatches = 
          type.includes(targetType) ||
          type.includes('single_family') ||
          type.includes('residential') ||
          type.includes('detached') ||
          (targetType === 'house' && (type.includes('home') || type.includes('residence')))
        
        const descriptionMatches = 
          description.includes(targetType) ||
          (targetType === 'house' && description.includes('single family'))
        
        if (!(typeMatches || descriptionMatches)) return false
      }
      
      return true
    })
    
    console.log(`📊 Pre-filtered to ${preFilteredProperties.length} properties`)
    
    // Step 2: Try vector search first (if we have must-haves/nice-to-haves)
    let propertiesWithScores: PropertyWithScore[] = []
    
    if (leadCriteria.mustHaves && leadCriteria.mustHaves.length > 0 || leadCriteria.niceToHaves && leadCriteria.niceToHaves.length > 0) {
      console.log('🔍 Using vector search for semantic matching...')
      try {
        const vectorResults = await vectorSearchService.searchByRequirements(
          leadCriteria.mustHaves || [],
          leadCriteria.niceToHaves || [],
          {
            location: leadCriteria.location,
            priceRange: leadCriteria.priceRange,
            propertyType: leadCriteria.propertyType,
            bedrooms: leadCriteria.bedrooms,
            bathrooms: leadCriteria.bathrooms
          },
          15
        )
        
        if (vectorResults.length > 0) {
          console.log(`📊 Vector search found ${vectorResults.length} properties`)
          // Convert vector results to PropertyWithScore format
          propertiesWithScores = vectorResults.map(p => {
            const pRecord = p as Record<string, unknown>
            const smartMatchDetails = pRecord.smartMatchDetails && typeof pRecord.smartMatchDetails === 'object' 
              ? pRecord.smartMatchDetails as Record<string, unknown>
              : null
            
            const mustHaveMatches = smartMatchDetails && Array.isArray(smartMatchDetails.mustHaveMatches)
              ? smartMatchDetails.mustHaveMatches.filter((m): m is string => typeof m === 'string')
              : Array.isArray(pRecord.mustHaveMatches)
                ? pRecord.mustHaveMatches.filter((m): m is string => typeof m === 'string')
                : []
            
            const niceToHaveMatches = smartMatchDetails && Array.isArray(smartMatchDetails.niceToHaveMatches)
              ? smartMatchDetails.niceToHaveMatches.filter((m): m is string => typeof m === 'string')
              : Array.isArray(pRecord.niceToHaveMatches)
                ? pRecord.niceToHaveMatches.filter((m): m is string => typeof m === 'string')
                : []
            
            return {
              ...p,
              matchScore: typeof p.matchScore === 'number' ? p.matchScore : 0,
              matchPercentage: typeof p.matchPercentage === 'number' ? p.matchPercentage : 0,
              smartMatchDetails: {
                mustHaveMatches,
                niceToHaveMatches
              }
            }
          }) as PropertyWithScore[]
        } else {
          console.log('📊 Vector search returned no results, falling back to traditional search')
          propertiesWithScores = await performTraditionalSearch(preFilteredProperties, leadCriteria)
        }
      } catch (error) {
        console.error('Vector search error, falling back to traditional search:', error)
        propertiesWithScores = await performTraditionalSearch(preFilteredProperties, leadCriteria)
      }
    } else {
      console.log('📊 No requirements specified, using traditional search')
      propertiesWithScores = await performTraditionalSearch(preFilteredProperties, leadCriteria)
    }

    // Sort by match score (highest first)
    propertiesWithScores.sort((a, b) => b.matchScore - a.matchScore)
    
    // Step 3: Limit to top 15 results for display
    const limitedResults = propertiesWithScores.slice(0, 5)
    console.log(`📊 Limited to top ${limitedResults.length} results for display`)

    // Enhance with proximity data if sessionId is provided
    let enhancedProperties: PropertyWithScore[] = limitedResults
    if (leadCriteria.sessionId) {
      try {
        console.log('🔍 Attempting proximity enhancement for session:', leadCriteria.sessionId)
        // Convert PropertyWithScore[] to MLSProperty[] for enhancement
        const mlsProperties: MLSProperty[] = limitedResults.map(p => ({
          id: p.id,
          mlsId: p.mlsId,
          address: typeof p.address === 'string' ? p.address : '',
          city: typeof p.city === 'string' ? p.city : '',
          province: typeof p.province === 'string' ? p.province : '',
          postalCode: typeof p.postalCode === 'string' ? p.postalCode : '',
          price: typeof p.price === 'number' ? p.price : 0,
          bedrooms: typeof p.bedrooms === 'number' ? p.bedrooms : 0,
          bathrooms: typeof p.bathrooms === 'number' ? p.bathrooms : 0,
          propertyType: typeof p.propertyType === 'string' ? p.propertyType : '',
          squareFootage: typeof p.squareFootage === 'number' ? p.squareFootage : undefined,
          features: Array.isArray(p.features) ? p.features.filter((f): f is string => typeof f === 'string') : [],
          amenities: Array.isArray(p.amenities) ? p.amenities.filter((a): a is string => typeof a === 'string') : [],
          images: Array.isArray(p.images) ? p.images.filter((img): img is string => typeof img === 'string') : [],
          description: typeof p.description === 'string' ? p.description : undefined,
          status: (typeof p.status === 'string' ? (p.status as 'active' | 'sold' | 'pending' | 'withdrawn') : 'active')
        }))
        const enhanced = await mlsService.enhanceWithProximityData(
          mlsProperties, 
          leadCriteria.sessionId
        )
        // Convert back to PropertyWithScore format, preserving match scores
        enhancedProperties = enhanced.map((p, index) => {
          const original = limitedResults[index]
          return {
            ...p,
            id: p.id || p.mlsId,
            matchScore: original?.matchScore || 0,
            matchPercentage: original?.matchPercentage || 0,
            smartMatchDetails: original?.smartMatchDetails || {
              mustHaveMatches: [],
              niceToHaveMatches: []
            }
          } as PropertyWithScore
        })
        console.log(`✅ Proximity enhancement completed: ${enhancedProperties.length} properties`)
      } catch (error) {
        console.error('Error enhancing with proximity data:', error)
        // Continue with original properties if proximity enhancement fails
      }
    }

    // Determine the appropriate message based on search method
    let searchNote = null
    
    // Check if we used vector search and found results
    const usedVectorSearch = (leadCriteria.mustHaves && leadCriteria.mustHaves.length > 0) || (leadCriteria.niceToHaves && leadCriteria.niceToHaves.length > 0)
    const hasVectorResults = usedVectorSearch && enhancedProperties.length > 0
    
    if (hasVectorResults) {
      searchNote = `Found ${enhancedProperties.length} properties matching your requirements using semantic search.`
    } else if (enhancedProperties.length > 0) {
      // Check if we used relaxed criteria
      const usedRelaxedCriteria = (
        !leadCriteria.priceRange?.max || 
        enhancedProperties.some(p => {
          const price = typeof p.price === 'number' ? p.price : 0
          return price > (leadCriteria.priceRange?.max || 0)
        })
      )
      
      if (usedRelaxedCriteria) {
        searchNote = "No exact matches found. Showing similar properties in the area."
      }
    }
    
    return NextResponse.json({
      success: true,
      properties: enhancedProperties,
      criteria: leadCriteria,
      totalMatches: enhancedProperties.length,
      note: searchNote
    })

  } catch (error) {
    console.error('MLS search error:', error)
    return NextResponse.json(
      { error: 'Failed to search MLS properties' },
      { status: 500 }
    )
  }
}
