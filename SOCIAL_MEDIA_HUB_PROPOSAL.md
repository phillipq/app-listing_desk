# Social Media Hub - Architecture & Implementation Plan

## Overview
A comprehensive social media hub that analyzes trending real estate searches in the realtor's area and automatically generates engaging social media posts for WhatsApp and Instagram, driving traffic to the realtor's website.

---

## 🎯 Core Features

1. **Trending Search Dashboard**
   - Real-time trending keywords for the realtor's location (city/province)
   - Search volume trends over time
   - Comparison with nearby markets
   - Category breakdown (property types, neighborhoods, amenities)

2. **AI-Powered Post Generation**
   - Context-aware posts based on trending searches
   - Platform-specific optimization (WhatsApp vs Instagram)
   - Multiple post variations (educational, promotional, community-focused)
   - Call-to-action linking to realtor's website

3. **Content Scheduling & Publishing**
   - Queue posts for scheduled publication
   - Auto-publish to WhatsApp Business and Instagram
   - Performance tracking (views, clicks, engagement)

4. **Content Library**
   - Save generated posts
   - Edit before publishing
   - Reuse templates for similar trends

---

## 📊 Data Sources for Trending Searches

### Option 1: Google Trends API (Recommended)
**Pros:**
- Free and reliable
- Real-time trending data
- Geographic filtering (city, province, region)
- Category-specific searches
- Historical trend data

**Implementation:**
```typescript
// Use google-trends-api npm package or direct API
const trends = await googleTrends.interestOverTime({
  keyword: ['homes for sale Vernon', 'real estate Vernon'],
  geo: 'CA-BC', // Province code
  startTime: new Date('2024-01-01'),
  endTime: new Date()
})
```

**Search Strategy:**
- Base keywords: "[city] real estate", "[city] homes for sale", "[city] properties"
- Property types: "[city] condos", "[city] townhouses", "[city] detached homes"
- Neighborhoods: Specific neighborhoods from realtor's context
- Amenities: "schools near [city]", "parks [city]", "restaurants [city]"

### Option 2: Google Keyword Planner (Via Ads API)
**Pros:**
- Search volume data
- Competition metrics
- Cost-per-click data
- More detailed insights

**Cons:**
- Requires Google Ads account
- API access requires approval
- More complex setup

### Option 3: Bing Keyword Research API
**Alternative to Google with similar data**

### Option 4: Real Estate MLS Data
**Combine with:**
- MLS listing views by property type
- Popular searches from your own website
- User queries from chatbot conversations

**Pros:**
- Proprietary data
- Directly relevant to your listings
- Real buyer intent

---

## 🏗️ Architecture Design

### Database Schema Extensions

```prisma
model TrendingSearch {
  id          String   @id @default(cuid())
  keyword     String
  location    String   // City or province
  category    String   // "property_type", "neighborhood", "amenity", "general"
  searchVolume Int?
  trendDirection String // "up", "down", "stable"
  rank        Int?
  realtorId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  realtor     Realtor  @relation(fields: [realtorId], references: [id], onDelete: Cascade)
  posts       SocialMediaPost[]
  
  @@index([realtorId, location])
  @@index([category, location])
}

model SocialMediaPost {
  id              String   @id @default(cuid())
  trendingSearchId String?
  title           String
  content         String
  platform        String   // "whatsapp", "instagram"
  status          String   // "draft", "scheduled", "published", "archived"
  scheduledAt     DateTime?
  publishedAt     DateTime?
  imageUrl        String?
  websiteLink     String?
  hashtags        String[] // For Instagram
  metrics         Json?    // Engagement metrics
  
  realtorId       String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  trendingSearch  TrendingSearch? @relation(fields: [trendingSearchId], references: [id])
  realtor         Realtor         @relation(fields: [realtorId], references: [id], onDelete: Cascade)
  
  @@index([realtorId, status])
  @@index([platform, status])
}

model PostTemplate {
  id          String   @id @default(cuid())
  name        String
  category    String   // "trending_property", "neighborhood_spotlight", "market_update"
  content     String   // Template with placeholders
  platform    String
  realtorId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  realtor     Realtor  @relation(fields: [realtorId], references: [id], onDelete: Cascade)
}
```

**Add to Realtor model:**
```prisma
model Realtor {
  // ... existing fields
  trendingSearches TrendingSearch[]
  socialMediaPosts SocialMediaPost[]
  postTemplates    PostTemplate[]
}
```

---

## 🔧 Implementation Components

### 1. Trending Search Service
**File:** `lib/trending-search-service.ts`

```typescript
import googleTrends from 'google-trends-api'
import { prisma } from './prisma'

export class TrendingSearchService {
  /**
   * Fetch trending searches for a location
   */
  async fetchTrendingSearches(
    location: string,
    province: string,
    realtorId: string
  ): Promise<TrendingSearch[]> {
    // 1. Get base keywords from realtor's context/properties
    const keywords = await this.generateKeywords(location, province)
    
    // 2. Fetch Google Trends data
    const trends = await googleTrends.interestOverTime({
      keyword: keywords,
      geo: this.getProvinceCode(province),
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      endTime: new Date()
    })
    
    // 3. Process and store results
    return this.processTrendsData(trends, location, realtorId)
  }
  
  /**
   * Generate keyword variations based on realtor context
   */
  private async generateKeywords(location: string, province: string): Promise<string[]> {
    const baseKeywords = [
      `${location} real estate`,
      `${location} homes for sale`,
      `${location} properties`,
      `houses for sale ${location}`,
      `condos ${location}`,
      `townhouses ${location}`
    ]
    
    // Add neighborhood-specific keywords from realtor context
    // Add property type variations
    return baseKeywords
  }
  
  /**
   * Process trends data and store in database
   */
  private async processTrendsData(
    trendsData: any,
    location: string,
    realtorId: string
  ): Promise<TrendingSearch[]> {
    // Parse Google Trends response
    // Calculate trend direction (up/down/stable)
    // Store in database
    // Return processed results
  }
}
```

### 2. AI Post Generator Service
**File:** `lib/social-post-generator.ts`

```typescript
import OpenAI from 'openai'
import { prisma } from './prisma'

export class SocialPostGenerator {
  private openai: OpenAI
  
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  
  /**
   * Generate social media posts from trending search
   */
  async generatePosts(
    trendingSearch: TrendingSearch,
    realtorId: string,
    platforms: ('whatsapp' | 'instagram')[]
  ): Promise<SocialMediaPost[]> {
    const realtor = await prisma.realtor.findUnique({
      where: { id: realtorId },
      select: { name: true, domain: true, context: true }
    })
    
    const posts: SocialMediaPost[] = []
    
    for (const platform of platforms) {
      const prompt = this.buildPrompt(trendingSearch, realtor, platform)
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(platform)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
      
      const content = completion.choices[0]?.message?.content || ''
      
      // Parse and structure the generated post
      const post = await this.structurePost(content, trendingSearch, platform, realtor)
      posts.push(post)
    }
    
    return posts
  }
  
  private buildPrompt(
    trendingSearch: TrendingSearch,
    realtor: Realtor,
    platform: string
  ): string {
    return `
Generate an engaging ${platform} post about the trending search: "${trendingSearch.keyword}"

Realtor: ${realtor.name}
Location: ${trendingSearch.location}
Website: ${realtor.domain || 'N/A'}

Trend Context:
- Search volume is ${trendingSearch.trendDirection}
- Category: ${trendingSearch.category}

Requirements:
- ${platform === 'instagram' ? 'Include 5-10 relevant hashtags' : 'Keep it conversational'}
- Include a call-to-action linking to the realtor's website
- Make it feel authentic and helpful, not salesy
- Highlight why this trend matters to potential buyers
- Length: ${platform === 'instagram' ? '150-200 words' : '100-150 words'}

Generate the post content:
`
  }
  
  private getSystemPrompt(platform: string): string {
    if (platform === 'instagram') {
      return `You are a social media expert creating engaging Instagram posts for real estate agents. 
Your posts should be visually appealing, use relevant hashtags, and drive engagement.`
    } else {
      return `You are a communication expert creating WhatsApp Business messages for real estate agents.
Your messages should be friendly, conversational, and valuable to recipients.`
    }
  }
  
  private async structurePost(
    content: string,
    trendingSearch: TrendingSearch,
    platform: string,
    realtor: Realtor
  ): Promise<SocialMediaPost> {
    // Parse hashtags from content
    const hashtags = content.match(/#[\w]+/g) || []
    const cleanContent = content.replace(/#[\w]+/g, '').trim()
    
    // Extract website link
    const websiteLink = realtor.domain 
      ? `https://${realtor.domain}` 
      : process.env.NEXT_PUBLIC_APP_URL
    
    return {
      title: `${trendingSearch.keyword} - ${platform}`,
      content: cleanContent,
      platform,
      status: 'draft',
      trendingSearchId: trendingSearch.id,
      realtorId: trendingSearch.realtorId,
      hashtags: hashtags.map(h => h.substring(1)),
      websiteLink
    }
  }
}
```

### 3. Social Media Publisher Service
**File:** `lib/social-media-publisher.ts`

```typescript
import { Meta } from 'meta-sdk' // Facebook/Instagram API
import twilio from 'twilio'
import { prisma } from './prisma'

export class SocialMediaPublisher {
  /**
   * Publish post to Instagram
   */
  async publishToInstagram(
    post: SocialMediaPost,
    imageUrl?: string
  ): Promise<{ success: boolean; postId?: string }> {
    // 1. Get Instagram access token from SocialToken
    const token = await prisma.socialToken.findFirst({
      where: {
        userId: post.realtorId,
        platform: 'instagram'
      }
    })
    
    if (!token) {
      throw new Error('Instagram not connected')
    }
    
    // 2. Upload image (if provided)
    let imageId: string | undefined
    if (imageUrl) {
      imageId = await this.uploadImageToInstagram(token.accessToken, imageUrl)
    }
    
    // 3. Create Instagram post via Graph API
    const meta = new Meta({ accessToken: token.accessToken })
    const response = await meta.instagram.createPost({
      caption: `${post.content}\n\n${post.hashtags.map(h => `#${h}`).join(' ')}\n\n🔗 ${post.websiteLink}`,
      image_url: imageUrl,
      access_token: token.accessToken
    })
    
    // 4. Update post status in database
    await prisma.socialMediaPost.update({
      where: { id: post.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        metrics: { instagramPostId: response.id }
      }
    })
    
    return { success: true, postId: response.id }
  }
  
  /**
   * Send post to WhatsApp Business
   */
  async publishToWhatsApp(
    post: SocialMediaPost,
    recipients?: string[]
  ): Promise<{ success: boolean; messageIds?: string[] }> {
    // 1. Get WhatsApp channel config
    const channel = await prisma.communicationChannel.findFirst({
      where: {
        userId: post.realtorId,
        type: 'whatsapp',
        isActive: true
      }
    })
    
    if (!channel?.config) {
      throw new Error('WhatsApp not configured')
    }
    
    const config = channel.config as { phoneNumber: string; accountSid: string; authToken: string }
    const client = twilio(config.accountSid, config.authToken)
    
    // 2. Determine recipients
    // Option A: Broadcast to all contacts
    // Option B: Send to specific list
    // Option C: Send to leads matching the trending search category
    
    const messageContent = `${post.content}\n\n🔗 Learn more: ${post.websiteLink}`
    
    // 3. Send via Twilio WhatsApp API
    const messageIds: string[] = []
    for (const recipient of recipients || []) {
      const message = await client.messages.create({
        from: `whatsapp:${config.phoneNumber}`,
        to: `whatsapp:${recipient}`,
        body: messageContent
      })
      messageIds.push(message.sid)
    }
    
    // 4. Update post status
    await prisma.socialMediaPost.update({
      where: { id: post.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        metrics: { whatsappMessageIds: messageIds }
      }
    })
    
    return { success: true, messageIds }
  }
}
```

---

## 🎨 UI Components

### 1. Social Media Hub Dashboard
**File:** `app/(dashboard)/social-media-hub/page.tsx`

**Features:**
- Trending searches widget with charts
- AI-generated post previews
- Post scheduling calendar
- Performance metrics dashboard
- Quick actions (generate, publish, schedule)

### 2. Post Generator Interface
**File:** `app/(dashboard)/social-media-hub/generate/page.tsx`

**Features:**
- Select trending search
- Choose platforms (WhatsApp, Instagram, or both)
- Generate multiple variations
- Edit before saving
- Preview for each platform

### 3. Post Library
**File:** `app/(dashboard)/social-media-hub/posts/page.tsx`

**Features:**
- List all posts (draft, scheduled, published)
- Filter by platform, status, date
- Edit drafts
- View performance metrics
- Reschedule or republish

---

## 🔄 API Routes

### Trending Searches
- `GET /api/social-media/trending-searches` - Fetch trending searches for realtor's location
- `POST /api/social-media/trending-searches/refresh` - Manually refresh trending data

### Post Generation
- `POST /api/social-media/posts/generate` - Generate posts from trending search
- `GET /api/social-media/posts` - List all posts
- `GET /api/social-media/posts/[id]` - Get specific post
- `PUT /api/social-media/posts/[id]` - Update post
- `DELETE /api/social-media/posts/[id]` - Delete post

### Publishing
- `POST /api/social-media/posts/[id]/publish` - Publish immediately
- `POST /api/social-media/posts/[id]/schedule` - Schedule for later
- `POST /api/social-media/posts/[id]/cancel` - Cancel scheduled post

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema updates (Prisma migrations)
- [ ] Trending search service with Google Trends integration
- [ ] Basic API routes for trending searches
- [ ] Dashboard UI with trending searches display

### Phase 2: AI Post Generation (Week 3-4)
- [ ] AI post generator service
- [ ] OpenAI integration for content generation
- [ ] Post generation API routes
- [ ] Post generator UI

### Phase 3: Publishing (Week 5-6)
- [ ] Instagram publishing service
- [ ] WhatsApp publishing service
- [ ] Publishing API routes
- [ ] Post library UI with scheduling

### Phase 4: Enhancement (Week 7-8)
- [ ] Performance tracking and analytics
- [ ] Post templates system
- [ ] Automated daily refresh of trending searches
- [ ] Email notifications for trending opportunities

---

## 🔐 Environment Variables

```env
# Google Trends (if using official API, otherwise use npm package)
GOOGLE_TRENDS_API_KEY=...

# OpenAI (already configured)
OPENAI_API_KEY=...

# Instagram/Facebook (if not already set)
META_APP_ID=...
META_APP_SECRET=...
```

---

## 📚 External Libraries

```json
{
  "google-trends-api": "^1.5.0",  // Or use unofficial npm package
  "meta-sdk": "^latest",           // Facebook/Instagram Graph API
  "twilio": "^4.x",                // Already installed
  "recharts": "^2.x"               // For trending charts
}
```

---

## 🎯 Success Metrics

1. **Trending Search Accuracy**: Fresh data refreshed daily
2. **Post Generation Quality**: User approval rate > 80%
3. **Engagement**: Track clicks, views, replies
4. **Website Traffic**: Increase in referral traffic from social posts
5. **Lead Generation**: Track leads generated from social posts

---

## 🚀 Next Steps

1. **Review & Approve**: Review this architecture plan
2. **Choose Data Source**: Confirm Google Trends API or alternative
3. **Design Database**: Finalize Prisma schema additions
4. **Start Phase 1**: Begin with trending search service
5. **Iterate**: Build, test, and refine based on feedback

---

## 💡 Future Enhancements

- **Image Generation**: Use DALL-E or Midjourney for property visuals
- **Video Posts**: Short-form video content generation
- **Multi-language Support**: Generate posts in multiple languages
- **A/B Testing**: Test different post variations
- **Competitor Analysis**: Track competitor social media strategies
- **Sentiment Analysis**: Analyze trending search sentiment
- **Integration with Property Listings**: Auto-create posts for new listings

