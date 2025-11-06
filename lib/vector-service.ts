import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import type { PropertyData } from './property-cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface PropertyEmbedding {
  mlsId: string
  propertyData: PropertyData
  descriptionEmbedding: number[]
  featuresEmbedding: number[]
  combinedEmbedding: number[]
}

export interface VectorSearchResult {
  mls_id: string
  property_data: PropertyData
  similarity: number
}

export class VectorService {
  /**
   * Create embedding from text using OpenAI
   */
  async createEmbedding(text: string): Promise<number[]> {
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

  /**
   * Generate embeddings for a property (description, features, combined)
   */
  async generatePropertyEmbeddings(property: PropertyData): Promise<{
    description: number[]
    features: number[]
    combined: number[]
  }> {
    try {
      // Create description text
      const descriptionText = property.description || ''
      
      // Create features text
      const featuresText = [
        property.heating || '',
        property.cooling || '',
        property.parking || '',
        property.neighborhood || '',
        ...(Array.isArray(property.features) ? property.features : [])
      ].filter(text => text && typeof text === 'string' && text.trim().length > 0).join(' ')
      
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

      // Generate embeddings in parallel
      const [descriptionEmbedding, featuresEmbedding, combinedEmbedding] = await Promise.all([
        this.createEmbedding(descriptionText),
        this.createEmbedding(featuresText),
        this.createEmbedding(combinedText)
      ])

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

  /**
   * Store property embedding in Supabase
   */
  async storePropertyEmbedding(
    mlsId: string, 
    propertyData: PropertyData, 
    embeddings: {
      description: number[]
      features: number[]
      combined: number[]
    }
  ): Promise<void> {
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

  /**
   * Search for similar properties using vector similarity
   */
  async searchSimilarProperties(
    query: string,
    threshold: number = 0.8,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
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

  /**
   * Get property embedding by MLS ID
   */
  async getPropertyEmbedding(mlsId: string): Promise<PropertyEmbedding | null> {
    try {
      const { data, error } = await supabase.rpc('get_property_embedding', {
        mls_id_param: mlsId
      })

      if (error) {
        throw new Error(`Failed to get embedding for ${mlsId}: ${error.message}`)
      }

      if (!data || data.length === 0) {
        return null
      }

      const result = data[0]
      return {
        mlsId: result.mls_id,
        propertyData: result.property_data,
        descriptionEmbedding: result.description_embedding,
        featuresEmbedding: result.features_embedding,
        combinedEmbedding: result.combined_embedding
      }
    } catch (error) {
      console.error(`❌ Error getting embedding for ${mlsId}:`, error)
      return null
    }
  }

  /**
   * Check if embeddings exist for a property
   */
  async hasEmbeddings(mlsId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('property_embeddings')
        .select('mls_id')
        .eq('mls_id', mlsId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error
      }

      return !!data
    } catch (error) {
      console.error(`❌ Error checking embeddings for ${mlsId}:`, error)
      return false
    }
  }

  /**
   * Delete property embeddings
   */
  async deletePropertyEmbedding(mlsId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('property_embeddings')
        .delete()
        .eq('mls_id', mlsId)

      if (error) {
        throw new Error(`Failed to delete embedding for ${mlsId}: ${error.message}`)
      }

      console.log(`✅ Deleted embeddings for ${mlsId}`)
    } catch (error) {
      console.error(`❌ Error deleting embedding for ${mlsId}:`, error)
      throw error
    }
  }
}
