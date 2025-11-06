export enum CommunicationChannel {
  WEB_CHAT = 'web_chat',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  VOICEMAIL = 'voicemail',
  INSTAGRAM = 'instagram',
  VOICE_CALLS = 'voice_calls'
}

export interface ChannelConfig {
  name: string
  incomingRoute: string
  outgoingMethod: string
  tech: string
  webhookPath: string
  requiresAuth: boolean
}

export const CHANNEL_CONFIG: Record<CommunicationChannel, ChannelConfig> = {
  [CommunicationChannel.WEB_CHAT]: {
    name: 'Web Chat',
    incomingRoute: '/api/webhooks/web-chat',
    outgoingMethod: 'WebSocket',
    tech: 'Next.js WebSocket',
    webhookPath: '/api/webhooks/web-chat',
    requiresAuth: false
  },
  [CommunicationChannel.SMS]: {
    name: 'SMS/MMS',
    incomingRoute: '/api/webhooks/twilio-sms',
    outgoingMethod: 'Twilio Messages API',
    tech: 'Twilio',
    webhookPath: '/api/webhooks/twilio-sms',
    requiresAuth: true
  },
  [CommunicationChannel.WHATSAPP]: {
    name: 'WhatsApp',
    incomingRoute: '/api/webhooks/twilio-whatsapp',
    outgoingMethod: 'Twilio Messages API',
    tech: 'Twilio',
    webhookPath: '/api/webhooks/twilio-whatsapp',
    requiresAuth: true
  },
  [CommunicationChannel.VOICEMAIL]: {
    name: 'Voicemail',
    incomingRoute: '/api/webhooks/twilio-voice',
    outgoingMethod: 'Twilio Voice API',
    tech: 'Twilio',
    webhookPath: '/api/webhooks/twilio-voice',
    requiresAuth: true
  },
  [CommunicationChannel.INSTAGRAM]: {
    name: 'Instagram DMs',
    incomingRoute: '/api/webhooks/instagram',
    outgoingMethod: 'Meta Graph API',
    tech: 'Meta',
    webhookPath: '/api/webhooks/instagram',
    requiresAuth: true
  },
  [CommunicationChannel.VOICE_CALLS]: {
    name: 'Voice Calls',
    incomingRoute: '/api/webhooks/twilio-voice-calls',
    outgoingMethod: 'Twilio Voice API',
    tech: 'Twilio',
    webhookPath: '/api/webhooks/twilio-voice-calls',
    requiresAuth: true
  }
}

export interface Message {
  id: string
  channel: CommunicationChannel
  from: string
  to: string
  content: string
  timestamp: Date
  isIncoming: boolean
  leadId?: string
  userId: string
  metadata?: Record<string, unknown>
}

export interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  source: CommunicationChannel
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  userId: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}
