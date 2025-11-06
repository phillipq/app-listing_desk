import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

class VectorService {
  async createEmbedding(text) {
    if (!text || text.trim().length === 0) {
      return []
    }

    const inputText = text.trim() || 'property listing'
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: inputText
    })
    
    return response.data[0]?.embedding || []
  }

  async generatePropertyEmbeddings(property) {
    try {
      // Create description text - use fallback if empty
      let descriptionText = property.description || ''
      if (!descriptionText || descriptionText.trim().length === 0) {
        descriptionText = `Property at ${property.address || 'unknown address'} with ${property.bedrooms || 0} bedrooms and ${property.bathrooms || 0} bathrooms`
      }
      
      // Create features text
      const featuresText = [
        property.heating || '',
        property.cooling || '',
        property.parking || '',
        property.neighborhood || '',
        ...(property.features || [])
      ].filter(text => text && text.trim().length > 0).join(' ')
      
      // Create combined text for comprehensive embedding
      const combinedText = [
        descriptionText,
        featuresText,
        property.address || '',
        property.city || '',
        property.province || '',
        `${property.bedrooms || 0} bedroom`,
        `${property.bathrooms || 0} bathroom`,
        `${property.squareFootage || 0} square feet`,
        property.propertyType || ''
      ].filter(text => text && text.trim().length > 0).join(' ')

      // Ensure we have meaningful text for embeddings
      const finalDescriptionText = descriptionText.trim() || 'property listing'
      const finalFeaturesText = featuresText.trim() || 'residential property'
      const finalCombinedText = combinedText.trim() || `${property.address || 'property'} ${property.propertyType || 'residential'}`

      console.log(`📊 Generating embeddings for ${property.mlsId}:`)
      console.log(`   Description: "${finalDescriptionText.substring(0, 100)}..."`)
      console.log(`   Features: "${finalFeaturesText.substring(0, 50)}..."`)
      console.log(`   Combined: "${finalCombinedText.substring(0, 100)}..."`)

      // Generate embeddings in parallel
      const [descriptionEmbedding, featuresEmbedding, combinedEmbedding] = await Promise.all([
        this.createEmbedding(finalDescriptionText),
        this.createEmbedding(finalFeaturesText),
        this.createEmbedding(finalCombinedText)
      ])

      // Validate embeddings
      if (descriptionEmbedding.length === 0 || featuresEmbedding.length === 0 || combinedEmbedding.length === 0) {
        throw new Error(`Empty embeddings generated for ${property.mlsId}`)
      }

      return {
        description: descriptionEmbedding,
        features: featuresEmbedding,
        combined: combinedEmbedding
      }
    } catch (error) {
      console.error('Error generating property embeddings:', error)
      throw error
    }
  }

  async storePropertyEmbedding(mlsId, propertyData, embeddings) {
    try {
      const { error } = await supabase
        .from('property_embeddings')
        .upsert({
          mls_id: mlsId,
          property_data: propertyData,
          description_embedding: embeddings.description,
          features_embedding: embeddings.features,
          combined_embedding: embeddings.combined,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Failed to store embedding for ${mlsId}: ${error.message}`)
      }

      console.log(`✅ Stored embeddings for ${mlsId}`)
    } catch (error) {
      console.error(`❌ Error storing embedding for ${mlsId}:`, error)
      throw error
    }
  }

  async searchSimilarProperties(query, threshold = 0.8, limit = 5) {
    try {
      console.log(`🔍 Vector search: "${query}" (threshold: ${threshold}, limit: ${limit})`)
      
      // Generate embedding for the query
      const queryEmbedding = await this.createEmbedding(query)
      
      if (queryEmbedding.length === 0) {
        console.log('❌ No query embedding generated')
        return []
      }

      console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`)

      // Use Supabase RPC function for similarity search
      const { data, error } = await supabase.rpc('match_property_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      })

      if (error) {
        throw new Error(`Vector search failed: ${error.message}`)
      }

      console.log(`📊 Vector search found ${data?.length || 0} properties`)
      
      return data || []
    } catch (error) {
      console.error('❌ Error in vector search:', error)
      throw error
    }
  }
}

module.exports = { VectorService }
