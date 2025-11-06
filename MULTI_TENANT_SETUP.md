# 🏢 Multi-Tenant Architecture Setup

## Current Status: ❌ NOT READY FOR MULTIPLE CLIENTS

Our current setup has **critical issues** that prevent proper multi-tenant support. Here's what needs to be fixed:

## 🚨 **Critical Issues**

### 1. **Shared Webhook Endpoints**
- **Problem**: All clients use the same webhook URLs
- **Impact**: Messages from different clients get mixed up
- **Fix Needed**: Dynamic webhook routing based on Twilio subaccount

### 2. **No User Identification in Webhooks**
- **Problem**: Webhooks can't identify which client sent the message
- **Impact**: Messages get assigned to wrong users
- **Fix Needed**: Route messages by Twilio subaccount SID

### 3. **Single Twilio Account**
- **Problem**: All clients share the same Twilio credentials
- **Impact**: Billing and data isolation issues
- **Fix Needed**: Each client needs their own Twilio subaccount

## 🔧 **Required Fixes**

### Fix 1: Update Webhook Routing

**Current (Broken):**
```typescript
// All clients use same webhook
const channel = await prisma.communicationChannel.findFirst({
  where: {
    type: 'whatsapp',
    config: {
      path: ['phoneNumber'],
      equals: toNumber
    }
  }
})
```

**Fixed (Multi-Tenant):**
```typescript
// Route by Twilio subaccount SID
const channel = await prisma.communicationChannel.findFirst({
  where: {
    type: 'whatsapp',
    config: {
      path: ['accountSid'],
      equals: body.AccountSid // Twilio subaccount SID
    }
  }
})
```

### Fix 2: Update Twilio Service

**Current (Single Account):**
```typescript
const client = twilio(accountSid, authToken) // Shared credentials
```

**Fixed (Per-Client):**
```typescript
// Each client gets their own subclient
const subclient = twilio(subaccountSid, subaccountAuthToken)
```

### Fix 3: Webhook Configuration

**Current (Shared):**
```typescript
// All clients use same webhook URL
const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp`
```

**Fixed (Dynamic):**
```typescript
// Each subclient gets unique webhook with subaccount ID
const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/whatsapp?account=${subaccountSid}`
```

## 🏗️ **Proper Multi-Tenant Architecture**

### Database Schema (Already Correct)
```sql
-- Each user has their own data
User {
  id: String (unique per user)
  communicationChannels: CommunicationChannel[]
  leads: Lead[]
  messages: Message[]
}

-- Each channel belongs to one user
CommunicationChannel {
  id: String
  userId: String (foreign key)
  type: String
  config: Json (contains Twilio subaccount info)
}
```

### Twilio Subclient Structure
```typescript
// Each client gets their own Twilio subaccount
interface TwilioSubclient {
  accountSid: string      // Unique per client
  authToken: string       // Unique per client
  phoneNumber: string     // Unique per client
  webhookUrl: string      // Unique per client
}
```

### Webhook Routing Flow
```
1. Message arrives at webhook
2. Extract Twilio Account SID from webhook payload
3. Find CommunicationChannel by Account SID
4. Route message to correct user's data
5. Process with user-specific AI and settings
```

## 🚀 **Implementation Steps**

### Step 1: Update Webhook Handlers
- [ ] Modify WhatsApp webhook to route by Account SID
- [ ] Modify SMS webhook to route by Account SID  
- [ ] Modify Voicemail webhook to route by Account SID
- [ ] Add error handling for unknown subaccounts

### Step 2: Update Twilio Service
- [ ] Ensure each client gets unique subaccount
- [ ] Store subaccount credentials in channel config
- [ ] Configure webhooks with subaccount-specific URLs

### Step 3: Update Channel Creation
- [ ] Store Twilio subaccount SID in channel config
- [ ] Configure webhooks with subaccount context
- [ ] Test message routing for each client

### Step 4: Add Security
- [ ] Validate webhook signatures
- [ ] Add rate limiting per subaccount
- [ ] Implement proper error handling

## 🧪 **Testing Multi-Tenant Setup**

### Test Scenario 1: Two Clients
1. **Client A** connects WhatsApp → Gets subaccount A
2. **Client B** connects WhatsApp → Gets subaccount B
3. **Send message to Client A's number** → Should route to Client A
4. **Send message to Client B's number** → Should route to Client B

### Test Scenario 2: Data Isolation
1. **Client A** creates leads → Only visible to Client A
2. **Client B** creates leads → Only visible to Client B
3. **No cross-contamination** between clients

## ⚠️ **Current Status: NOT PRODUCTION READY**

**DO NOT** deploy this for multiple clients until these fixes are implemented. The current setup will cause:

- ❌ Messages routed to wrong clients
- ❌ Data leakage between clients  
- ❌ Billing confusion
- ❌ Security vulnerabilities

## 🎯 **Next Steps**

1. **Fix webhook routing** (Priority 1)
2. **Test with multiple clients** (Priority 2)
3. **Add security measures** (Priority 3)
4. **Deploy to production** (Priority 4)

## 📞 **Support for Multiple Clients**

Once fixed, the system will support:

✅ **Unlimited clients** - Each gets their own Twilio subaccount  
✅ **Complete data isolation** - No cross-contamination  
✅ **Individual billing** - Each client pays for their usage  
✅ **Scalable architecture** - Add clients without affecting others  
✅ **Secure webhooks** - Messages routed to correct client  

**Estimated time to fix**: 2-3 hours of development work.
