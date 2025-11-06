const { PrismaClient } = require('@prisma/client')
const { mlsService } = require('./lib/mls.js')
const { propertyCacheService } = require('./lib/property-cache.js')
const { vectorSearchService } = require('./lib/vector-search.js')

const prisma = new PrismaClient()

async function clearAndPopulateDatabase() {
  try {
    console.log('🗑️  Clearing existing property data...')
    
    // Clear all existing property data
    await prisma.propertyEmbedding.deleteMany({})
    await prisma.property.deleteMany({})
    
    console.log('✅ Database cleared')
    
    console.log('📥 Fetching all 100 properties from API...')
    
    // Fetch all properties from the API (this will get 100 properties)
    const allProperties = await mlsService.fetchProperties({
      limit: 100
    })
    
    console.log(`📊 Fetched ${allProperties.length} properties from API`)
    
    // Cache all properties with embeddings
    console.log('💾 Caching properties with embeddings...')
    await propertyCacheService.cacheProperties(allProperties)
    
    console.log('🔍 Generating embeddings for all properties...')
    
    // Get all cached properties from database
    const cachedProperties = await prisma.property.findMany({
      where: { isActive: true }
    })
    
    console.log(`📊 Found ${cachedProperties.length} cached properties`)
    
    // Generate embeddings for each property
    for (const property of cachedProperties) {
      try {
        console.log(`🔄 Processing property ${property.mlsId}...`)
        
        // Generate embeddings for the property
        const embedding = await vectorSearchService.generateEmbeddings({
          mlsId: property.mlsId,
          description: property.description,
          address: property.address,
          city: property.city,
          province: property.province,
          propertyType: property.propertyType,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          squareFootage: property.squareFootage,
          price: property.price,
          rawData: property.rawData
        })
        
        // Store the embedding
        await vectorSearchService.storePropertyEmbedding(embedding)
        
        console.log(`✅ Generated embeddings for ${property.mlsId}`)
      } catch (error) {
        console.error(`❌ Error processing property ${property.mlsId}:`, error)
      }
    }
    
    console.log('🎉 Database population completed!')
    console.log(`📊 Total properties cached: ${cachedProperties.length}`)
    
    // Verify embeddings were created
    const embeddingCount = await prisma.propertyEmbedding.count()
    console.log(`📊 Total embeddings created: ${embeddingCount}`)
    
  } catch (error) {
    console.error('❌ Error during database population:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearAndPopulateDatabase()
