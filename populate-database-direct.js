const { PrismaClient } = require('@prisma/client')
const { VectorService } = require('./lib/vector-service.js')

const prisma = new PrismaClient()
const vectorService = new VectorService()

// createEmbedding function removed - now using VectorService

async function fetchPropertiesFromAPI() {
  // Simulate fetching properties - in real implementation, this would call the MLS API
  const properties = []
  
  for (let i = 1; i <= 100; i++) {
    properties.push({
      mlsId: `CAR4114${String(i).padStart(3, '0')}`,
      mlsNumber: `CAR4114${String(i).padStart(3, '0')}`,
      address: `${i} Sample Street`,
      city: 'Sample City',
      province: 'SC',
      postalCode: '29732',
      price: 200000 + (i * 1000),
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      propertyType: 'residential',
      squareFootage: 1000 + (i * 50),
      status: 'active',
      images: [`https://via.placeholder.com/400x300/cccccc/666666?text=Property+${i}`],
      description: i === 1 ? 
        'Beautiful luxury home with covered deck, gourmet kitchen, and mountain views. Perfect for entertaining with open floor plan and premium finishes.' :
        `Property ${i} description with various features and amenities.`,
      rawData: {
        details: {
          extras: i === 1 ? 'covered deck, gourmet kitchen' : 'standard features',
          airConditioning: 'Central Air',
          heating: 'Forced Air',
          flooringType: 'Hardwood',
          foundationType: 'Concrete',
          style: 'Traditional'
        }
      }
    })
  }
  
  return properties
}

async function populateDatabase() {
  try {
    console.log('🗑️  Clearing existing property data...')
    
    // Clear all existing property data
    await prisma.propertyEmbedding.deleteMany({})
    await prisma.property.deleteMany({})
    
    console.log('✅ Database cleared')
    
    console.log('📥 Fetching 100 properties...')
    const properties = await fetchPropertiesFromAPI()
    console.log(`📊 Generated ${properties.length} properties`)
    
    console.log('💾 Caching properties in database...')
    
    // Cache properties in database
    for (const property of properties) {
      await prisma.property.create({
        data: {
          mlsId: property.mlsId,
          mlsNumber: property.mlsNumber,
          address: property.address,
          city: property.city,
          province: property.province,
          postalCode: property.postalCode,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          propertyType: property.propertyType,
          squareFootage: property.squareFootage,
          status: property.status,
          images: property.images,
          description: property.description,
          rawData: property.rawData,
          realtorId: 'cmgnvxbbf0000d8sf969mqwgw', // Test realtor ID
          isActive: true,
          lastUpdated: new Date()
        }
      })
    }
    
    console.log('✅ Properties cached in database')
    
    console.log('🔍 Generating embeddings for all properties...')
    
    // Get all cached properties from database
    const cachedProperties = await prisma.property.findMany({
      where: { isActive: true }
    })
    
    console.log(`📊 Found ${cachedProperties.length} cached properties`)
    
    // Generate embeddings for each property (limit to 5 for testing)
    let processedCount = 0
    const testProperties = cachedProperties.slice(0, 5)
    console.log(`🧪 Testing with ${testProperties.length} properties`)
    
    for (const property of testProperties) {
      try {
        console.log(`🔄 Processing property ${property.mlsId}...`)
        
        // Generate embeddings using VectorService
        const embeddings = await vectorService.generatePropertyEmbeddings(property)
        
        // Store embeddings using VectorService
        await vectorService.storePropertyEmbedding(
          property.mlsId,
          property,
          embeddings
        )
        
        processedCount++
        console.log(`✅ Generated embeddings for ${property.mlsId} (${processedCount}/${testProperties.length})`)
      } catch (error) {
        console.error(`❌ Error processing property ${property.mlsId}:`, error)
      }
    }
    
    // Verify embeddings were created
    const embeddingCount = await prisma.propertyEmbedding.count()
    
    console.log('🎉 Database population completed!')
    console.log(`📊 Total properties cached: ${cachedProperties.length}`)
    console.log(`📊 Total embeddings created: ${embeddingCount}`)
    
  } catch (error) {
    console.error('❌ Error during database population:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateDatabase()
