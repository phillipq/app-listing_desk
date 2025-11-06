'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Conversation {
  id: string
  leadId: string
  channelId: string
  status: string
  lastMessageAt: string
  lead: {
    id: string
    name: string | null
    phone: string | null
    email: string | null
    leadScore: number
    isQualified: boolean
    source: string
  }
  channel: {
    id: string
    name: string
    type: string
    platform: string
  }
  messages: Message[]
  _count: {
    messages: number
  }
}

interface Message {
  id: string
  content: string
  timestamp: string
  isIncoming: boolean
  source: string
  platform: string
  requiresHuman: boolean
  humanNotified: boolean
}

export default function UnifiedInbox() {
  const { data: _session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'requires_human' | 'ai_handled'>('all')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/communication/conversations')
      if (response.ok) {
        const data = await response.json() as { conversations?: Conversation[] }
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/communication/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json() as { messages?: Message[] }
        return data.messages || []
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
    return []
  }

  const handleConversationClick = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    const messages = await fetchMessages(conversation.id)
    setSelectedConversation({ ...conversation, messages })
  }

  const getFilteredConversations = () => {
    switch (filter) {
      case 'requires_human':
        return conversations.filter(conv => 
          conv.messages.some(msg => msg.requiresHuman && !msg.humanNotified)
        )
      case 'ai_handled':
        return conversations.filter(conv => 
          conv.messages.every(msg => !msg.requiresHuman || msg.humanNotified)
        )
      default:
        return conversations
    }
  }

  const getStatusColor = (conversation: Conversation) => {
    const hasUnreadHuman = conversation.messages.some(msg => 
      msg.requiresHuman && !msg.humanNotified
    )
    
    if (hasUnreadHuman) return 'bg-red-100 border-red-200'
    if (conversation.status === 'active') return 'bg-green-100 border-green-200'
    return 'bg-gray-100 border-gray-200'
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return '📱'
      case 'instagram': return '📸'
      case 'sms': return '💬'
      case 'voicemail': return '🎙️'
      default: return '📞'
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Unified Inbox</h1>
        <p className="text-gray-500">Manage all your conversations in one place</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-keppel-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Conversations ({conversations.length})
          </button>
          <button
            onClick={() => setFilter('requires_human')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'requires_human'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Needs Attention ({conversations.filter(conv => 
              conv.messages.some(msg => msg.requiresHuman && !msg.humanNotified)
            ).length})
          </button>
          <button
            onClick={() => setFilter('ai_handled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'ai_handled'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            AI Handled ({conversations.filter(conv => 
              conv.messages.every(msg => !msg.requiresHuman || msg.humanNotified)
            ).length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">Conversations</h2>
          {getFilteredConversations().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No conversations found
            </div>
          ) : (
            getFilteredConversations().map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${getStatusColor(conversation)} ${
                  selectedConversation?.id === conversation.id ? 'ring-2 ring-keppel-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPlatformIcon(conversation.channel.type)}</span>
                    <h3 className="font-medium text-gray-700">
                      {conversation.lead.name || conversation.lead.phone || 'Unknown'}
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(conversation.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {conversation.lead.phone && `📞 ${conversation.lead.phone}`}
                  {conversation.lead.email && ` • ✉️ ${conversation.lead.email}`}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                    {conversation.lead.source}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {conversation._count.messages} messages
                    </span>
                    {conversation.lead.isQualified && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800">
                        Qualified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Conversation Details */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 h-96 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getPlatformIcon(selectedConversation.channel.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-700">
                        {selectedConversation.lead.name || selectedConversation.lead.phone || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.channel.name} • {selectedConversation.lead.source}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Score: {selectedConversation.lead.leadScore}
                    </div>
                    {selectedConversation.lead.isQualified && (
                      <div className="text-xs px-2 py-1 rounded-full bg-green-200 text-green-800 mt-1">
                        Qualified Lead
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.isIncoming
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-keppel-500 text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className={`text-xs mt-1 ${
                        message.isIncoming ? 'text-gray-500' : 'text-keppel-100'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                        {message.source === 'outgoing_ai' && ' • AI'}
                        {message.requiresHuman && ' • Needs Human'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-keppel-500 text-white rounded-lg text-sm font-medium hover:bg-keppel-600">
                    Respond
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Mark as Read
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                    Add to CRM
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium mb-2">Select a Conversation</h3>
                <p>Choose a conversation from the list to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
