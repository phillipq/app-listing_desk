# Chatbot Widget Implementation Plan

## Summary of Requirements

### 1. Widget-Based Chatbot
- **Current State**: Full-page chatbot exists at `/chatbot`
- **Target State**: Floating widget in bottom corner (bottom-right or bottom-left)
- **Component**: `FloatingChatWidget.tsx` already exists but needs enhancement

### 2. Multi-Client Type Support
- **Realtors**: Use `Realtor` model (existing)
- **Business Owners**: Use `User` model with `role='business_owner'` (existing)
- **Default Behaviors**: Each client type needs distinct default chatbot personality and prompts
- **Customization**: Users can add additional context beyond defaults

### 3. Setup & Configuration
- **Location**: Setup Center → Settings Tab
- **Current**: "Chatbot Context" section exists with:
  - Community/Area
  - Service Area
  - Specialties
  - Bio
- **Enhancement Needed**: Add "Additional Context" field for custom chatbot instructions

### 4. Deployment Guide
- **New Tab**: "Chatbot Deployment" tab in Setup Center
- **Content**: Step-by-step instructions for embedding widget on external websites
- **Include**: 
  - Embed code snippets
  - Configuration options
  - API key setup
  - Customization options (colors, position)

### 5. Security & Topic Enforcement
- **Problem**: Users may try to ask off-topic questions
- **Solution**: Implement strict topic boundaries in chatbot API
- **Requirements**:
  - For Realtors: Only real estate, properties, neighborhoods, market info
  - For Business Owners: Only business services, appointments, products
  - Polite redirection for off-topic questions
  - Rate limiting to prevent abuse

---

## Implementation Game Plan

### Phase 1: Database Schema Updates

#### 1.1 Update Prisma Schema
**File**: `prisma/schema.prisma`

Add to `Realtor` model:
```prisma
chatbotContext     Json?  // Store chatbot context and custom instructions
chatbotEnabled     Boolean @default(true)
chatbotWidgetConfig Json?  // Widget customization (colors, position, etc.)
```

Add to `User` model:
```prisma
chatbotContext     Json?  // Store chatbot context and custom instructions
chatbotEnabled     Boolean @default(true)
chatbotWidgetConfig Json?  // Widget customization (colors, position, etc.)
```

**Migration**: Create and run Prisma migration

---

### Phase 2: Settings Page Enhancement

#### 2.1 Update Settings Page
**File**: `app/dashboard/settings/page.tsx`

**Changes**:
1. Add "Additional Context" textarea field in Chatbot Context section
2. Update form data structure to include:
   - `chatbotContext.additionalContext` (new field)
   - `chatbotContext.community` (existing)
   - `chatbotContext.area` (existing)
   - `chatbotContext.specialties` (existing)
   - `chatbotContext.bio` (existing)
3. Add widget customization section:
   - Primary color picker
   - Position selector (bottom-right / bottom-left)
   - Enable/disable toggle

#### 2.2 Update API Endpoint
**File**: `app/api/realtor/profile/route.ts` (PUT handler)

**Changes**:
- Save `chatbotContext` as JSON to database
- Save `chatbotWidgetConfig` as JSON
- Save `chatbotEnabled` boolean

---

### Phase 3: Chatbot Deployment Tab

#### 3.1 Create Deployment Guide Component
**File**: `components/setup/ChatbotDeploymentWrapper.tsx` (new)

**Content**:
1. **Overview Section**
   - What the chatbot widget does
   - Benefits for lead generation

2. **Quick Start**
   - Step 1: Copy your API key
   - Step 2: Choose embed method (React component or script tag)
   - Step 3: Customize appearance
   - Step 4: Test on your site

3. **Embed Code Examples**
   - React component example
   - Vanilla JavaScript embed script
   - WordPress plugin instructions (optional)

4. **Configuration Options**
   - API key usage
   - Widget positioning
   - Color customization
   - Custom welcome messages

5. **Troubleshooting**
   - Common issues and solutions
   - Support contact

#### 3.2 Add Tab to Setup Center
**File**: `app/(dashboard)/setup/page.tsx`

**Changes**:
- Add `'chatbot-deployment'` to tabs array
- Add case in `renderTabContent()` switch statement
- Import and use `ChatbotDeploymentWrapper`

---

### Phase 4: Enhanced FloatingChatWidget

#### 4.1 Update Component Props
**File**: `components/FloatingChatWidget.tsx`

**Changes**:
1. Support both `realtorId` and `userId` props
2. Add `clientType: 'realtor' | 'business_owner'` prop
3. Add widget config props:
   - `primaryColor`
   - `position`
   - `customWelcomeMessage?`

#### 4.2 Make Widget Embeddable
**File**: `public/chatbot-widget.js` (new - embeddable script)

**Purpose**: Create a standalone script that can be embedded on external websites

**Features**:
- Load React widget dynamically
- Accept configuration via data attributes or script params
- Handle API key authentication
- Support CORS for external domains

---

### Phase 5: Security & Topic Enforcement

#### 5.1 Update Chatbot API
**File**: `app/api/chatbot/chat/route.ts`

**Enhancements**:

1. **Load Context from Database**
   - Fetch `chatbotContext` from Realtor or User model
   - Build system prompt with context
   - Include default behaviors based on client type

2. **Topic Boundary Enforcement**
   - Add system prompt rules:
     ```
     CRITICAL: You MUST only discuss topics related to [CLIENT_TYPE].
     - For Realtors: Only real estate, properties, neighborhoods, market trends, home buying/selling
     - For Business Owners: Only [business services], appointments, products, pricing
     
     If asked about anything else, politely redirect:
     "I'm here to help with [CLIENT_TYPE] questions. How can I assist you with that?"
     ```

3. **Rate Limiting**
   - Implement per-session rate limiting
   - Track message count per session
   - Block excessive requests

4. **Content Filtering**
   - Check for inappropriate content
   - Block spam patterns
   - Log suspicious activity

#### 5.2 Create Topic Detection Utility
**File**: `lib/chatbot-security.ts` (new)

**Functions**:
- `isOnTopic(message: string, clientType: 'realtor' | 'business_owner'): boolean`
- `detectOffTopicAttempt(message: string): { isOffTopic: boolean; category?: string }`
- `sanitizeInput(message: string): string`

---

### Phase 6: Default Behaviors

#### 6.1 Create Default Prompts
**File**: `lib/chatbot-defaults.ts` (new)

**Content**:

**For Realtors**:
```typescript
export const REALTOR_DEFAULT_PROMPT = `
You are a friendly real estate assistant for [REALTOR_NAME]. 
Your goal is to help potential clients find their perfect home.

FOCUS AREAS:
- Property search and listings
- Neighborhood information
- Market trends and pricing
- Home buying/selling process
- Local amenities and schools

PERSONALITY: Warm, knowledgeable, helpful
```

**For Business Owners**:
```typescript
export const BUSINESS_DEFAULT_PROMPT = `
You are a friendly assistant for [BUSINESS_NAME].
Your goal is to help potential customers learn about services and book appointments.

FOCUS AREAS:
- Service offerings
- Pricing and packages
- Appointment scheduling
- Business hours and location
- Customer inquiries

PERSONALITY: Professional, helpful, solution-oriented
```

#### 6.2 Context Builder
**File**: `lib/chatbot-context-builder.ts` (new)

**Function**: `buildChatbotContext(clientType, customContext, defaultPrompt)`
- Merges default prompts with custom context
- Formats for OpenAI system message
- Handles missing fields gracefully

---

### Phase 7: API Endpoints

#### 7.1 Widget Configuration API
**File**: `app/api/chatbot/config/route.ts` (new)

**GET**: Fetch widget configuration for public embedding
- Accept API key in header
- Return widget config (colors, position, welcome message)
- Return client type (realtor/business)

#### 7.2 Public Chat API
**File**: `app/api/chatbot/public/chat/route.ts` (new)

**POST**: Handle chat messages from embedded widgets
- Authenticate via API key
- Load context from database
- Enforce topic boundaries
- Return responses

---

### Phase 8: Testing & Documentation

#### 8.1 Testing Checklist
- [ ] Widget renders correctly on external site
- [ ] Topic enforcement works for both client types
- [ ] Custom context is applied correctly
- [ ] Rate limiting prevents abuse
- [ ] Off-topic questions are redirected
- [ ] Settings page saves configuration
- [ ] Deployment guide is clear and complete

#### 8.2 Documentation
- Update README with chatbot widget section
- Create user guide for setting up chatbot
- Document API endpoints
- Create troubleshooting guide

---

## File Structure

```
app/
├── api/
│   ├── chatbot/
│   │   ├── chat/route.ts (update)
│   │   ├── config/route.ts (new)
│   │   └── public/chat/route.ts (new)
│   └── realtor/profile/route.ts (update)
├── (dashboard)/
│   └── setup/
│       └── page.tsx (update - add tab)
└── dashboard/
    └── settings/
        └── page.tsx (update - enhance chatbot section)

components/
├── FloatingChatWidget.tsx (update)
└── setup/
    └── ChatbotDeploymentWrapper.tsx (new)

lib/
├── chatbot-security.ts (new)
├── chatbot-defaults.ts (new)
└── chatbot-context-builder.ts (new)

public/
└── chatbot-widget.js (new - embeddable script)

prisma/
└── schema.prisma (update)
```

---

## Implementation Order

1. **Phase 1**: Database schema updates (foundation)
2. **Phase 2**: Settings page enhancement (user can configure)
3. **Phase 6**: Default behaviors (needed for Phase 5)
4. **Phase 5**: Security & topic enforcement (core functionality)
5. **Phase 4**: Enhanced widget (user-facing component)
6. **Phase 3**: Deployment guide (user documentation)
7. **Phase 7**: API endpoints (support embedding)
8. **Phase 8**: Testing & documentation (polish)

---

## Key Considerations

### Security
- API key authentication for embedded widgets
- CORS configuration for external domains
- Rate limiting per session/IP
- Input sanitization
- Topic boundary enforcement

### User Experience
- Easy setup process
- Clear deployment instructions
- Customizable appearance
- Responsive design
- Mobile-friendly widget

### Performance
- Lazy load widget on external sites
- Minimize bundle size
- Cache widget configuration
- Optimize API responses

### Scalability
- Support multiple concurrent sessions
- Efficient database queries
- Proper indexing on chatbot fields
- Monitor API usage

---

## Success Metrics

- Widget successfully embedded on external websites
- Topic enforcement prevents off-topic conversations (>95% compliance)
- Lead generation increases from chatbot interactions
- User satisfaction with customization options
- Low support requests related to deployment

