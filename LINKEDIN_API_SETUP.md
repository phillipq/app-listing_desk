# LinkedIn API Setup Guide

## Required LinkedIn Products

Request access to these products in your LinkedIn Developer account:

### 1. Member Data Portability API (3rd Party) - **Default Tier**
- **Purpose**: Access to LinkedIn member data upon authorization
- **Status**: Default tier (should be available immediately)
- **Use Case**: Get profile information for authorized users
- **Note**: Primarily for user's own data, not for searching others

### 2. Sign In with LinkedIn using OpenID Connect - **Standard Tier**
- **Purpose**: OAuth authentication
- **Status**: Standard tier (may require approval)
- **Use Case**: Authenticate users and get access tokens
- **Required**: For OAuth flow to work

## Important Limitations

⚠️ **LinkedIn API Restrictions**:
- LinkedIn **deprecated the People Search API** (v2/people-search)
- There is **NO public API** to search profiles by email or name
- The Member Data Portability API is mainly for exporting a user's own data
- Email address API has limited availability and requires special permissions

## Setup Steps

### Step 1: Create LinkedIn App
1. Go to https://www.linkedin.com/developers/apps
2. Click "Create app"
3. Fill in app details:
   - App name: Your app name
   - Company: Your company
   - Privacy policy URL: Your privacy policy
   - App logo: Your logo
4. Submit and wait for approval (if required)

### Step 2: Request Product Access
1. In your app dashboard, go to "Products" tab
2. Request access to:
   - **Member Data Portability API (3rd Party)**
   - **Sign In with LinkedIn using OpenID Connect**
3. Fill out the access request forms
4. Wait for approval (Standard tier may take time)

### Step 3: Get Credentials
1. In your app dashboard, go to "Auth" tab
2. Note your:
   - **Client ID** (also called "Client ID" or "API Key")
   - **Client Secret** (also called "Client Secret")
3. Add authorized redirect URLs:
   - `http://localhost:3000/api/auth/linkedin/callback` (development)
   - `https://yourdomain.com/api/auth/linkedin/callback` (production)

### Step 4: Configure Environment Variables
Add to your `.env` file:
```env
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
```

### Step 5: Implement OAuth Flow
The OAuth flow will be implemented to:
1. Redirect user to LinkedIn for authorization
2. Get authorization code
3. Exchange code for access token
4. Use access token for API calls

## Available Endpoints (Limited)

### Profile API
```
GET https://api.linkedin.com/v2/people/(id)
```
- Requires: LinkedIn member ID (not email/name)
- Returns: Profile information
- **Problem**: Need ID first, can't search by email/name

### Email Address API (Limited Availability)
```
GET https://api.linkedin.com/v2/emailAddress?q=members&email={email}
```
- Requires: `r_emailaddress` scope
- **Problem**: May not be available, requires special permissions
- **Note**: Check if this endpoint is still available in current API

## Alternative Approaches

Since LinkedIn's API has limitations, consider:

### Option 1: Third-Party Enrichment Services
- **Clearbit**: Email enrichment, finds LinkedIn profiles
- **Hunter.io**: Email finder and verifier
- **Apollo.io**: B2B contact database with LinkedIn data
- **ZoomInfo**: Enterprise contact database
- **Pros**: Reliable, comprehensive data
- **Cons**: Paid service, cost per lookup

### Option 2: Domain-Based Search
1. Extract company domain from email
2. Search company website for team pages
3. Find LinkedIn profiles on company site
4. Match by name/email

### Option 3: Google Custom Search
1. Set up Google Custom Search Engine
2. Search: `"{name}" "{company}" site:linkedin.com/in/`
3. Parse results for LinkedIn profile URLs
4. Extract profile data from URLs

### Option 4: LinkedIn URL Construction + Verification
1. Construct LinkedIn URL from name: `linkedin.com/in/firstname-lastname`
2. Check if profile exists (web scraping - use carefully)
3. Extract public profile data
4. **Note**: May violate LinkedIn ToS, use at your own risk

## Recommended Implementation Strategy

### Phase 1: Basic Implementation
1. Set up LinkedIn OAuth (for future use)
2. Implement email-to-LinkedIn URL guessing
3. Add manual profile URL input option

### Phase 2: Third-Party Integration
1. Integrate Clearbit or Hunter.io API
2. Use for reliable email-to-profile matching
3. Fallback to manual search if API fails

### Phase 3: Enhanced Search
1. Implement Google Custom Search for LinkedIn profiles
2. Add domain-based company website search
3. Combine multiple sources for best results

## Code Implementation

The LinkedIn service (`lib/linkedin-service.ts`) is set up with:
- Placeholder functions for API calls
- Error handling
- Type definitions
- Documentation

Once you have API access, update:
1. `lookupLinkedInProfile()` - Main lookup function
2. `lookupLinkedInByEmail()` - Email-based lookup (if available)
3. `getLinkedInProfileById()` - Profile by ID lookup

## Testing

After setup:
1. Test OAuth flow with a test LinkedIn account
2. Verify access token retrieval
3. Test API endpoints with Postman/curl
4. Check rate limits and quotas
5. Implement error handling for API failures

## Support Resources

- LinkedIn Developer Documentation: https://docs.microsoft.com/en-us/linkedin/
- LinkedIn Developer Forums: https://www.linkedin.com/help/linkedin/answer/a1338220
- API Status: Check LinkedIn API status page

## Next Steps

1. ✅ Request access to required LinkedIn products
2. ⏳ Wait for approval (especially for Standard tier)
3. ⏳ Get Client ID and Secret
4. ⏳ Implement OAuth flow
5. ⏳ Test API endpoints
6. ⏳ Consider third-party services as alternative/backup

