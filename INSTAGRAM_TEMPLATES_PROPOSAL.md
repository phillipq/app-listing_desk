# Instagram Post Templates Feature - Architecture Proposal

## Overview
Create AI-powered Instagram post templates that automatically use trending search data to generate engaging, relevant content for realtors.

## Key Features

### 1. **Template System**
- **Pre-built Templates**: Common real estate post types
  - Market update posts
  - Property highlights
  - Neighborhood spotlights
  - Tip/educational content
  - Community events
  - Trending topic posts (from RSS feed)

### 2. **Trend Integration**
- Automatically pull from:
  - Custom search terms (when working)
  - RSS trending topics (currently working)
  - Overall trending searches
- Template variables:
  - `{{trending_topic}}` - Current trending topic
  - `{{traffic_estimate}}` - Search volume (200+, 1000+, etc.)
  - `{{location}}` - User's location
  - `{{date}}` - Current date
  - `{{hashtags}}` - Auto-generated relevant hashtags

### 3. **AI Content Generation**
- Use OpenAI/Claude to:
  - Generate engaging captions from trending topics
  - Create relevant hashtags
  - Suggest post timing
  - Personalize content to user's brand voice

### 4. **Template Builder**
- Visual template editor
- Customizable sections:
  - Caption/text
  - Hashtags
  - Call-to-action
  - Image suggestions
- Save custom templates

### 5. **Publishing Options**
- Preview before posting
- Schedule posts
- Direct publish to Instagram
- Save as draft

## Database Schema

```prisma
model InstagramTemplate {
  id          String   @id @default(cuid())
  name        String
  category    String   // "market_update", "property_highlight", "trending_topic", etc.
  caption     String   // Template with variables like {{trending_topic}}
  hashtags    String[] // Default hashtags
  cta         String?  // Call-to-action text
  imagePrompt String?  // AI prompt for image suggestions
  isActive    Boolean  @default(true)
  realtorId   String
  realtor     Realtor  @relation(fields: [realtorId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([realtorId, isActive])
}

model InstagramPost {
  id              String    @id @default(cuid())
  templateId      String?
  template        InstagramTemplate? @relation(fields: [templateId], references: [id])
  caption         String
  hashtags        String[]
  imageUrl        String?
  imagePrompt     String?
  status          String    // "draft", "scheduled", "published", "failed"
  scheduledAt     DateTime?
  publishedAt     DateTime?
  instagramPostId String?   // Instagram's post ID after publishing
  metrics         Json?     // Engagement metrics
  realtorId       String
  realtor         Realtor   @relation(fields: [realtorId], references: [id], onDelete: Cascade)
  trendingTopic   String?   // Which trending topic was used
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([realtorId, status])
  @@index([scheduledAt])
}
```

## Implementation Steps

### Phase 1: Basic Template System
1. Create database models
2. Add "Post Templates" tab to Social Media Hub
3. Create template selection UI
4. Template preview functionality

### Phase 2: Trend Integration
1. Connect RSS trending topics to templates
2. Variable substitution ({{trending_topic}}, etc.)
3. Auto-generate hashtags from trends

### Phase 3: AI Content Generation
1. Integrate OpenAI for caption generation
2. Smart hashtag suggestions
3. Content personalization

### Phase 4: Publishing
1. Instagram API integration for posting
2. Scheduling system
3. Draft management

## Example Templates

### 1. Trending Topic Template
```
🔥 {{trending_topic}} is trending with {{traffic_estimate}} searches!

As a realtor in {{location}}, I'm seeing increased interest in this topic. 
Want to know how it affects your property search? DM me!

{{cta}}

{{hashtags}}
```

### 2. Market Update Template
```
📊 Real Estate Market Update for {{location}}

{{trending_topic}} is showing {{trend_direction}} interest this month.

Key insights:
• Search volume: {{traffic_estimate}}
• Trend direction: {{trend_direction}}

Ready to explore properties? Let's chat!

{{hashtags}}
```

### 3. Property Highlight Template
```
✨ Featured Property in {{location}}

Based on trending searches like "{{trending_topic}}", here's what buyers are looking for:

[Property details]

Interested? Link in bio!

{{hashtags}}
```

## UI Flow

1. **Template Selection**
   - Grid of template cards
   - Filter by category
   - Preview button

2. **Template Editor**
   - Left: Template preview
   - Right: Trending data available
   - Bottom: Customization options
   - Generate button (AI)

3. **Publishing**
   - Preview final post
   - Choose: Draft, Schedule, or Publish Now
   - Instagram connection status

## API Endpoints Needed

- `GET /api/social-media/templates` - List templates
- `POST /api/social-media/templates` - Create template
- `PUT /api/social-media/templates/[id]` - Update template
- `POST /api/social-media/templates/[id]/generate` - Generate content from template + trends
- `POST /api/social-media/posts` - Create/schedule post
- `POST /api/social-media/posts/[id]/publish` - Publish to Instagram

