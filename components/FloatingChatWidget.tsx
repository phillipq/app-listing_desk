"use client"

import { useEffect, useRef, useState } from "react"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface CustomerProfile {
  id: string
  email?: string
  phone?: string
  name?: string
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  priceRange?: { min: number; max: number }
  location?: string
  mustHaves: string[]
  niceToHaves: string[]
  timeline?: string
  motivation?: string
  currentSituation?: string
  leadScore: number
  isQualified: boolean
  notes?: string
}

interface FloatingChatWidgetProps {
  realtorId: string
  realtorName?: string
  primaryColor?: string
  position?: 'bottom-right' | 'bottom-left'
}

export default function FloatingChatWidget({ 
  realtorId, 
  realtorName = "Realtor",
  primaryColor = "#3B82F6",
  position = "bottom-right"
}: FloatingChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [_profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-focus input after loading completes
  useEffect(() => {
    if (!isLoading && inputRef.current && isOpen) {
      inputRef.current.focus()
    }
  }, [isLoading, isOpen])

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check for existing session in localStorage
        const existingSessionId = localStorage.getItem(`leadgen_session_id_${realtorId}`)
        
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sessionId: existingSessionId,
            realtorId: realtorId 
          }),
        })

        const data = await response.json() as { 
          sessionId?: string
          messages?: Array<{ role: string; content: string }>
          profile?: unknown
        }
        
        if (data.sessionId) {
          setSessionId(data.sessionId)
          localStorage.setItem(`leadgen_session_id_${realtorId}`, data.sessionId)
          
          // Load existing messages
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            })))
          }
          
          // Load existing profile
          if (data.profile) {
            setProfile(data.profile as CustomerProfile)
          }
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
      }
    }

    initializeSession()
  }, [realtorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, sessionId }),
      })

      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as { message: string }
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])

      // Extract profile information after each message
      try {
        const profileResponse = await fetch('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json() as { profile: CustomerProfile }
          setProfile(profileData.profile)
        }
      } catch (profileError) {
        console.error('Profile extraction failed:', profileError)
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = async () => {
    try {
      setIsClearing(true)
      
      // Clear local state
      setMessages([])
      setProfile(null)
      setInput("")
      
      // Create new session
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId: null, // Force new session
          realtorId: realtorId
        }),
      })

      const data = await response.json() as { sessionId?: string }
      
      if (data.sessionId) {
        setSessionId(data.sessionId)
        localStorage.setItem(`leadgen_session_id_${realtorId}`, data.sessionId)
        
        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm here to help you find your perfect property with ${realtorName}. What are you looking for?`
        }])
      }
    } catch (error) {
      console.error('Error clearing chat:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4'

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Chat Widget */}
      {isOpen && (
        <div className="mb-4 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div 
            className="p-4 border-b flex justify-between items-center rounded-t-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <div>
              <h3 className="text-gray-700 font-semibold">Chat with {realtorName}</h3>
              <p className="text-gray-700 text-sm opacity-90">AI Property Assistant</p>
            </div>
            <div className="flex space-x-2">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  disabled={isClearing}
                  className="text-gray-700 hover:text-gray-200 text-xs px-2 py-1 rounded disabled:opacity-50"
                  title="New Chat"
                >
                  {isClearing ? '...' : '🔄'}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-700 hover:text-gray-200 text-lg"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                <p className="mb-2">👋 Hi! I'm here to help you find your perfect property.</p>
                <p>Ask me about:</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>• Property search criteria</li>
                  <li>• Neighborhood information</li>
                  <li>• Market trends</li>
                </ul>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'text-gray-700'
                        : 'bg-slate-100 text-gray-700'
                    }`}
                    style={message.role === 'user' ? { backgroundColor: primaryColor } : {}}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-gray-700 max-w-xs px-3 py-2 rounded-lg text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t p-3">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about properties..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-keppel-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isLoading ? '...' : '→'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg text-gray-700 font-bold text-lg hover:scale-105 transition-transform"
        style={{ backgroundColor: primaryColor }}
        title={`Chat with ${realtorName}`}
      >
        {isOpen ? '×' : '💬'}
      </button>
    </div>
  )
}
