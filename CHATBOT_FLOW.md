# Chatbot Widget Flow Documentation

## Overview
The chatbot widget can be used in two scenarios:
1. **Dashboard (Logged-in Users)**: For testing and internal use
2. **External Websites**: Embedded on client's website using API key authentication

## Flow Diagram

### Scenario 1: Dashboard Chatbot (Logged-in User)

```
User logs in → Dashboard loads
    ↓
DashboardWithChatbot wrapper renders FloatingChatWidget
    ↓
FloatingChatWidget initializes:
  - Uses session.user.id as realtorId
  - Calls /api/chatbot/session/internal (no API key needed)
    ↓
Session API:
  - Validates user session
  - Creates/retrieves Session record
  - Creates Lead record (if new session)
    ↓
User sends first message → /api/chatbot/chat/internal
    ↓
Chat API:
  - Validates session
  - Loads context from Realtor/User model
  - Processes with OpenAI
  - Stores message in Lead.messages JSON
  - Returns response
    ↓
Lead is created/updated with conversation data
```

### Scenario 2: External Website Chatbot (API Key)

```
Visitor visits client's website
    ↓
Website loads chatbot widget script
  - Script includes API key in Authorization header
    ↓
FloatingChatWidget initializes:
  - Uses API key from script config
  - Calls /api/chatbot/session (with Bearer token)
    ↓
Session API:
  - Validates API key → finds Realtor
  - Creates/retrieves Session record
  - Creates Lead record (if new session)
    ↓
User sends first message → /api/chatbot/chat (with Bearer token)
    ↓
Chat API:
  - Validates API key and session
  - Loads context from Realtor model
  - Processes with OpenAI
  - Stores message in Lead.messages JSON
  - Returns response
    ↓
Lead is created/updated with conversation data
```

## API Routes

### Internal (Logged-in Users)
- `POST /api/chatbot/session/internal` - Create/resume session (uses NextAuth session)
- `POST /api/chatbot/chat/internal` - Send message (uses NextAuth session)

### External (API Key)
- `POST /api/chatbot/session` - Create/resume session (uses Bearer token)
- `POST /api/chatbot/chat` - Send message (uses Bearer token)

## Lead Creation Logic

When a new chat session starts:
1. Check if Lead exists for this session
2. If not, create Lead with:
   - `source: 'chatbot'`
   - `status: 'new'`
   - `isLeadReady: false`
   - `realtorId` or `userId` (based on client type)
   - `name: 'Anonymous'` (updated when user provides name)
   - `email: ''` (updated when user provides email)
   - `phone: ''` (updated when user provides phone)
   - `message: ''` (initial message from conversation)
   - `messages: []` (JSON array of conversation)

## Data Flow

```
Session (Prisma)
  ├── sessionToken (unique)
  ├── realtorId (for realtors)
  └── expires

Lead (Prisma)
  ├── id
  ├── realtorId (for realtors) OR userId (for business owners)
  ├── source: 'chatbot'
  ├── status: 'new' | 'contacted' | 'qualified' | 'converted'
  ├── isLeadReady: boolean
  ├── messages: JSON (conversation history)
  └── aiSummary: string (extracted profile data)

FloatingChatWidget
  ├── realtorId (required)
  ├── apiKey? (optional, for external websites)
  ├── clientType? ('realtor' | 'business_owner')
  └── Uses sessionId to track conversation
```

## Security

1. **API Key Authentication**: External websites must provide valid API key
2. **Session Validation**: All requests validate session belongs to correct realtor/user
3. **CORS**: Configured for external domains
4. **Rate Limiting**: Per session/IP (to be implemented)
5. **Topic Enforcement**: Chatbot only discusses relevant topics (to be implemented)

