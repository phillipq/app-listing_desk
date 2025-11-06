import { prisma } from '@/lib/prisma'

export class InstagramService {
  private static instance: InstagramService

  static getInstance(): InstagramService {
    if (!InstagramService.instance) {
      InstagramService.instance = new InstagramService()
    }
    return InstagramService.instance
  }

  // Instagram Basic Display API methods
  async getAccessToken(code: string, redirectUri: string): Promise<string> {
    try {
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_APP_ID!,
          client_secret: process.env.INSTAGRAM_APP_SECRET!,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code
        })
      })

      const data = await response.json() as { access_token: string }
      return data.access_token
    } catch (error) {
      console.error('Error getting Instagram access token:', error)
      throw error
    }
  }

  async getLongLivedToken(shortLivedToken: string): Promise<string> {
    try {
      const response = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`)
      const data = await response.json() as { access_token: string }
      return data.access_token
    } catch (error) {
      console.error('Error getting long-lived token:', error)
      throw error
    }
  }

  async refreshToken(accessToken: string): Promise<string> {
    try {
      const response = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`)
      const data = await response.json() as { access_token: string }
      return data.access_token
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw error
    }
  }

  // Instagram Graph API methods for messaging
  async sendMessage(accessToken: string, recipientId: string, message: string): Promise<{ id: string }> {
    try {
      const response = await fetch(`https://graph.instagram.com/v18.0/me/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message }
        })
      })

      const data = await response.json() as { id: string }
      return data
    } catch (error) {
      console.error('Error sending Instagram message:', error)
      throw error
    }
  }

  async sendMediaMessage(accessToken: string, recipientId: string, mediaUrl: string, _caption?: string): Promise<{ id: string }> {
    try {
      const response = await fetch(`https://graph.instagram.com/v18.0/me/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'image',
              payload: {
                url: mediaUrl
              }
            }
          }
        })
      })

      const data = await response.json() as { id: string }
      return data
    } catch (error) {
      console.error('Error sending Instagram media message:', error)
      throw error
    }
  }

  async getConversations(accessToken: string): Promise<{ id: string; participants: { id: string; name?: string }[]; updated_time: string }[]> {
    try {
      const response = await fetch(`https://graph.instagram.com/v18.0/me/conversations?fields=participants,updated_time`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await response.json() as { data: any[] }
      return data.data || []
    } catch (error) {
      console.error('Error getting Instagram conversations:', error)
      throw error
    }
  }

  async getMessages(accessToken: string, conversationId: string): Promise<{ id: string; from: { id: string }; to: { id: string }; message: { text: string; attachments?: { image_data?: { url: string } }[] }; created_time: string }[]> {
    try {
      const response = await fetch(`https://graph.instagram.com/v18.0/${conversationId}/messages?fields=from,to,message,created_time,attachments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await response.json() as { data: any[] }
      return data.data || []
    } catch (error) {
      console.error('Error getting Instagram messages:', error)
      throw error
    }
  }

  // Webhook verification for Instagram
  verifyWebhook(mode: string, verifyToken: string, challenge: string): string | null {
    if (mode === 'subscribe' && verifyToken === process.env.INSTAGRAM_VERIFY_TOKEN) {
      return challenge
    }
    return null
  }

  // Process incoming Instagram message
  async processIncomingMessage(messageData: { from: { id: string }; message?: { text: string; attachments?: { image_data?: { url: string } }[] }; to?: { id: string }; created_time: string; id: string }, accessToken: string) {
    try {
      const senderId = messageData.from.id
      const messageContent = messageData.message?.text || 'Media message'
      const timestamp = new Date(parseInt(messageData.created_time) * 1000)
      const messageId = messageData.id

      // Find or create lead
      let lead = await prisma.lead.findFirst({
        where: {
          OR: [
            { email: senderId },
            { phone: senderId }
          ]
        }
      })

      if (!lead) {
        // Create new lead from Instagram message
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lead = await (prisma as any).lead.create({
          data: {
            name: 'Instagram User', // Will be updated when user provides name
            email: senderId,
            phone: null,
            message: 'Instagram message received'
          }
        })
      }

      // Find or create communication channel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let channel = await (prisma as any).communicationChannel.findFirst({
        where: {
          type: 'instagram',
          config: {
            path: ['instagramId'],
            equals: senderId
          }
        }
      })

      if (!channel) {
        // Create Instagram channel for this user
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        channel = await (prisma as any).communicationChannel.create({
          data: {
            name: `Instagram ${senderId}`,
            type: 'instagram',
            isActive: true,
            config: {
              instagramId: senderId,
              accessToken: accessToken
            },
            userId: 'system' // Will be updated when user is assigned
          }
        })
      }

      // Find or create conversation
      if (!lead) {
        throw new Error('Failed to create or find lead')
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let conversation = await (prisma as any).conversation.findFirst({
        where: {
          leadId: lead.id,
          channelId: channel.id
        }
      })

      if (!conversation) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conversation = await (prisma as any).conversation.create({
          data: {
            leadId: lead.id,
            channelId: channel.id,
            status: 'active',
            lastMessageAt: timestamp
          }
        })
      }

      // Create message record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).message.create({
        data: {
          channelId: channel.id,
          conversationId: conversation.id,
          from: senderId,
          to: messageData.to?.id || 'unknown',
          content: messageContent,
          timestamp: timestamp,
          isIncoming: true,
          leadId: lead.id,
          userId: 'system',
          metadata: {
            type: 'instagram',
            messageId: messageId,
            messageType: messageData.message?.attachments ? 'media' : 'text',
            mediaUrl: messageData.message?.attachments?.[0]?.image_data?.url || null
          }
        }
      })

      // Update conversation last message time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: timestamp,
          status: 'active'
        }
      })

      // Update lead timestamp
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          updatedAt: timestamp
        }
      })

      return { lead, conversation, message: messageData }

    } catch (error) {
      console.error('Error processing Instagram message:', error)
      throw error
    }
  }
}

export const instagramService = InstagramService.getInstance()
