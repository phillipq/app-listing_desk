'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface WhatsAppConnectFormProps {
  onConnect: (businessName: string) => void
  onConnectExisting: (businessName: string, phoneNumber: string, channelType: string) => void
  onCancel: () => void
}

function WhatsAppConnectForm({ onConnect, onConnectExisting, onCancel }: WhatsAppConnectFormProps) {
  const [businessName, setBusinessName] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [integrationType, setIntegrationType] = useState<'new' | 'existing'>('new')
  const [existingNumber, setExistingNumber] = useState('')
  const [channelType, setChannelType] = useState<'sms_voicemail' | 'whatsapp_sms_voicemail'>('sms_voicemail')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessName.trim()) return
    if (integrationType === 'existing' && !existingNumber.trim()) return

    setIsConnecting(true)
    try {
      if (integrationType === 'new') {
        await onConnect(businessName.trim())
      } else {
        await onConnectExisting(businessName.trim(), existingNumber.trim(), channelType)
      }
    } finally {
      setIsConnecting(false)
    }
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Name
        </label>
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Enter your business name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Integration Type
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              value="new"
              checked={integrationType === 'new'}
              onChange={(e) => setIntegrationType(e.target.value as 'new' | 'existing')}
              className="mr-3"
            />
            <div>
              <div className="font-medium">New Phone Number</div>
              <div className="text-sm text-gray-500">We'll provision a new number for you</div>
            </div>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="existing"
              checked={integrationType === 'existing'}
              onChange={(e) => setIntegrationType(e.target.value as 'new' | 'existing')}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Use Existing Number</div>
              <div className="text-sm text-gray-500">Track SMS and voicemails from your current number</div>
            </div>
          </label>
        </div>
      </div>

      {integrationType === 'existing' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Phone Number
            </label>
            <input
              type="tel"
              value={existingNumber}
              onChange={(e) => setExistingNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll help you integrate this number with our platform
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Channels to Enable
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sms_voicemail"
                  checked={channelType === 'sms_voicemail'}
                  onChange={(e) => setChannelType(e.target.value as 'sms_voicemail' | 'whatsapp_sms_voicemail')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">SMS + Voicemail</div>
                  <div className="text-sm text-gray-500">Track text messages and voicemails</div>
                </div>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="whatsapp_sms_voicemail"
                  checked={channelType === 'whatsapp_sms_voicemail'}
                  onChange={(e) => setChannelType(e.target.value as 'sms_voicemail' | 'whatsapp_sms_voicemail')}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">WhatsApp + SMS + Voicemail</div>
                  <div className="text-sm text-gray-500">Full communication suite (if number supports WhatsApp)</div>
                </div>
              </label>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-700 font-medium"
          disabled={isConnecting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!businessName.trim() || isConnecting}
          className="px-4 py-2 bg-keppel-500 text-white rounded-lg font-medium hover:bg-keppel-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? 'Connecting...' : 'Connect WhatsApp'}
        </button>
      </div>
    </form>
  )
}

interface Channel {
  id: string
  name: string
  type: string
  isActive: boolean
  config: Record<string, unknown>
  createdAt: string
}

export default function ChannelsWrapper() {
  const { data: _session } = useSession()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/communication/channels')
      if (response.ok) {
        const data = await response.json() as { channels: Channel[] }
        setChannels(data.channels || [])
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const _handleConnectChannel = async (type: string) => {
    if (type === 'instagram') {
      window.location.href = '/api/integrations/instagram/connect'
    } else if (type === 'whatsapp') {
      // Show WhatsApp connect form
      setShowConnectModal(true)
    } else {
      setShowConnectModal(true)
    }
  }

  const handleWhatsAppConnect = async (businessName: string) => {
    try {
      const response = await fetch('/api/integrations/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessName }),
      })

      const data = await response.json() as { phoneNumber?: string; error?: string }

      if (response.ok) {
        alert(`Communication channels connected successfully! Your number: ${data.phoneNumber}\n\n✅ WhatsApp Business\n✅ SMS Messaging\n✅ Voicemail`)
        setShowConnectModal(false)
        fetchChannels() // Refresh channels
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error)
      alert('Failed to connect WhatsApp. Please try again.')
    }
  }

  const handleExistingNumberConnect = async (businessName: string, phoneNumber: string, channelType: string) => {
    try {
      const response = await fetch('/api/integrations/existing-number/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessName, existingNumber: phoneNumber, integrationType: channelType }),
      })

      const data = await response.json() as { phoneNumber?: string; error?: string; nextSteps?: string[] }

      if (response.ok) {
        const channelsText = channelType === 'sms_voicemail' ? 'SMS + Voicemail' : 'WhatsApp + SMS + Voicemail'
        const steps = (data.nextSteps ?? []).map((step: string) => `• ${step}`).join('\n')
        alert(`Your existing number ${data.phoneNumber ?? ''} has been successfully integrated!\n\n✅ ${channelsText}\n\nNext steps:\n${steps}`)
        setShowConnectModal(false)
        fetchChannels() // Refresh channels
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error connecting existing number:', error)
      alert('Failed to integrate existing number. Please try again.')
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return '📱'
      case 'instagram':
        return '📸'
      case 'sms':
        return '💬'
      case 'voicemail':
        return '🎙️'
      default:
        return '🔗'
    }
  }

  const getChannelStatus = (channel: Channel) => {
    if (channel.isActive) {
      return { text: 'Active', color: 'text-green-600 bg-green-100' }
    }
    return { text: 'Inactive', color: 'text-red-600 bg-red-100' }
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Communication Channels</h1>
        <p className="text-gray-500">Manage your connected communication channels</p>
      </div>

      {/* Connect Channel Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowConnectModal(true)}
          className="bg-keppel-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-keppel-600 transition-colors"
        >
          + Connect New Channel
        </button>
      </div>

      {/* Channels List */}
      {channels.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📡</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Channels Connected</h3>
          <p className="text-gray-500 mb-6">Connect your first communication channel to start receiving leads</p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="bg-keppel-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-keppel-600 transition-colors"
          >
            Connect Your First Channel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => {
            const status = getChannelStatus(channel)
            return (
              <div key={channel.id} className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">{getChannelIcon(channel.type)}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.text}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{channel.name}</h3>
                <p className="text-gray-500 text-sm mb-4 capitalize">{channel.type} Channel</p>
                <div className="flex space-x-2">
                  <button className="text-keppel-600 hover:text-keppel-700 text-sm font-medium">
                    Configure
                  </button>
                  <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                    Disconnect
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Connect Communication Channels</h3>
            <p className="text-gray-500 mb-4">
              We'll automatically provision a phone number for WhatsApp, SMS, and Voicemail. No Twilio account needed!
            </p>
            
            <WhatsAppConnectForm 
              onConnect={handleWhatsAppConnect}
              onConnectExisting={handleExistingNumberConnect}
              onCancel={() => setShowConnectModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
