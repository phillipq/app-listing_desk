'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Channel {
  id: string
  name: string
  type: string
  isActive: boolean
  config: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

interface ChannelsResponse {
  channels: Channel[]
}

export default function ChannelsPage() {
  const { data: session } = useSession()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (session) {
      fetchChannels()
    }
  }, [session])

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/communication/channels')
      const data = await response.json() as ChannelsResponse
      setChannels(data.channels || [])
    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectChannel = async (channelType: string) => {
    setConnecting(true)
    try {
      if (channelType === 'whatsapp') {
        // Redirect to WhatsApp Business API setup
        window.open('https://business.whatsapp.com/products/business-api', '_blank')
      } else if (channelType === 'instagram') {
        // Start Instagram OAuth flow
        window.location.href = '/api/integrations/instagram/connect'
      } else if (channelType === 'sms') {
        // Redirect to Twilio setup
        window.open('https://console.twilio.com/us1/develop/phone-numbers/manage/incoming', '_blank')
      } else if (channelType === 'voicemail') {
        // Redirect to Twilio phone number setup
        window.open('https://console.twilio.com/us1/develop/phone-numbers/manage/incoming', '_blank')
      }
    } catch (error) {
      console.error('Error connecting channel:', error)
    } finally {
      setConnecting(false)
      setShowConnectModal(false)
    }
  }

  const handleDisconnectChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to disconnect this channel?')) return

    try {
      const response = await fetch(`/api/communication/channels/${channelId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchChannels()
      }
    } catch (error) {
      console.error('Error disconnecting channel:', error)
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return '📱'
      case 'instagram': return '📷'
      case 'sms': return '💬'
      case 'voicemail': return '📞'
      case 'email': return '📧'
      case 'web_chat': return '🌐'
      default: return '❓'
    }
  }

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'bg-green-100 text-green-800'
      case 'instagram': return 'bg-pink-100 text-pink-800'
      case 'sms': return 'bg-blue-100 text-blue-800'
      case 'voicemail': return 'bg-purple-100 text-purple-800'
      case 'email': return 'bg-gray-100 text-gray-800'
      case 'web_chat': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChannelDescription = (type: string) => {
    switch (type) {
      case 'whatsapp': return 'Connect your WhatsApp Business account to receive and send messages'
      case 'instagram': return 'Connect your Instagram Business account for direct messaging'
      case 'sms': return 'Set up SMS messaging through Twilio'
      case 'voicemail': return 'Configure voicemail greetings and recording management'
      case 'email': return 'Connect your email account for lead management'
      case 'web_chat': return 'Add a chat widget to your website'
      default: return 'Unknown channel type'
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading channels...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">Communication Channels</h1>
            <p className="text-gray-500 mt-2">Connect and manage your communication channels</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/communication/setup"
              className="bg-keppel-500 text-white px-4 py-2 rounded-lg hover:bg-keppel-600 transition-colors"
            >
              Quick Setup
            </Link>
            <button
              onClick={() => setShowConnectModal(true)}
              className="border border-keppel-500 text-keppel-600 px-4 py-2 rounded-lg hover:bg-keppel-50 transition-colors"
            >
              Connect Channel
            </button>
          </div>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <div key={channel.id} className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getChannelIcon(channel.type)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">{channel.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getChannelColor(channel.type)}`}>
                    {channel.type.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${channel.isActive ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-500">
                  {channel.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {getChannelDescription(channel.type)}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Connected {new Date(channel.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDisconnectChannel(channel.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Disconnect
              </button>
            </div>
          </div>
        ))}

        {/* Add Channel Card */}
        <div 
          onClick={() => setShowConnectModal(true)}
          className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-keppel-300 hover:bg-keppel-50 transition-colors"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Add Channel</h3>
            <p className="text-sm text-gray-500">Connect a new communication channel</p>
          </div>
        </div>
      </div>

      {/* Connect Channel Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Connect Channel</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => handleConnectChannel('whatsapp')}
                disabled={connecting}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <div className="font-medium">WhatsApp Business</div>
                  <div className="text-sm text-gray-500">Via Twilio</div>
                </div>
              </button>

              <button
                onClick={() => handleConnectChannel('instagram')}
                disabled={connecting}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="text-2xl">📷</span>
                <div className="text-left">
                  <div className="font-medium">Instagram</div>
                  <div className="text-sm text-gray-500">Direct messaging</div>
                </div>
              </button>

              <button
                onClick={() => handleConnectChannel('sms')}
                disabled={connecting}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="text-2xl">💬</span>
                <div className="text-left">
                  <div className="font-medium">SMS</div>
                  <div className="text-sm text-gray-500">Via Twilio</div>
                </div>
              </button>

              <button
                onClick={() => handleConnectChannel('voicemail')}
                disabled={connecting}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="text-2xl">📞</span>
                <div className="text-left">
                  <div className="font-medium">Voicemail</div>
                  <div className="text-sm text-gray-500">Via Twilio</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
