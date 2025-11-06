import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { mlsService } from '../../../../lib/mls'
import { prisma } from '../../../../lib/prisma'
import { propertyCacheService } from '../../../../lib/property-cache'
import { vectorSearchService } from '../../../../lib/vector-search'

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('🗑️  Clearing existing property data...')
    
    // Clear all existing property data (embeddings are in Supabase, not Prisma)
    await prisma.$executeRaw`DELETE FROM property_embeddings`
    await prisma.property.deleteMany({})
    
    console.log('✅ Database cleared')
    
    console.log('📥 Fetching all 100 properties from API...')
    
    // Fetch all properties from the API
    const allProperties = await mlsService.fetchProperties({})
    
    // Limit to 100 properties
    const limitedProperties = allProperties.slice(0, 100)
    
    console.log(`📊 Fetched ${limitedProperties.length} properties from API`)
    
    // Cache all properties with embeddings
    console.log('💾 Caching properties with embeddings...')
    const propertiesWithId = limitedProperties.map(prop => ({ ...prop, id: prop.mlsId }))
    await propertyCacheService.cacheProperties(propertiesWithId)
    
    console.log('🔍 Generating embeddings for all properties...')
    
    // Get all cached properties from database
    const cachedProperties = await prisma.property.findMany({
      where: { status: 'active' }
    })
    
    console.log(`📊 Found ${cachedProperties.length} cached properties`)
    
    // Generate embeddings for each property
    let processedCount = 0
    for (const property of cachedProperties) {
      try {
        console.log(`🔄 Processing property ${property.mlsId}...`)
        
        // Generate embeddings for the property
        const embedding = await vectorSearchService.generateEmbeddings({
          mlsId: property.mlsId || property.id,
          description: property.description || undefined,
          address: property.address,
          city: property.city,
          province: property.province,
          propertyType: property.propertyType,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFootage: property.squareFootage || undefined,
          price: property.price,
          rawData: property.rawData || undefined
        })
        
        // Store the embedding
        await vectorSearchService.storePropertyEmbedding(embedding)
        
        processedCount++
        console.log(`✅ Generated embeddings for ${property.mlsId} (${processedCount}/${cachedProperties.length})`)
      } catch (error) {
        console.error(`❌ Error processing property ${property.mlsId}:`, error)
      }
    }
    
    // Verify embeddings were created (using raw SQL since table is in Supabase)
    const embeddingCountResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM property_embeddings
    `
    const embeddingCount = Number(embeddingCountResult[0]?.count || 0)
    
    console.log('🎉 Database population completed!')
    console.log(`📊 Total properties cached: ${cachedProperties.length}`)
    console.log(`📊 Total embeddings created: ${embeddingCount}`)
    
    return NextResponse.json({
      success: true,
      message: 'Database populated successfully',
      stats: {
        propertiesCached: cachedProperties.length,
        embeddingsCreated: embeddingCount
      }
    })

  } catch (error) {
    console.error('❌ Error during database population:', error)
    return NextResponse.json(
      { error: 'Failed to populate database' },
      { status: 500 }
    )
  }
}
