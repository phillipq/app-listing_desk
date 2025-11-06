'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ChannelConfig {
  type: 'whatsapp' | 'instagram' | 'sms' | 'voicemail'
  name: string
  credentials: Record<string, string>
  webhookUrl: string
}

export default function ConnectChannelPage() {
  const router = useRouter()
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [config, setConfig] = useState<ChannelConfig>({
    type: 'whatsapp',
    name: '',
    credentials: {},
    webhookUrl: ''
  })
  const [isConnecting, setIsConnecting] = useState(false)

  const channelTypes = [
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: '📱',
      description: 'Connect your WhatsApp Business API',
      fields: [
        { key: 'accountSid', label: 'Twilio Account SID', type: 'text', required: true },
        { key: 'authToken', label: 'Twilio Auth Token', type: 'password', required: true },
        { key: 'phoneNumber', label: 'WhatsApp Phone Number', type: 'text', required: true },
        { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true }
      ]
    },
    {
      id: 'instagram',
      name: 'Instagram Business',
      icon: '📷',
      description: 'Connect your Instagram Business account',
      fields: [
        { key: 'accessToken', label: 'Instagram Access Token', type: 'password', required: true },
        { key: 'pageId', label: 'Instagram Page ID', type: 'text', required: true },
        { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true }
      ]
    },
    {
      id: 'sms',
      name: 'SMS Messaging',
      icon: '💬',
      description: 'Setup SMS through Twilio',
      fields: [
        { key: 'accountSid', label: 'Twilio Account SID', type: 'text', required: true },
        { key: 'authToken', label: 'Twilio Auth Token', type: 'password', required: true },
        { key: 'phoneNumber', label: 'SMS Phone Number', type: 'text', required: true },
        { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true }
      ]
    },
    {
      id: 'voicemail',
      name: 'Voicemail',
      icon: '📞',
      description: 'Setup voicemail recording and transcription',
      fields: [
        { key: 'accountSid', label: 'Twilio Account SID', type: 'text', required: true },
        { key: 'authToken', label: 'Twilio Auth Token', type: 'password', required: true },
        { key: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
        { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: true }
      ]
    }
  ]

  const selectedChannelType = channelTypes.find(c => c.id === selectedChannel)

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannel(channelId)
    const channelType = channelTypes.find(c => c.id === channelId)
    if (channelType && (channelId === 'whatsapp' || channelId === 'instagram' || channelId === 'sms' || channelId === 'voicemail')) {
      setConfig({
        type: channelId as 'whatsapp' | 'instagram' | 'sms' | 'voicemail',
        name: `${channelType.name} Channel`,
        credentials: {},
        webhookUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/${channelId}`
      })
    }
  }

  const handleCredentialChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        [key]: value
      }
    }))
  }

  const handleConnect = async () => {
    if (!selectedChannelType) return

    setIsConnecting(true)
    try {
      const response = await fetch('/api/communication/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          isActive: true,
          config: {
            ...config.credentials,
            webhookUrl: config.webhookUrl
          }
        })
      })

      if (response.ok) {
        router.push('/communication/channels?connected=true')
      } else {
        throw new Error('Failed to connect channel')
      }
    } catch (error) {
      console.error('Error connecting channel:', error)
      alert('Failed to connect channel. Please check your credentials.')
    } finally {
      setIsConnecting(false)
    }
  }

  const isFormValid = () => {
    if (!selectedChannelType) return false
    return selectedChannelType.fields.every(field => 
      field.required ? config.credentials[field.key] : true
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-keppel-600 hover:text-keppel-700 mb-4"
        >
          ← Back to Channels
        </button>
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Connect New Channel</h1>
        <p className="text-gray-500">Add a new communication channel to your account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Channel Selection */}
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Choose Channel Type</h2>
          <div className="space-y-3">
            {channelTypes.map((channel) => (
              <div
                key={channel.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedChannel === channel.id
                    ? 'border-keppel-500 bg-keppel-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleChannelSelect(channel.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{channel.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-700">{channel.name}</h3>
                    <p className="text-sm text-gray-500">{channel.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
          {selectedChannelType ? (
            <>
              <div className="flex items-center space-x-3 mb-6">
                <span className="text-2xl">{selectedChannelType.icon}</span>
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">{selectedChannelType.name}</h2>
                  <p className="text-gray-500">Enter your API credentials</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-transparent"
                    placeholder="e.g., My WhatsApp Business"
                  />
                </div>

                {selectedChannelType.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={config.credentials[field.key] || ''}
                      onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-transparent"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  </div>
                ))}

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-white p-2 rounded border">
                      {config.webhookUrl}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(config.webhookUrl)}
                      className="px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Use this URL as your webhook endpoint in your service provider's settings
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleConnect}
                  disabled={!isFormValid() || isConnecting}
                  className="w-full bg-keppel-500 text-white px-4 py-3 rounded-lg hover:bg-keppel-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Channel'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Select a Channel</h3>
              <p className="text-gray-500">Choose a communication channel from the left to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">🆘 Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">WhatsApp Business API</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Get started at business.whatsapp.com</li>
              <li>• Apply for WhatsApp Business API access</li>
              <li>• Use Twilio as your BSP (Business Solution Provider)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Instagram Business</h4>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Convert to Instagram Business account</li>
              <li>• Connect to Facebook Page</li>
              <li>• Generate access token in Facebook Developer Console</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
