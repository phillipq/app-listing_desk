/**
 * SerpAPI Google Trends Service
 * 
 * Uses SerpAPI to fetch Google Trends data
 * API Key should be in .env as SERPAPI_API_KEY
 * 
 * Documentation: https://serpapi.com/google-trends-api
 */

import * as serpapi from 'serpapi'

export interface SerpAPITrendingSearch {
  title: string
  traffic?: string // e.g., "200+", "1000+", "10k+"
  traffic_value?: number // Numeric value if available
  link?: string
  thumbnail?: string
  date?: string
  snippet?: string
  stories?: Array<{
    title: string
    link: string
    source: string
  }>
}

export interface SerpAPITrendData {
  keyword: string
  location: string
  interestOverTime?: Array<{
    date: string
    value: number
  }>
  relatedTopics?: Array<{
    topic: string
    value: number
  }>
  relatedQueries?: Array<{
    query: string
    value: number
  }>
}

export class SerpAPITrendsService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.SERPAPI_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ SERPAPI_API_KEY not found in environment variables')
    }
  }

  /**
   * Fetch trending searches from Google Trends
   * Uses: google_trends_trending_now engine
   */
  async fetchTrendingSearches(geoCode: string = 'US'): Promise<SerpAPITrendingSearch[]> {
    if (!this.apiKey) {
      throw new Error('SerpAPI API key not configured')
    }

    try {
      const params = {
        engine: 'google_trends_trending_now',
        geo: geoCode,
        api_key: this.apiKey
      }

      const results = await serpapi.getJson(params)

      // Extract trending searches
      // Handle different possible response structures
      let trendingSearches: SerpAPITrendingSearch[] | undefined

      if (Array.isArray(results.trending_searches)) {
        trendingSearches = results.trending_searches as SerpAPITrendingSearch[]
      } else if (results.trending_searches && typeof results.trending_searches === 'object') {
        const nested = results.trending_searches as { trending_searches?: unknown[] }
        if (Array.isArray(nested.trending_searches)) {
          trendingSearches = nested.trending_searches as SerpAPITrendingSearch[]
        }
      }

      if (!trendingSearches || !Array.isArray(trendingSearches) || trendingSearches.length === 0) {
        console.warn('No trending searches returned from SerpAPI. Response keys:', Object.keys(results))
        // Debug: log the actual structure
        if (results.trending_searches) {
          console.warn('trending_searches type:', typeof results.trending_searches, 'isArray:', Array.isArray(results.trending_searches))
        }
        return []
      }

      return trendingSearches
    } catch (error) {
      console.error('Error fetching trending searches from SerpAPI:', error)
      
      // Handle rate limiting or quota exceeded
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('SerpAPI quota exceeded. Free tier: 250 searches/month.')
        }
      }
      
      throw error
    }
  }

  /**
   * Fetch interest over time for a specific keyword
   * Uses: google_trends engine
   * According to SerpAPI docs: https://serpapi.com/google-trends-api
   */
  async fetchInterestOverTime(
    keyword: string,
    geoCode: string = 'US',
    _timeframe: string = 'today 1-m' // Last month (optional - Google Trends default is usually fine)
  ): Promise<SerpAPITrendData | null> {
    if (!this.apiKey) {
      throw new Error('SerpAPI API key not configured')
    }

    try {
      // SerpAPI Google Trends API - according to official docs
      // engine=google_trends, q=query, geo=location, data_type=TIMESERIES
      // Note: date parameter may not be supported - using default timeframe
      const params: Record<string, string> = {
        engine: 'google_trends',
        q: keyword,
        geo: geoCode,
        data_type: 'TIMESERIES', // Default is TIMESERIES but explicit is better
        api_key: this.apiKey
      }

      // Only add date if it's a valid timeframe format
      // SerpAPI may not support all date formats, so we'll try without first
      // If needed, we can add it back with proper format validation

      const results = await serpapi.getJson(params)

      // Check for errors first
      if (results.error) {
        const errorMessage = typeof results.error === 'string' 
          ? results.error 
          : (typeof results.error === 'object' && results.error !== null && 'message' in results.error
            ? String((results.error as { message?: unknown }).message)
            : JSON.stringify(results.error))
        
        console.warn(`SerpAPI error for "${keyword}": ${errorMessage}`)
        
        // "Google Trends hasn't returned any results" is a valid response for low-volume queries
        // This is not necessarily an error - the query might just not have enough data
        if (errorMessage.includes('hasn\'t returned any results') || 
            errorMessage.includes('no results') ||
            errorMessage.includes('No data available')) {
          console.log(`Query "${keyword}" has insufficient data in Google Trends. This is normal for niche queries.`)
          return null
        }
        
        // Log full error details for other errors
        if (typeof results.error === 'object') {
          console.error('Error details:', JSON.stringify(results.error, null, 2))
        }
        return null
      }

      // Extract interest over time data
      // SerpAPI response structure according to docs:
      // - For TIMESERIES data_type, results contain interest_over_time array
      // - Each point has: time (timestamp), value (0-100 relative interest)
      let interestOverTime: Array<{ date: string; value: number }> | undefined

      // Check for the data in the expected location
      // SerpAPI returns data in results.interest_over_time or results.default.timeline_data
      if (!results.interest_over_time && !results.default) {
        console.warn(`No interest_over_time data in SerpAPI response for "${keyword}". Available keys:`, Object.keys(results))
        return null
      }

      const interestData = results.interest_over_time as unknown

      // Check if it's an array directly
      if (Array.isArray(interestData)) {
        interestOverTime = interestData.map((point: unknown) => {
          const p = point as { time?: string | number; timestamp?: string | number; date?: string; value?: number | number[] }
          // Handle time field (can be timestamp, date string, or time property)
          const timeValue = p.time || p.timestamp || p.date
          const date: string = timeValue 
            ? (typeof timeValue === 'string' 
                ? timeValue 
                : (typeof timeValue === 'number' 
                    ? new Date(timeValue * 1000).toISOString().split('T')[0] || ''
                    : ''))
            : ''
          // Handle value (can be array or number, typically 0-100 relative interest)
          const value: number = Array.isArray(p.value) ? (p.value[0] ?? 0) : (typeof p.value === 'number' ? p.value : 0)
          return { date, value }
        })
      }
      // Check if it's nested in default.timeline_data (common SerpAPI structure)
      else if (results.default && typeof results.default === 'object') {
        const defaultData = results.default as Record<string, unknown>
        const timelineData = defaultData.timeline_data || defaultData.timelineData
        
        if (Array.isArray(timelineData)) {
          interestOverTime = timelineData.map((point: unknown) => {
            const p = point as { time?: string | number; timestamp?: string | number; date?: string; value?: number | number[] }
            const timeValue = p.time || p.timestamp || p.date
            const date: string = timeValue 
              ? (typeof timeValue === 'string' 
                  ? timeValue 
                  : (typeof timeValue === 'number' 
                      ? new Date(timeValue * 1000).toISOString().split('T')[0] || ''
                      : ''))
              : ''
            const value: number = Array.isArray(p.value) ? (p.value[0] ?? 0) : (typeof p.value === 'number' ? p.value : 0)
            return { date, value }
          })
        }
      }
      // Also check if interestData is an object with nested structure
      else if (interestData && typeof interestData === 'object') {
        const data = interestData as Record<string, unknown>
        const timelineData = data.timeline_data || data.timelineData
        
        if (Array.isArray(timelineData)) {
          interestOverTime = timelineData.map((point: unknown) => {
            const p = point as { time?: string | number; timestamp?: string | number; date?: string; value?: number | number[] }
            const timeValue = p.time || p.timestamp || p.date
            const date: string = timeValue 
              ? (typeof timeValue === 'string' 
                  ? timeValue 
                  : (typeof timeValue === 'number' 
                      ? new Date(timeValue * 1000).toISOString().split('T')[0] || ''
                      : ''))
              : ''
            const value: number = Array.isArray(p.value) ? (p.value[0] ?? 0) : (typeof p.value === 'number' ? p.value : 0)
            return { date, value }
          })
        }
      }

      if (!interestOverTime || interestOverTime.length === 0) {
        console.warn(`No interest_over_time data found in SerpAPI response for "${keyword}".`)
        console.warn('interest_over_time type:', typeof interestData, 'isArray:', Array.isArray(interestData))
        if (interestData && typeof interestData === 'object') {
          console.warn('interest_over_time keys:', Object.keys(interestData as Record<string, unknown>))
        }
        return null
      }

      return {
        keyword,
        location: geoCode,
        interestOverTime: interestOverTime.map(point => ({
          date: point.date || '',
          value: typeof point.value === 'number' ? point.value : 0
        })),
        relatedTopics: results.related_topics as Array<{ topic: string; value: number }> | undefined,
        relatedQueries: results.related_queries as Array<{ query: string; value: number }> | undefined
      }
    } catch (error) {
      console.error(`Error fetching interest over time for "${keyword}" from SerpAPI:`, error)
      
      if (error instanceof Error) {
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('SerpAPI quota exceeded. Free tier: 250 searches/month.')
        }
      }
      
      return null
    }
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Get remaining quota (if available from API)
   */
  async getRemainingQuota(): Promise<number | null> {
    // SerpAPI doesn't expose quota via API directly
    // You'd need to track usage yourself or check your dashboard
    return null
  }
}

