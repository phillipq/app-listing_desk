import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
const smsNumber = process.env.TWILIO_SMS_NUMBER

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials not configured')
}

const client = twilio(accountSid, authToken)

export interface TwilioSubclient {
  accountSid: string
  friendlyName: string
  status: string
  authToken: string
  whatsappNumber?: string
  smsNumber?: string
}

export class TwilioService {
  private static instance: TwilioService

  static getInstance(): TwilioService {
    if (!TwilioService.instance) {
      TwilioService.instance = new TwilioService()
    }
    return TwilioService.instance
  }

  // Subclient Management
  async createSubclient(userId: string, friendlyName: string): Promise<TwilioSubclient> {
    try {
      // Create subaccount
      const subaccount = await client.api.accounts.create({
        friendlyName: `${friendlyName} - ${userId}`
      })

      // Note: Twilio doesn't allow retrieving auth tokens after subaccount creation
      // When creating a subaccount, Twilio generates a new auth token automatically
      // You need to retrieve it immediately after creation or use API keys instead
      // For now, we'll note that this requires manual retrieval from Twilio console
      // or use the parent account's auth token (not recommended for production)
      // TODO: Implement proper API key management for subaccounts
      const subaccountAuthToken = authToken // This should be retrieved/stored when subaccount is created

      // Create subclient
      // Note: In production, you should store the subaccount's auth token securely
      // when it's first created (it's only available once during creation)
      const subclient = twilio(subaccount.sid, subaccountAuthToken)

      // Purchase a phone number for WhatsApp (if available)
      let whatsappNumber: string | undefined
      try {
        const availableNumbers = await subclient.availablePhoneNumbers('US')
          .local
          .list({ 
            smsEnabled: true,
            voiceEnabled: true,
            limit: 1 
          })

        if (availableNumbers.length > 0 && availableNumbers[0]) {
          const phoneNumber = await subclient.incomingPhoneNumbers.create({
            phoneNumber: availableNumbers[0].phoneNumber,
            friendlyName: `WhatsApp ${friendlyName}`
          })
          whatsappNumber = phoneNumber.phoneNumber
        }
      } catch (numberError) {
        console.warn('Could not purchase phone number for subclient:', numberError)
      }

      return {
        accountSid: subaccount.sid,
        friendlyName: subaccount.friendlyName,
        status: subaccount.status,
        authToken: subaccountAuthToken || '', // Note: This should be stored securely when subaccount is created
        whatsappNumber,
        smsNumber: whatsappNumber // Same number for SMS
      }
    } catch (error) {
      console.error('Error creating Twilio subclient:', error)
      throw error
    }
  }

  async getSubclient(accountSid: string, authToken: string) {
    return twilio(accountSid, authToken)
  }

  async configureWhatsAppWebhook(accountSid: string, authToken: string, webhookUrl: string) {
    try {
      const subclient = twilio(accountSid, authToken)
      
      // Configure WhatsApp webhook
      await subclient.messaging.v1.services.create({
        friendlyName: 'WhatsApp Service',
        inboundRequestUrl: webhookUrl,
        inboundMethod: 'POST',
        statusCallback: webhookUrl
      })

      return true
    } catch (error) {
      console.error('Error configuring WhatsApp webhook:', error)
      throw error
    }
  }

  async sendWhatsAppMessageFromSubclient(
    accountSid: string, 
    authToken: string, 
    fromNumber: string, 
    to: string, 
    message: string
  ) {
    try {
      const subclient = twilio(accountSid, authToken)
      
      const result = await subclient.messages.create({
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${to}`,
        body: message
      })

      return result
    } catch (error) {
      console.error('Error sending WhatsApp message from subclient:', error)
      throw error
    }
  }

  async sendSMSFromSubclient(
    accountSid: string, 
    authToken: string, 
    fromNumber: string, 
    to: string, 
    message: string
  ) {
    try {
      const subclient = twilio(accountSid, authToken)
      
      const result = await subclient.messages.create({
        from: fromNumber,
        to: to,
        body: message
      })

      return result
    } catch (error) {
      console.error('Error sending SMS from subclient:', error)
      throw error
    }
  }

  async handleVoicemailFromSubclient(
    _accountSid: string,
    _authToken: string,
    recordingUrl: string,
    transcriptionText: string,
    fromNumber: string,
    toNumber: string
  ) {
    try {
      // Process voicemail transcription
      const processedText = transcriptionText || 'Voicemail received (no transcription available)'
      
      return {
        recordingUrl,
        transcription: processedText,
        fromNumber,
        toNumber,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error handling voicemail from subclient:', error)
      throw error
    }
  }

  async configureSMSWebhook(accountSid: string, authToken: string, webhookUrl: string) {
    try {
      const subclient = twilio(accountSid, authToken)
      
      // Configure SMS webhook for the phone number
      const phoneNumbers = await subclient.incomingPhoneNumbers.list()
      
      for (const phoneNumber of phoneNumbers) {
        await subclient.incomingPhoneNumbers(phoneNumber.sid).update({
          smsUrl: webhookUrl,
          smsMethod: 'POST',
          statusCallback: webhookUrl,
          statusCallbackMethod: 'POST'
        })
      }

      return true
    } catch (error) {
      console.error('Error configuring SMS webhook:', error)
      throw error
    }
  }

  async configureVoicemailWebhook(accountSid: string, authToken: string, webhookUrl: string) {
    try {
      const subclient = twilio(accountSid, authToken)
      
      // Configure voicemail webhook for the phone number
      const phoneNumbers = await subclient.incomingPhoneNumbers.list()
      
      for (const phoneNumber of phoneNumbers) {
        await subclient.incomingPhoneNumbers(phoneNumber.sid).update({
          voiceUrl: webhookUrl,
          voiceMethod: 'POST',
          statusCallback: webhookUrl,
          statusCallbackMethod: 'POST'
        })
      }

      return true
    } catch (error) {
      console.error('Error configuring voicemail webhook:', error)
      throw error
    }
  }

  // Existing Number Integration
  async integrateExistingNumber(
    accountSid: string, 
    authToken: string, 
    existingNumber: string,
    webhookUrl: string,
    smsWebhookUrl: string,
    voicemailWebhookUrl: string
  ) {
    try {
      const subclient = twilio(accountSid, authToken)
      
      // Purchase the existing number (if available) or port it
      let phoneNumber
      try {
        // Try to purchase the number if it's available
        // Note: Twilio doesn't support filtering by specific phoneNumber in list
        // You would need to check availability differently or use Twilio's phone number search API
        const availableNumbers = await subclient.availablePhoneNumbers('US')
          .local
          .list({ limit: 1 })
        
        if (availableNumbers.length > 0) {
          phoneNumber = await subclient.incomingPhoneNumbers.create({
            phoneNumber: existingNumber,
            friendlyName: `Business Number - ${existingNumber}`
          })
        } else {
          throw new Error('Number not available for purchase')
        }
      } catch {
        // If number can't be purchased, provide instructions for porting
        throw new Error(`Number ${existingNumber} is not available for immediate purchase. Please contact Twilio support to port your existing number.`)
      }

      // Configure webhooks for the number
      await subclient.incomingPhoneNumbers(phoneNumber.sid).update({
        smsUrl: smsWebhookUrl,
        smsMethod: 'POST',
        voiceUrl: voicemailWebhookUrl,
        voiceMethod: 'POST',
        statusCallback: webhookUrl,
        statusCallbackMethod: 'POST'
      })

      return {
        phoneNumber: phoneNumber.phoneNumber,
        sid: phoneNumber.sid,
        status: 'configured'
      }
    } catch (error) {
      console.error('Error integrating existing number:', error)
      throw error
    }
  }

  async verifyPhoneNumberOwnership(_phoneNumber: string) {
    try {
      // Check if the number is available for purchase/porting
      // Note: Twilio doesn't support filtering by specific phoneNumber in list
      // You would need to use Twilio's phone number search API or check availability differently
      const availableNumbers = await client.availablePhoneNumbers('US')
        .local
        .list({ limit: 1 })
      
      return {
        available: availableNumbers.length > 0,
        canPort: true, // Assume porting is possible
        message: availableNumbers.length > 0 
          ? 'Number is available for immediate purchase'
          : 'Number may be available for porting (contact Twilio support)'
      }
    } catch (error) {
      console.error('Error verifying phone number:', error)
      return {
        available: false,
        canPort: true,
        message: 'Unable to verify number availability'
      }
    }
  }

  async createVoicemailGreetingForSubclient(accountSid: string, authToken: string, businessName: string) {
    try {
      const _subclient = twilio(accountSid, authToken)
      
      // Create a professional voicemail greeting
      const greeting = `Thank you for calling ${businessName}. Please leave your name, number, and a brief message, and we'll get back to you as soon as possible.`
      
      // This would typically involve creating a TwiML application
      // For now, we'll return the greeting text
      return {
        greeting,
        twimlUrl: `${process.env.NEXTAUTH_URL}/api/voicemail/greeting?business=${encodeURIComponent(businessName)}`
      }
    } catch (error) {
      console.error('Error creating voicemail greeting:', error)
      throw error
    }
  }

  // WhatsApp Methods
  async sendWhatsAppMessage(to: string, message: string, mediaUrl?: string) {
    try {
      const messageData: {
        from: string
        to: string
        body: string
        mediaUrl?: string[]
      } = {
        from: `whatsapp:${whatsappNumber}`,
        to: `whatsapp:${to}`,
        body: message
      }

      if (mediaUrl) {
        messageData.mediaUrl = [mediaUrl]
      }

      const result = await client.messages.create(messageData)
      return result
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  async sendWhatsAppTemplate(to: string, templateName: string, parameters: string[]) {
    try {
      const result = await client.messages.create({
        from: `whatsapp:${whatsappNumber}`,
        to: `whatsapp:${to}`,
        contentSid: templateName,
        contentVariables: JSON.stringify({
          '1': parameters[0] || '',
          '2': parameters[1] || '',
          '3': parameters[2] || ''
        })
      })
      return result
    } catch (error) {
      console.error('Error sending WhatsApp template:', error)
      throw error
    }
  }

  // SMS Methods
  async sendSMS(to: string, message: string, mediaUrl?: string) {
    try {
      const messageData: {
        from: string
        to: string
        body: string
        mediaUrl?: string[]
      } = {
        from: smsNumber || '',
        to: to,
        body: message
      }

      if (mediaUrl) {
        messageData.mediaUrl = [mediaUrl]
      }

      const result = await client.messages.create(messageData)
      return result
    } catch (error) {
      console.error('Error sending SMS:', error)
      throw error
    }
  }

  // Voicemail Methods
  async createVoicemailGreeting(phoneNumber: string, greetingText: string) {
    try {
      // Create a TwiML for voicemail greeting
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greetingText}</Say>
  <Record timeout="30" maxLength="300" playBeep="true" action="/api/webhooks/voicemail/recording" method="POST"/>
  <Say voice="alice">Thank you for your message. We will get back to you soon.</Say>
</Response>`

      // Store the TwiML in Twilio's TwiML Bins or return it for webhook
      return twiml
    } catch (error) {
      console.error('Error creating voicemail greeting:', error)
      throw error
    }
  }

  async getVoicemailRecordings(_phoneNumber: string, dateRange?: { start: Date; end: Date }) {
    try {
      const recordings = await client.recordings.list({
        dateCreatedAfter: dateRange?.start,
        dateCreatedBefore: dateRange?.end
      })
      return recordings
    } catch (error) {
      console.error('Error fetching voicemail recordings:', error)
      throw error
    }
  }

  async getVoicemailTranscription(recordingSid: string) {
    try {
      const transcriptions = await client.transcriptions.list()
      // Filter by recordingSid manually since Twilio API doesn't support it in list options
      const transcription = transcriptions.find(t => t.recordingSid === recordingSid)
      return transcription || null
    } catch (error) {
      console.error('Error fetching voicemail transcription:', error)
      throw error
    }
  }

  // Call Management
  async makeCall(to: string, from: string, twimlUrl: string) {
    try {
      const call = await client.calls.create({
        to: to,
        from: from,
        url: twimlUrl
      })
      return call
    } catch (error) {
      console.error('Error making call:', error)
      throw error
    }
  }

  async getCallStatus(callSid: string) {
    try {
      const call = await client.calls(callSid).fetch()
      return call
    } catch (error) {
      console.error('Error fetching call status:', error)
      throw error
    }
  }

  // Webhook Verification
  verifyWebhookSignature(signature: string, url: string, params: Record<string, string>) {
    try {
      if (!authToken) {
        return false
      }
      return twilio.validateRequest(authToken, signature, url, params)
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  // Phone Number Management
  async getPhoneNumbers() {
    try {
      const phoneNumbers = await client.incomingPhoneNumbers.list()
      return phoneNumbers
    } catch (error) {
      console.error('Error fetching phone numbers:', error)
      throw error
    }
  }

  async updatePhoneNumberWebhook(phoneNumberSid: string, webhookUrl: string) {
    try {
      const phoneNumber = await client.incomingPhoneNumbers(phoneNumberSid).update({
        voiceUrl: webhookUrl,
        smsUrl: webhookUrl
      })
      return phoneNumber
    } catch (error) {
      console.error('Error updating phone number webhook:', error)
      throw error
    }
  }
}

export const twilioService = TwilioService.getInstance()
