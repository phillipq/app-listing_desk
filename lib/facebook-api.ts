interface FacebookGroupPost {
  id: string
  message?: string
  created_time: string
  from?: {
    name: string
    id: string
  }
  attachments?: {
    data: Array<{
      media?: {
        image?: {
          src: string
        }
      }
      subattachments?: {
        data: Array<{
          media?: {
            image?: {
              src: string
            }
          }
        }>
      }
    }>
  }
}

interface FacebookGroup {
  id: string
  name: string
  description?: string
  member_count?: number
}

export class FacebookAPIService {
  private accessToken: string
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * Get posts from a Facebook group
   * Requires: groups_read_groups permission
   */
  async getGroupPosts(groupId: string, limit: number = 25): Promise<FacebookGroupPost[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${groupId}/feed?fields=id,message,created_time,from,attachments{media{image{src}},subattachments{media{image{src}}}}&limit=${limit}&access_token=${this.accessToken}`
      )
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json() as { data?: FacebookGroupPost[] }
      return data.data || []
    } catch (error) {
      console.error('Error fetching Facebook group posts:', error)
      throw error
    }
  }

  /**
   * Get group information
   */
  async getGroupInfo(groupId: string): Promise<FacebookGroup> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${groupId}?fields=id,name,description,member_count&access_token=${this.accessToken}`
      )
      
      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status} ${response.statusText}`)
      }
      
      return await response.json() as FacebookGroup
    } catch (error) {
      console.error('Error fetching Facebook group info:', error)
      throw error
    }
  }

  /**
   * Extract property information from a post
   */
  extractPropertyInfo(post: FacebookGroupPost): {
    title: string
    description: string
    price?: number
    address?: string
    city?: string
    province?: string
    bedrooms?: number
    bathrooms?: number
    propertyType?: string
    images: string[]
  } {
    const message = post.message || ''
    
    // Extract price (look for $ followed by numbers)
    const priceMatch = message.match(/\$[\d,]+/g)
    const price = priceMatch ? parseInt(priceMatch[0].replace(/[$,]/g, '')) : undefined
    
    // Extract bedrooms and bathrooms
    const bedroomMatch = message.match(/(\d+)\s*(bed|bedroom)/i)
    const bathroomMatch = message.match(/(\d+(?:\.\d+)?)\s*(bath|bathroom)/i)
    
    const bedrooms = bedroomMatch?.[1] ? parseInt(bedroomMatch[1]) : undefined
    const bathrooms = bathroomMatch?.[1] ? parseFloat(bathroomMatch[1]) : undefined
    
    // Extract address (look for common address patterns)
    const addressMatch = message.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd))/i)
    const address = addressMatch?.[1]?.trim()
    
    // Extract city and province
    const cityProvinceMatch = message.match(/([A-Za-z\s]+),\s*([A-Z]{2})/i)
    const city = cityProvinceMatch?.[1]?.trim()
    const province = cityProvinceMatch?.[2]?.trim()
    
    // Determine property type
    let propertyType = 'residential'
    if (message.toLowerCase().includes('commercial')) propertyType = 'commercial'
    if (message.toLowerCase().includes('condo')) propertyType = 'condo'
    if (message.toLowerCase().includes('house')) propertyType = 'house'
    if (message.toLowerCase().includes('apartment')) propertyType = 'apartment'
    
    // Extract images
    const images: string[] = []
    if (post.attachments?.data) {
      for (const attachment of post.attachments.data) {
        if (attachment.media?.image?.src) {
          images.push(attachment.media.image.src)
        }
        if (attachment.subattachments?.data) {
          for (const subattachment of attachment.subattachments.data) {
            if (subattachment.media?.image?.src) {
              images.push(subattachment.media.image.src)
            }
          }
        }
      }
    }
    
    return {
      title: this.generateTitle(message, address, city),
      description: message,
      price,
      address,
      city,
      province,
      bedrooms,
      bathrooms,
      propertyType,
      images
    }
  }

  private generateTitle(message: string, address?: string, city?: string): string {
    if (address && city) {
      return `${address}, ${city}`
    }
    
    // Extract first line or first sentence as title
    const firstLine = message.split('\n')[0]
    const firstSentence = firstLine?.split('.')[0]
    
    if (!firstSentence) return 'Property Listing'
    
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence
  }

  /**
   * Validate access token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?access_token=${this.accessToken}`
      )
      return response.ok
    } catch (_error) {
      return false
    }
  }
}

export default FacebookAPIService
