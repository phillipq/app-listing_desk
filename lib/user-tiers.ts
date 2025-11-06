export enum UserTier {
  STARTER = 'starter',
  REALTOR_PRO = 'realtor_pro',
  ALL_IN_ONE_SOCIAL = 'all_in_one_social',
  AGENCY = 'agency'
}

export interface TierFeatures {
  channels: string[]
  monthlyPrice: number
  maxAgents?: number
  apiAccess: boolean
  analytics: boolean
  aiSummaries: boolean
  voiceCallRouting: boolean
}

export const TIER_CONFIG: Record<UserTier, TierFeatures> = {
  [UserTier.STARTER]: {
    channels: ['web_chat', 'sms'],
    monthlyPrice: 39,
    maxAgents: 1,
    apiAccess: false,
    analytics: false,
    aiSummaries: false,
    voiceCallRouting: false
  },
  [UserTier.REALTOR_PRO]: {
    channels: ['web_chat', 'sms', 'whatsapp', 'voicemail'],
    monthlyPrice: 99,
    maxAgents: 1,
    apiAccess: false,
    analytics: true,
    aiSummaries: true,
    voiceCallRouting: false
  },
  [UserTier.ALL_IN_ONE_SOCIAL]: {
    channels: ['web_chat', 'sms', 'whatsapp', 'voicemail', 'instagram', 'voice_calls'],
    monthlyPrice: 149,
    maxAgents: 3,
    apiAccess: false,
    analytics: true,
    aiSummaries: true,
    voiceCallRouting: true
  },
  [UserTier.AGENCY]: {
    channels: ['web_chat', 'sms', 'whatsapp', 'voicemail', 'instagram', 'voice_calls'],
    monthlyPrice: 249,
    maxAgents: 10,
    apiAccess: true,
    analytics: true,
    aiSummaries: true,
    voiceCallRouting: true
  }
}

export interface User {
  id: string
  email: string
  name: string
  tier: UserTier
  role: 'realtor' | 'business_owner' | 'admin'
  subscriptionStatus: 'active' | 'inactive' | 'trial'
  features: string[]
  createdAt: Date
  updatedAt: Date
}

export function getUserFeatures(user: User): string[] {
  const tierFeatures = TIER_CONFIG[user.tier]
  const baseFeatures = [...tierFeatures.channels]
  
  if (tierFeatures.analytics) baseFeatures.push('analytics')
  if (tierFeatures.aiSummaries) baseFeatures.push('ai_summaries')
  if (tierFeatures.voiceCallRouting) baseFeatures.push('voice_routing')
  if (tierFeatures.apiAccess) baseFeatures.push('api_access')
  
  return baseFeatures
}

export function hasFeature(user: User, feature: string): boolean {
  return getUserFeatures(user).includes(feature)
}
