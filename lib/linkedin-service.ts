/**
 * LinkedIn API Service
 * Handles LinkedIn profile lookups using the LinkedIn API
 * 
 * IMPORTANT: LinkedIn API Limitations
 * - LinkedIn deprecated the People Search API (v2/people-search)
 * - There is NO public API to search profiles by email or name
 * - Member Data Portability API is primarily for user's own data export
 * 
 * Required LinkedIn Products:
 * 1. Member Data Portability API (3rd Party) - Default Tier
 * 2. Sign In with LinkedIn using OpenID Connect - Standard Tier (for OAuth)
 * 
 * Alternative Approaches:
 * - Use email address API if available (limited access)
 * - Search by name + company using available endpoints
 * - Consider third-party enrichment services (Clearbit, Hunter.io, Apollo.io)
 */

interface LinkedInProfile {
  url: string
  title?: string
  company?: string
  image?: string
  location?: string
  summary?: string
}

/**
 * Lookup a LinkedIn profile by email or name
 * 
 * Note: LinkedIn's API has significant limitations. You'll need to:
 * 1. Request access to "Member Data Portability API (3rd Party)"
 * 2. Request access to "Sign In with LinkedIn using OpenID Connect"
 * 3. Set up LinkedIn API credentials (Client ID, Client Secret)
 * 4. Implement OAuth flow for user authorization
 * 
 * Available LinkedIn API endpoints (limited):
 * - Profile API: https://api.linkedin.com/v2/people/(id) - Requires LinkedIn ID
 * - Email Address API: https://api.linkedin.com/v2/emailAddress?q=members&email={email}
 *   - Requires r_emailaddress scope
 *   - Limited availability
 * 
 * For now, this returns a mock structure that you can replace with actual API calls
 */
export async function lookupLinkedInProfile(
  email: string,
  name: string | null
): Promise<LinkedInProfile | null> {
  // TODO: Replace with actual LinkedIn API call
  // This is a placeholder that shows the expected structure

  const linkedinClientId = process.env.LINKEDIN_CLIENT_ID
  const linkedinClientSecret = process.env.LINKEDIN_CLIENT_SECRET

  if (!linkedinClientId || !linkedinClientSecret) {
    console.warn('LinkedIn API credentials not configured')
    console.warn('Required: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET')
    return null
  }

  try {
    // Option 1: Search by email (if you have access to email search)
    // Note: LinkedIn's People Search API typically doesn't support email search
    // You may need to use name + company or other fields
    
    // Option 2: Search by name (more common approach)
    if (name) {
      const searchResults = await searchLinkedInByName(name, email)
      if (searchResults) {
        return searchResults
      }
    }

    // Option 3: Use LinkedIn's Profile API if you have the person's LinkedIn ID
    // This would require additional lookup steps

    return null
  } catch (error) {
    console.error('LinkedIn lookup error:', error)
    return null
  }
}

/**
 * Search LinkedIn by name
 * 
 * NOTE: LinkedIn deprecated the People Search API. This function may not work
 * with current LinkedIn APIs. Consider using third-party enrichment services instead.
 */
async function searchLinkedInByName(
  name: string,
  email: string
): Promise<LinkedInProfile | null> {
  // TODO: LinkedIn People Search API is deprecated
  // Alternative approaches:
  // 1. Use email address API (if you have r_emailaddress scope)
  // 2. Use third-party services (Clearbit, Hunter.io, Apollo.io)
  // 3. Try to construct LinkedIn URL and verify if profile exists
  
  // Attempt email-based lookup if available
  const emailLookup = await lookupLinkedInByEmail(email)
  if (emailLookup) {
    return emailLookup
  }

  // Placeholder: Return null for now until alternative method is implemented
  return null
}

/**
 * Lookup LinkedIn profile by email address
 * Requires: r_emailaddress scope and Member Data Portability API access
 */
async function lookupLinkedInByEmail(
  email: string
): Promise<LinkedInProfile | null> {
  const linkedinAccessToken = process.env.LINKEDIN_ACCESS_TOKEN
  
  if (!linkedinAccessToken) {
    return null
  }

  try {
    // Note: This endpoint may not be available or may require special permissions
    // Check LinkedIn API documentation for current availability
    const response = await fetch(
      `https://api.linkedin.com/v2/emailAddress?q=members&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${linkedinAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.warn(`LinkedIn email lookup failed: ${response.status}`)
      return null
    }

    const _data = await response.json() as { elements?: Array<{ 'handle~'?: { emailAddress?: string } }> }
    
    // Parse response and get profile ID
    // Then fetch full profile using Profile API
    // This is a simplified example - actual implementation depends on API response structure
    
    return null
  } catch (error) {
    console.error('LinkedIn email lookup error:', error)
    return null
  }
}

/**
 * Alternative: Use LinkedIn's People Search API with filters
 * 
 * ⚠️ DEPRECATED: LinkedIn People Search API (v2/people-search) is no longer available
 * 
 * This function is kept for reference but will not work with current LinkedIn APIs.
 * 
 * Required scopes (if API was available):
 * - r_people_search (for people search) - DEPRECATED
 * - r_basicprofile (for basic profile info)
 * - r_emailaddress (if you need email matching)
 * 
 * Alternative: Use third-party enrichment services or construct LinkedIn URLs
 */
export async function searchLinkedInPeople(
  _query: string,
  _filters?: Record<string, unknown>
): Promise<LinkedInProfile[]> {
  // LinkedIn People Search API is deprecated
  // Consider using:
  // 1. Third-party services (Clearbit, Hunter.io, Apollo.io)
  // 2. Domain-based search + LinkedIn URL construction
  // 3. Google Custom Search for LinkedIn profiles
  console.warn('LinkedIn People Search API is deprecated')
  return []
}

/**
 * Get LinkedIn profile by profile ID
 */
export async function getLinkedInProfileById(
  _profileId: string
): Promise<LinkedInProfile | null> {
  // TODO: Implement LinkedIn Profile API
  return null
}

/**
 * Helper to extract LinkedIn profile URL from email domain
 * Some companies have predictable LinkedIn patterns
 */
export function guessLinkedInUrl(email: string, name: string | null): string | null {
  if (!name) return null
  
  // Extract first and last name
  const nameParts = name.trim().split(/\s+/)
  if (nameParts.length < 2) return null
  
  const firstName = nameParts[0]
  const lastName = nameParts[nameParts.length - 1]
  
  if (!firstName || !lastName) return null
  
  // Common LinkedIn URL pattern: linkedin.com/in/firstname-lastname
  return `https://www.linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`
}

