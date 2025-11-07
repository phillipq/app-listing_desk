import { Prisma } from '@prisma/client'
import googleTrends from 'google-trends-api'
import Parser from 'rss-parser'
import { prisma } from './prisma'
import { SerpAPITrendsService } from './serpapi-trends-service'

// Configure RSS parser to handle Google Trends custom namespaces
const rssParser = new Parser({
  customFields: {
    item: [
      ['ht:approx_traffic', 'traffic', { keepArray: false }],
      ['ht:picture', 'picture', { keepArray: false }],
      ['ht:picture_source', 'pictureSource', { keepArray: false }],
      ['ht:news_item', 'newsItems', { keepArray: true }]
    ]
  }
})

// Initialize SerpAPI service (singleton)
const serpAPIService = new SerpAPITrendsService()

export interface TrendDataPoint {
  date: string
  value: number
}

export interface ProcessedTrend {
  keyword: string
  location: string
  category?: string
  searchVolume?: number
  trendDirection?: 'up' | 'down' | 'stable'
  rank?: number
  trendData?: TrendDataPoint[]
  lastUpdated: Date
}

/**
 * Service for fetching and processing trending search data
 * Currently uses a mock/placeholder approach - in production, integrate with Google Trends API
 */
export class TrendingSearchService {
  /**
   * Fetch trending searches for custom keywords
   */
  async fetchTrendingSearches(
    keywords: string[],
    location: string,
    realtorId: string
  ): Promise<ProcessedTrend[]> {
    const trends: ProcessedTrend[] = []

    for (const keyword of keywords) {
      try {
        // Add delay between requests to avoid rate limiting (Google Trends is sensitive)
        if (trends.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        }
        
        // Fetch or generate trend data for this keyword
        const trendData = await this.getTrendData(keyword, location)
        
        // Store in database (find existing or create new)
        const existing = await prisma.trendingSearch.findFirst({
          where: {
            realtorId,
            keyword,
            location
          }
        })

        const stored = existing
          ? await prisma.trendingSearch.update({
              where: { id: existing.id },
              data: {
                searchVolume: trendData.searchVolume,
                trendDirection: trendData.trendDirection,
                rank: trendData.rank,
                trendData: trendData.trendData ? (trendData.trendData as unknown as Prisma.InputJsonValue) : undefined,
                lastUpdated: new Date()
              }
            })
          : await prisma.trendingSearch.create({
              data: {
                keyword,
                location,
                category: this.categorizeKeyword(keyword),
                searchVolume: trendData.searchVolume,
                trendDirection: trendData.trendDirection,
                rank: trendData.rank,
                trendData: trendData.trendData ? (trendData.trendData as unknown as Prisma.InputJsonValue) : undefined,
                lastUpdated: new Date(),
                realtorId
              }
            })

        trends.push({
          keyword: stored.keyword,
          location: stored.location,
          category: stored.category || undefined,
          searchVolume: stored.searchVolume || undefined,
          trendDirection: (stored.trendDirection as 'up' | 'down' | 'stable') || undefined,
          rank: stored.rank || undefined,
          trendData: stored.trendData ? (stored.trendData as unknown as TrendDataPoint[]) : undefined,
          lastUpdated: stored.lastUpdated
        })
      } catch (error) {
        console.error(`Error fetching trend for keyword "${keyword}":`, error)
        // Continue with other keywords even if one fails
        // Store fallback data so user still sees something
        try {
          const fallbackData = this.getFallbackTrendData(keyword)
          const existing = await prisma.trendingSearch.findFirst({
            where: {
              realtorId,
              keyword,
              location
            }
          })

          if (existing) {
            await prisma.trendingSearch.update({
              where: { id: existing.id },
              data: {
                searchVolume: fallbackData.searchVolume,
                trendDirection: fallbackData.trendDirection,
                trendData: fallbackData.trendData ? (fallbackData.trendData as unknown as Prisma.InputJsonValue) : undefined,
                lastUpdated: new Date()
              }
            })
          } else {
            await prisma.trendingSearch.create({
              data: {
                keyword,
                location,
                category: this.categorizeKeyword(keyword),
                searchVolume: fallbackData.searchVolume,
                trendDirection: fallbackData.trendDirection,
                trendData: fallbackData.trendData ? (fallbackData.trendData as unknown as Prisma.InputJsonValue) : undefined,
                lastUpdated: new Date(),
                realtorId
              }
            })
          }
        } catch (dbError) {
          console.error(`Error storing fallback data for "${keyword}":`, dbError)
        }
      }
    }

    return trends
  }

  /**
   * Get trend data for a specific keyword
   * Tries SerpAPI first, falls back to google-trends-api npm package
   */
  private async getTrendData(
    keyword: string,
    location: string
  ): Promise<{
    searchVolume?: number
    trendDirection?: 'up' | 'down' | 'stable'
    rank?: number
    trendData?: TrendDataPoint[]
  }> {
    // Try SerpAPI first if configured
    if (serpAPIService.isConfigured()) {
      try {
        const geoCode = this.convertLocationToGeoCode(location)
        const serpData = await serpAPIService.fetchInterestOverTime(keyword, geoCode, 'today 1-m')
        
        if (serpData && serpData.interestOverTime) {
          // Convert SerpAPI data to our format
          const trendData: TrendDataPoint[] = serpData.interestOverTime.map(point => ({
            date: point.date,
            value: point.value
          }))

          // Calculate search volume and trend direction
          const recentValues = trendData.slice(-7).map(d => d.value)
          const previousValues = trendData.slice(-14, -7).map(d => d.value)
          
          const recentAvg = recentValues.length > 0
            ? recentValues.reduce((a: number, b: number) => a + b, 0) / recentValues.length
            : 0
          const previousAvg = previousValues.length > 0
            ? previousValues.reduce((a: number, b: number) => a + b, 0) / previousValues.length
            : 0

          let trendDirection: 'up' | 'down' | 'stable' = 'stable'
          if (previousAvg > 0 && recentAvg > previousAvg * 1.1) {
            trendDirection = 'up'
          } else if (previousAvg > 0 && recentAvg < previousAvg * 0.9) {
            trendDirection = 'down'
          }

          return {
            searchVolume: Math.floor(recentAvg),
            trendDirection,
            trendData
          }
        }
      } catch (error) {
        console.warn(`SerpAPI failed for "${keyword}", falling back to google-trends-api:`, error instanceof Error ? error.message : String(error))
        // Fall through to google-trends-api
      }
    }

    // Fallback to google-trends-api npm package
    try {
      // Convert location to Google Trends geo code format
      // e.g., "Vernon, BC" -> "CA-BC" or just "CA" for Canada
      const geoCode = this.convertLocationToGeoCode(location)
      
      // Get trend data for the last 30 days
      const endTime = new Date()
      const startTime = new Date()
      startTime.setDate(startTime.getDate() - 30)

      const results = await googleTrends.interestOverTime({
        keyword: keyword,
        geo: geoCode,
        startTime: startTime,
        endTime: endTime
      })

      // Check if response is valid JSON (Google Trends sometimes returns HTML on errors/rate limits)
      if (typeof results !== 'string' || results.trim().startsWith('<')) {
        console.warn(`Google Trends returned non-JSON response for "${keyword}" - likely rate limited or error page`)
        return this.getFallbackTrendData(keyword)
      }

      let parsedResults: {
        default?: {
          timelineData?: Array<{
            time: string
            value: number[]
          }>
        }
      }

      try {
        parsedResults = JSON.parse(results) as {
          default?: {
            timelineData?: Array<{
              time: string
              value: number[]
            }>
          }
        }
      } catch (parseError) {
        console.error(`Failed to parse Google Trends JSON for "${keyword}":`, parseError)
        console.error('Response preview:', results.substring(0, 200))
        return this.getFallbackTrendData(keyword)
      }
      
      if (!parsedResults.default || !parsedResults.default.timelineData) {
        console.warn(`No data returned for keyword "${keyword}" in location "${location}"`)
        return this.getFallbackTrendData(keyword)
      }

      const timelineData = parsedResults.default.timelineData

      // Convert to our TrendDataPoint format
      const trendData: TrendDataPoint[] = timelineData.map((point) => {
        // time is in Unix timestamp (seconds), convert to date string
        const date = new Date(parseInt(point.time) * 1000)
        const dateStr = date.toISOString().split('T')[0]
        
        // value is an array, take the first element (normalized interest value)
        const value = Array.isArray(point.value) ? point.value[0] : point.value
        
        return {
          date: dateStr || '',
          value: typeof value === 'number' ? value : 0
        }
      }).filter((point) => point.date !== '')

      // Calculate search volume (average of recent values)
      const recentValues = trendData.slice(-7).map(d => d.value)
      const previousValues = trendData.slice(-14, -7).map(d => d.value)
      
      const recentAvg = recentValues.length > 0
        ? recentValues.reduce((a, b) => a + b, 0) / recentValues.length
        : 0
      const previousAvg = previousValues.length > 0
        ? previousValues.reduce((a, b) => a + b, 0) / previousValues.length
        : 0

      // Determine trend direction
      let trendDirection: 'up' | 'down' | 'stable' = 'stable'
      if (previousAvg > 0 && recentAvg > previousAvg * 1.1) {
        trendDirection = 'up'
      } else if (previousAvg > 0 && recentAvg < previousAvg * 0.9) {
        trendDirection = 'down'
      }

      // Estimate search volume (Google Trends uses normalized values 0-100)
      // We'll use the average as a relative indicator
      const searchVolume = Math.floor(recentAvg)

      return {
        searchVolume: searchVolume > 0 ? searchVolume : undefined,
        trendDirection,
        rank: undefined,
        trendData: trendData.length > 0 ? trendData : undefined
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error fetching Google Trends data for "${keyword}":`, errorMessage)
      
      // If it's a JSON parse error, Google Trends likely returned HTML (rate limit/block)
      if (errorMessage.includes('Unexpected token') || errorMessage.includes('JSON')) {
        console.warn(`Google Trends may have rate-limited or blocked the request for "${keyword}"`)
      }
      
      // Fallback to mock data if API fails
      return this.getFallbackTrendData(keyword)
    }
  }

  /**
   * Convert location string to Google Trends geo code
   * e.g., "Vernon, BC" -> "CA-BC", "Vernon, British Columbia" -> "CA-BC"
   */
  private convertLocationToGeoCode(location: string): string {
    const upper = location.toUpperCase()
    
    // Map Canadian provinces
    const provinceMap: Record<string, string> = {
      'BC': 'CA-BC',
      'BRITISH COLUMBIA': 'CA-BC',
      'AB': 'CA-AB',
      'ALBERTA': 'CA-AB',
      'SK': 'CA-SK',
      'SASKATCHEWAN': 'CA-SK',
      'MB': 'CA-MB',
      'MANITOBA': 'CA-MB',
      'ON': 'CA-ON',
      'ONTARIO': 'CA-ON',
      'QC': 'CA-QC',
      'QUEBEC': 'CA-QC',
      'NB': 'CA-NB',
      'NEW BRUNSWICK': 'CA-NB',
      'NS': 'CA-NS',
      'NOVA SCOTIA': 'CA-NS',
      'PE': 'CA-PE',
      'PRINCE EDWARD ISLAND': 'CA-PE',
      'NL': 'CA-NL',
      'NEWFOUNDLAND': 'CA-NL',
      'YT': 'CA-YT',
      'YUKON': 'CA-YT',
      'NT': 'CA-NT',
      'NORTHWEST TERRITORIES': 'CA-NT',
      'NU': 'CA-NU',
      'NUNAVUT': 'CA-NU'
    }

    // Try to find province code
    for (const [key, code] of Object.entries(provinceMap)) {
      if (upper.includes(key)) {
        return code
      }
    }

    // Check for US states (common patterns)
    if (upper.includes(', ') && upper.length > 2) {
      // Extract potential state abbreviation (last 2 chars after comma)
      const parts = upper.split(',')
      if (parts.length > 1) {
        const stateCandidate = parts[parts.length - 1]?.trim()
        // If it looks like a state code, use US format
        if (stateCandidate && stateCandidate.length === 2) {
          return `US-${stateCandidate}`
        }
      }
    }

    // Default to Canada if no match
    return 'CA'
  }

  /**
   * Fallback to mock data if Google Trends API fails
   */
  private getFallbackTrendData(keyword: string): {
    searchVolume?: number
    trendDirection?: 'up' | 'down' | 'stable'
    rank?: number
    trendData?: TrendDataPoint[]
  } {
    console.warn(`Using fallback mock data for keyword: "${keyword}"`)
    
    // Generate simple mock trend data (last 30 days)
    const trendData: TrendDataPoint[] = []
    const baseValue = Math.floor(Math.random() * 50) + 20
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const dateStr = date.toISOString().split('T')[0]
      if (dateStr) {
        trendData.push({
          date: dateStr,
          value: baseValue + Math.floor(Math.random() * 10 - 5)
        })
      }
    }

    const recentValues = trendData.slice(-7).map(d => d.value)
    const previousValues = trendData.slice(-14, -7).map(d => d.value)
    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
    const previousAvg = previousValues.reduce((a, b) => a + b, 0) / previousValues.length
    
    let trendDirection: 'up' | 'down' | 'stable' = 'stable'
    if (recentAvg > previousAvg * 1.1) {
      trendDirection = 'up'
    } else if (recentAvg < previousAvg * 0.9) {
      trendDirection = 'down'
    }

    return {
      searchVolume: Math.floor(recentAvg),
      trendDirection,
      rank: undefined,
      trendData
    }
  }

  /**
   * Categorize a keyword based on its content
   */
  private categorizeKeyword(keyword: string): string {
    const lower = keyword.toLowerCase()
    
    if (lower.includes('condo') || lower.includes('condos')) return 'property_type'
    if (lower.includes('townhouse') || lower.includes('townhouses')) return 'property_type'
    if (lower.includes('house') || lower.includes('home') || lower.includes('homes')) return 'property_type'
    if (lower.includes('apartment') || lower.includes('apt')) return 'property_type'
    if (lower.includes('school') || lower.includes('schools')) return 'amenity'
    if (lower.includes('park') || lower.includes('parks')) return 'amenity'
    if (lower.includes('restaurant') || lower.includes('restaurants')) return 'amenity'
    if (lower.includes('shopping') || lower.includes('mall')) return 'amenity'
    
    // Check if it's a neighborhood name (would need realtor context for this)
    // For now, default to general
    return 'general'
  }

  /**
   * Refresh trending data for all active custom search terms
   */
  async refreshTrendingData(realtorId: string): Promise<void> {
    const customTerms = await prisma.customSearchTerm.findMany({
      where: {
        realtorId,
        isActive: true
      }
    })

    const keywords = customTerms.map((term: { keyword: string }) => term.keyword)
    const defaultLocation = await this.getRealtorLocation(realtorId)
    const location = customTerms[0]?.location || defaultLocation || 'Unknown'

    if (keywords.length > 0) {
      await this.fetchTrendingSearches(keywords, location, realtorId)
    }
  }

  /**
   * Get realtor's primary location from their properties
   */
  private async getRealtorLocation(realtorId: string): Promise<string> {
    const property = await prisma.property.findFirst({
      where: { realtorId },
      select: { city: true, province: true }
    })

    if (property) {
      return `${property.city}, ${property.province}`
    }

    return 'Unknown'
  }

  /**
   * Fetch trending topics from Google Trends RSS feed
   * RSS feed URL format: https://trends.google.com/trending/rss?geo=CA
   * The feed can refresh every 2 hours
   * 
   * Reference: https://trends.google.com/trending/rss?geo=CA
   */
  async fetchTrendingFromRSS(geoCode: string = 'US'): Promise<Array<{
    title: string
    link: string
    pubDate: string
    description?: string
    category?: string
    traffic?: string
    picture?: string
    pictureSource?: string
  }>> {
    // Correct Google Trends RSS feed URL format
    // Found at: https://trends.google.com/trending/rss?geo=CA
    const rssUrls = [
      `https://trends.google.com/trending/rss?geo=${geoCode}`,
      // Fallback without geo (defaults to US)
      `https://trends.google.com/trending/rss`,
    ]

    for (const rssUrl of rssUrls) {
      try {
        console.log(`Fetching RSS feed from: ${rssUrl}`)
        const feed = await rssParser.parseURL(rssUrl)
        
        console.log(`RSS feed parsed. Items count: ${feed.items?.length || 0}`)
        
        if (feed.items && feed.items.length > 0) {
          // Debug: Log first item structure - get all possible fields
          if (feed.items[0]) {
            const firstItem = feed.items[0] as unknown as Record<string, unknown>
            console.log('First RSS item - Full structure:', {
              title: feed.items[0].title,
              link: feed.items[0].link,
              pubDate: feed.items[0].pubDate,
              content: typeof feed.items[0].content === 'string' ? feed.items[0].content.substring(0, 200) : feed.items[0].content,
              contentSnippet: feed.items[0].contentSnippet,
              categories: feed.items[0].categories,
              allKeys: Object.keys(firstItem),
              // Check for common RSS field names
              possibleTitle: firstItem['title'] || firstItem['Title'] || firstItem['TITLE'] || 
                            firstItem['item:title'] || firstItem['dc:title'] || 
                            (typeof firstItem['content'] === 'string' ? firstItem['content'].substring(0, 100) : null),
              rawItem: firstItem
            })
          }
          
          // Parse RSS items into structured format
          // Google Trends RSS uses custom namespaces (ht:) for additional data
          const parsedItems = feed.items.map((item) => {
            const itemAny = item as unknown as Record<string, unknown>
            
            // Try multiple ways to extract title - Google Trends RSS might use different fields
            let title = item.title
            if (!title || title.trim() === '') {
              // Try alternative field names
              title = (itemAny['title'] as string) || 
                     (itemAny['Title'] as string) ||
                     (itemAny['TITLE'] as string) ||
                     (itemAny['item:title'] as string) ||
                     (itemAny['dc:title'] as string) ||
                     // Try extracting from content or description
                     (typeof item.content === 'string' && item.content.length > 0 ? 
                       item.content.replace(/<[^>]*>/g, '').substring(0, 100).trim() : null) ||
                     (typeof item.contentSnippet === 'string' && item.contentSnippet.length > 0 ? 
                       item.contentSnippet.substring(0, 100).trim() : null) ||
                     'Untitled'
            }
            
            const link = item.link || (itemAny['link'] as string) || (itemAny['Link'] as string) || '#'
            const pubDate = item.pubDate || (itemAny['pubDate'] as string) || (itemAny['pubdate'] as string) || new Date().toISOString()
            
            // Extract custom Google Trends fields
            // The RSS parser should have mapped ht: namespaces to our custom field names
            const traffic = itemAny['traffic'] || itemAny['ht:approx_traffic'] || undefined
            const picture = itemAny['picture'] || itemAny['ht:picture'] || undefined
            const pictureSource = itemAny['pictureSource'] || itemAny['ht:picture_source'] || undefined
            const newsItems = itemAny['newsItems'] || itemAny['ht:news_item'] || undefined
            
            // Try to get description from news items if available
            let description: string | undefined
            if (Array.isArray(newsItems) && newsItems.length > 0) {
              const firstNews = newsItems[0] as Record<string, unknown>
              const newsTitle = firstNews['ht:news_item_title'] || firstNews['title'] || firstNews['news_item_title']
              const newsSource = firstNews['ht:news_item_source'] || firstNews['source'] || firstNews['news_item_source']
              const newsSnippet = firstNews['ht:news_item_snippet'] || firstNews['snippet'] || firstNews['news_item_snippet']
              description = newsTitle 
                ? `${String(newsTitle)}${newsSource ? ` (${String(newsSource)})` : ''}`
                : (newsSnippet ? String(newsSnippet) : undefined)
            }
            
            // Fallback to content snippet if no news items
            if (!description) {
              description = item.contentSnippet || (typeof item.content === 'string' ? item.content.substring(0, 200) : undefined)
            }

            const category = Array.isArray(item.categories) && item.categories.length > 0
              ? String(item.categories[0])
              : undefined

            return {
              title: String(title),
              link: String(link),
              pubDate: String(pubDate),
              description: description ? String(description).trim() : undefined,
              category,
              traffic: traffic ? String(traffic) : undefined,
              picture: picture ? String(picture) : undefined,
              pictureSource: pictureSource ? String(pictureSource) : undefined
            }
          })
          
          console.log(`Parsed ${parsedItems.length} RSS items. First item:`, parsedItems[0])
          return parsedItems
        }
      } catch (error) {
        // Try next URL if this one fails
        console.warn(`RSS feed URL failed: ${rssUrl}`, error instanceof Error ? error.message : String(error))
        continue
      }
    }

    // All RSS URLs failed
    console.error('⚠️ Failed to fetch Google Trends RSS feed from all URLs')
    
    // Return mock/placeholder data as fallback
    return this.getMockTrendingTopics(geoCode)
  }

  /**
   * Generate mock trending topics when RSS feed is unavailable
   */
  private getMockTrendingTopics(geoCode: string): Array<{
    title: string
    link: string
    pubDate: string
    description?: string
    category?: string
    traffic?: string
    picture?: string
    pictureSource?: string
  }> {
    const realEstateTopics = [
      'Real Estate Market Trends',
      'Home Buying Guide',
      'Mortgage Rates Update',
      'Property Investment Tips',
      'Housing Market Forecast',
      'First Time Home Buyer',
      'Real Estate Technology',
      'Property Management',
      'Home Renovation Ideas',
      'Real Estate Photography'
    ]

    return realEstateTopics.slice(0, 10).map((title) => ({
      title,
      link: `https://trends.google.com/trends/explore?q=${encodeURIComponent(title)}&geo=${geoCode}`,
      pubDate: new Date().toISOString(),
      description: `Trending real estate topic: ${title}`,
      category: 'real estate'
    }))
  }

  /**
   * Get geo code for RSS feed from location string
   * Converts location like "Vernon, BC" to RSS geo code (country-level)
   */
  getRSSGeoCode(location: string): string {
    const upper = location.toUpperCase()
    
    // Canadian provinces -> CA
    const canadianProvinces = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU', 'CANADA']
    for (const province of canadianProvinces) {
      if (upper.includes(province)) {
        return 'CA'
      }
    }
    
    // US states -> US
    if (upper.includes('USA') || upper.includes('UNITED STATES')) {
      return 'US'
    }
    
    // Check for US state abbreviations
    const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA']
    for (const state of usStates) {
      if (upper.includes(`, ${state}`) || upper.endsWith(state)) {
        return 'US'
      }
    }
    
    // Default to US (most common for real estate)
    return 'US'
  }
}

