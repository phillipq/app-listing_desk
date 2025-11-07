# Contact Research Methods

This document outlines different methods and approaches for gathering contact information from email headers.

## Current Implementation

### 1. Email Header Parsing ✅
- **Status**: Implemented
- **Location**: `lib/email-parser.ts`
- **Features**:
  - Parses `From:`, `To:`, `Cc:`, and `Subject:` fields
  - Handles multiple formats:
    - `"Name <email@domain.com>"`
    - `"Last, First <email@domain.com>"`
    - `email@domain.com` (email only)
  - Extracts unique contacts from To: and Cc: fields

## Data Sources & Lookup Methods

### 1. LinkedIn API (Primary - In Progress)

**Status**: Placeholder implementation ready for API integration

**Implementation Location**: `lib/linkedin-service.ts`

**Methods Available**:
- **People Search API**: Search by name, company, title
  - Endpoint: `https://api.linkedin.com/v2/people-search`
  - Requires: `r_people_search` scope
  - Limitations: Cannot search by email directly
  - Best for: Finding profiles when you have name + company

- **Profile API**: Get detailed profile by LinkedIn ID
  - Endpoint: `https://api.linkedin.com/v2/people/(id)`
  - Requires: `r_basicprofile` scope
  - Returns: Title, company, location, profile image, summary

- **Email Address API**: Match email to LinkedIn profile
  - Endpoint: `https://api.linkedin.com/v2/emailAddress?q=members&email={email}`
  - Requires: `r_emailaddress` scope
  - Best for: Direct email-to-profile matching

**Setup Required**:
1. Create LinkedIn App at https://www.linkedin.com/developers/apps
2. Get Client ID and Client Secret
3. Set up OAuth 2.0 flow for user authorization
4. Request appropriate scopes
5. Store credentials in environment variables:
   - `LINKEDIN_API_KEY`
   - `LINKEDIN_API_SECRET`
   - `LINKEDIN_ACCESS_TOKEN` (obtained via OAuth)

**Rate Limits**:
- Free tier: ~500 requests/day
- Paid tiers available for higher volume

**Pros**:
- Most comprehensive professional data
- High-quality profile images
- Accurate job titles and companies
- Official API with good documentation

**Cons**:
- Requires OAuth setup
- Rate limits on free tier
- Cannot search by email directly (need name + company)
- Some data requires premium API access

---

### 2. Instagram Search (Future)

**Status**: Not yet implemented

**Approaches**:

**A. Instagram Basic Display API**
- Official Instagram API
- Requires user authorization
- Limited to user's own account data
- Not suitable for searching other users

**B. Instagram Graph API (Business)**
- For business accounts
- Can search public profiles
- Requires Facebook Business account
- Better for business profile discovery

**C. Web Scraping (Not Recommended)**
- Instagram actively blocks scraping
- Terms of Service violation
- Unreliable and may break
- Legal concerns

**Best Approach**: Use Instagram Graph API for business profiles, or skip Instagram if not critical

**Implementation Considerations**:
- Focus on business/professional accounts
- Use name + email domain to guess Instagram handle
- Search for business pages associated with email domain
- Store results in `instagramUrl` field

---

### 3. Website/Domain Search (Future)

**Status**: Not yet implemented

**Methods**:

**A. Domain-Based Search**
- Extract domain from email (e.g., `@company.com`)
- Search for company website
- Look for "Team" or "About" pages
- Search for person's name on company website

**B. Google Search API / Custom Search**
- Use Google Custom Search API
- Query: `"{name}" "{company}" site:linkedin.com OR site:company.com`
- Parse results for profile links
- Rate limits: 100 queries/day (free tier)

**C. Clearbit Enrichment API**
- Professional email enrichment service
- Provides: LinkedIn, Twitter, company info
- Paid service: ~$0.05-0.10 per lookup
- High accuracy, good for B2B contacts

**D. Hunter.io / Email Finder APIs**
- Email verification and enrichment
- Can find social profiles from email
- Paid service with free tier
- Good for finding LinkedIn profiles from email

**Implementation Priority**:
1. Domain extraction and company website search
2. Google Custom Search for profile discovery
3. Consider Clearbit/Hunter.io for premium features

---

### 4. Additional Data Sources (Future)

**A. Twitter/X Search**
- Search by name + company
- Find Twitter profiles
- Less professional data than LinkedIn
- API access limited (requires Twitter Developer account)

**B. GitHub (for tech professionals)**
- Search by email or username
- Good for developers/technical roles
- Public API available
- Can find email from GitHub profile

**C. Company Website Scraping**
- Parse company "Team" or "About" pages
- Extract employee profiles
- Match by name/email
- Requires careful parsing and may need permission

**D. Public Records / Data Brokers**
- Services like ZoomInfo, Apollo.io
- Expensive but comprehensive
- Legal/compliance considerations
- Best for enterprise use cases

---

## Recommended Implementation Order

### Phase 1: LinkedIn (Current Priority) ✅
1. Set up LinkedIn OAuth flow
2. Implement People Search by name + company
3. Implement Profile API for detailed info
4. Add email-to-profile matching if available

### Phase 2: Domain/Website Search
1. Extract company domain from email
2. Search company website for team pages
3. Implement Google Custom Search for profile discovery
4. Parse results for LinkedIn/social links

### Phase 3: Instagram (Optional)
1. Focus on business accounts only
2. Use Instagram Graph API
3. Search by business name/domain

### Phase 4: Premium Services (Optional)
1. Evaluate Clearbit/Hunter.io APIs
2. Consider cost vs. value
3. Implement as premium feature if needed

---

## Data Structure

Each person profile includes:
```typescript
interface PersonProfile {
  email: string
  name: string | null
  linkedinUrl?: string
  linkedinTitle?: string
  linkedinCompany?: string
  linkedinImage?: string
  instagramUrl?: string
  websiteUrl?: string
  profileImage?: string
  sources: string[]  // ['LinkedIn', 'Instagram', 'Website', etc.]
}
```

---

## Rate Limiting & Performance

**Current Implementation**:
- Processes contacts in batches of 5
- 500ms delay between batches
- Limits to 50 contacts per request

**Recommendations**:
- Cache results in database (optional schema addition)
- Implement request queuing for large batches
- Add progress indicators for long-running lookups
- Consider background job processing for >20 contacts

---

## Privacy & Compliance

**Important Considerations**:
- Only use publicly available information
- Respect rate limits and API terms of service
- Consider GDPR/privacy regulations
- Provide opt-out mechanisms if storing data
- Be transparent about data sources

---

## Next Steps

1. **Complete LinkedIn Integration**:
   - Set up OAuth flow
   - Implement People Search API
   - Test with real LinkedIn API credentials

2. **Add Domain/Website Search**:
   - Extract company domains
   - Implement Google Custom Search
   - Parse company team pages

3. **Consider Caching**:
   - Add database model for cached profiles
   - Reduce API calls for repeated lookups
   - Improve performance

4. **Enhance UI**:
   - Add progress indicators
   - Show partial results as they come in
   - Allow manual profile editing
   - Export results to CSV/PDF

