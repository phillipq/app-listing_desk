import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { VectorService } from './vector-service'

const vectorService = new VectorService()

export interface LeadProfile {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  message?: string | null
  aiSummary?: string | null
  propertyType?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  priceRange?: { min?: number; max?: number } | null
  location?: string | null
  mustHaves?: string[]
  niceToHaves?: string[]
  timeline?: string | null
  motivation?: string | null
  currentSituation?: string | null
}

export interface LeadEmbedding {
  leadId: string
  leadProfile: LeadProfile
  preferencesEmbedding?: number[]
  combinedEmbedding?: number[]
}

export class LeadEmbeddingService {
  /**
   * Generate embeddings for a lead profile
   */
  async generateLeadEmbeddings(leadProfile: LeadProfile): Promise<LeadEmbedding> {
    try {
      // Build comprehensive text from lead profile for embedding
      const preferenceParts: string[] = []
      
      // Basic preferences
      if (leadProfile.propertyType) {
        preferenceParts.push(`Property type: ${leadProfile.propertyType}`)
      }
      if (leadProfile.bedrooms) {
        preferenceParts.push(`${leadProfile.bedrooms} bedrooms`)
      }
      if (leadProfile.bathrooms) {
        preferenceParts.push(`${leadProfile.bathrooms} bathrooms`)
      }
      if (leadProfile.priceRange) {
        const min = leadProfile.priceRange.min ? `$${leadProfile.priceRange.min.toLocaleString()}` : 'any'
        const max = leadProfile.priceRange.max ? `$${leadProfile.priceRange.max.toLocaleString()}` : 'any'
        preferenceParts.push(`Price range: ${min} - ${max}`)
      }
      if (leadProfile.location) {
        preferenceParts.push(`Location: ${leadProfile.location}`)
      }

      // Must-haves and nice-to-haves
      if (leadProfile.mustHaves && leadProfile.mustHaves.length > 0) {
        preferenceParts.push(`Must have: ${leadProfile.mustHaves.join(', ')}`)
      }
      if (leadProfile.niceToHaves && leadProfile.niceToHaves.length > 0) {
        preferenceParts.push(`Nice to have: ${leadProfile.niceToHaves.join(', ')}`)
      }

      // Timeline and motivation
      if (leadProfile.timeline) {
        preferenceParts.push(`Timeline: ${leadProfile.timeline}`)
      }
      if (leadProfile.motivation) {
        preferenceParts.push(`Motivation: ${leadProfile.motivation}`)
      }
      if (leadProfile.currentSituation) {
        preferenceParts.push(`Current situation: ${leadProfile.currentSituation}`)
      }

      const preferencesText = preferenceParts.join('. ').trim()

      // Combined text includes message and AI summary
      const combinedParts: string[] = []
      if (preferencesText) combinedParts.push(preferencesText)
      if (leadProfile.message) combinedParts.push(`Message: ${leadProfile.message}`)
      if (leadProfile.aiSummary) combinedParts.push(`Summary: ${leadProfile.aiSummary}`)
      
      const combinedText = combinedParts.join('. ').trim() || 'real estate lead'

      // Generate embeddings
      const [preferencesEmbedding, combinedEmbedding] = await Promise.all([
        preferencesText ? vectorService.createEmbedding(preferencesText) : Promise.resolve([]),
        combinedText ? vectorService.createEmbedding(combinedText) : Promise.resolve([])
      ])

      return {
        leadId: leadProfile.id,
        leadProfile,
        preferencesEmbedding: preferencesEmbedding.length > 0 ? preferencesEmbedding : undefined,
        combinedEmbedding: combinedEmbedding.length > 0 ? combinedEmbedding : undefined
      }
    } catch (error) {
      console.error('Error generating lead embeddings:', error)
      throw error
    }
  }

  /**
   * Store lead embedding in database
   * Note: Lead model doesn't have a rawData field, so we store embeddings in the messages JSON field
   * TODO: Create a dedicated LeadEmbedding table in Supabase (similar to PropertyEmbedding) for proper vector storage
   */
  async storeLeadEmbedding(embedding: LeadEmbedding): Promise<void> {
    try {
      // Get current messages to preserve existing data
      const lead = await prisma.lead.findUnique({
        where: { id: embedding.leadId },
        select: { messages: true }
      })
      
      const currentMessages = (lead?.messages as Record<string, unknown>) || {}
      
      // Store embeddings in messages field (temporary solution until LeadEmbedding table is created)
      await prisma.lead.update({
        where: { id: embedding.leadId },
        data: {
          messages: {
            ...currentMessages,
            embeddings: {
              preferencesEmbedding: embedding.preferencesEmbedding,
              combinedEmbedding: embedding.combinedEmbedding,
              updatedAt: new Date().toISOString()
            }
          } as Prisma.InputJsonValue
        }
      })

      console.log(`✅ Stored embeddings for lead ${embedding.leadId}`)
    } catch (error) {
      console.error(`Error storing lead embedding for ${embedding.leadId}:`, error)
      throw error
    }
  }

  /**
   * Generate and store embeddings for a lead
   */
  async generateAndStoreLeadEmbeddings(leadProfile: LeadProfile): Promise<void> {
    try {
      const embedding = await this.generateLeadEmbeddings(leadProfile)
      await this.storeLeadEmbedding(embedding)
    } catch (error) {
      console.error('Error in generateAndStoreLeadEmbeddings:', error)
      throw error
    }
  }

  /**
   * Generate embeddings for a lead from database record
   */
  async generateEmbeddingsForLead(leadId: string): Promise<void> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })

      if (!lead) {
        throw new Error(`Lead ${leadId} not found`)
      }

      // Build lead profile from database record
      const leadProfile: LeadProfile = {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        aiSummary: lead.aiSummary
      }

      // Try to extract additional preferences from messages if available
      if (lead.messages && typeof lead.messages === 'object') {
        const _messages = lead.messages as Record<string, unknown>
        // Extract preferences from messages if structured
        // TODO: Parse messages to extract preferences
      }

      await this.generateAndStoreLeadEmbeddings(leadProfile)
    } catch (error) {
      console.error(`Error generating embeddings for lead ${leadId}:`, error)
      throw error
    }
  }
}

export const leadEmbeddingService = new LeadEmbeddingService()

