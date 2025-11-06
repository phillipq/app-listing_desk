import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface NotificationData {
  type: 'message_requires_human' | 'new_lead' | 'conversation_escalated'
  messageId: string
  conversationId: string
  leadId: string
  content: string
  platform: 'whatsapp' | 'instagram' | 'sms' | 'voicemail'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: Record<string, unknown>
}

export class NotificationService {
  private static instance: NotificationService

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async notifyRealtor(notificationData: NotificationData) {
    try {
      // Get the lead to find the assigned realtor
      const lead = await prisma.lead.findUnique({
        where: { id: notificationData.leadId },
        include: {
          realtor: true,
          user: true
        }
      })

      if (!lead) {
        console.error('Lead not found for notification:', notificationData.leadId)
        return
      }

      // Determine who to notify
      const realtorId = lead.realtorId || lead.userId
      if (!realtorId) {
        console.error('No realtor assigned to lead:', notificationData.leadId)
        return
      }

      // Create notification record
      await prisma.notification.create({
        data: {
          userId: realtorId,
          type: notificationData.type,
          title: this.getNotificationTitle(notificationData.type),
          message: this.getNotificationMessage(notificationData),
          data: notificationData as unknown as Prisma.InputJsonValue,
          isRead: false,
          priority: notificationData.priority
        }
      })

      // Send real-time notification (WebSocket, push notification, etc.)
      await this.sendRealtimeNotification(realtorId, notificationData)

      // Send email notification for high priority items
      if (notificationData.priority === 'high' || notificationData.priority === 'urgent') {
        await this.sendEmailNotification(realtorId, notificationData)
      }

      console.log(`Notification sent to realtor ${realtorId} for message ${notificationData.messageId}`)
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'message_requires_human':
        return 'New Message Requires Your Attention'
      case 'new_lead':
        return 'New Lead Generated'
      case 'conversation_escalated':
        return 'Conversation Escalated'
      default:
        return 'New Notification'
    }
  }

  private getNotificationMessage(data: NotificationData): string {
    const platform = data.platform.charAt(0).toUpperCase() + data.platform.slice(1)
    const content = data.content.length > 100 
      ? data.content.substring(0, 100) + '...' 
      : data.content

    switch (data.type) {
      case 'message_requires_human':
        return `New ${platform} message: "${content}"`
      case 'new_lead':
        return `New qualified lead from ${platform}: "${content}"`
      case 'conversation_escalated':
        return `Conversation escalated on ${platform}: "${content}"`
      default:
        return `New ${platform} activity: "${content}"`
    }
  }

  private async sendRealtimeNotification(userId: string, data: NotificationData) {
    // TODO: Implement WebSocket or push notification
    // For now, just log
    console.log(`Realtime notification for user ${userId}:`, data)
  }

  private async sendEmailNotification(userId: string, data: NotificationData) {
    // TODO: Implement email notification
    // For now, just log
    console.log(`Email notification for user ${userId}:`, data)
  }

  async getNotificationsForUser(userId: string, limit: number = 50) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return notifications
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  async markAsRead(notificationId: string) {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }
}

export const notificationService = NotificationService.getInstance()
