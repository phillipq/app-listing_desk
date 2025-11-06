"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Button } from "components/Button/Button"

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

export default function ChatbotPage() {
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
    if (!isLoading && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isLoading])

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check for existing session in localStorage
        const existingSessionId = localStorage.getItem('leadgen_session_id')
        
        // Check if we have a realtor ID from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search)
        const realtorId = urlParams.get('realtorId') || localStorage.getItem('leadgen_realtor_id')
        
        console.log('Realtor ID from URL:', urlParams.get('realtorId'))
        console.log('Realtor ID from localStorage:', localStorage.getItem('leadgen_realtor_id'))
        console.log('Using realtor ID:', realtorId)
        
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
          profile?: CustomerProfile
        }
        
        if (data.sessionId) {
          setSessionId(data.sessionId)
          localStorage.setItem('leadgen_session_id', data.sessionId)
          
          // Store realtor ID if we have it
          if (realtorId) {
            localStorage.setItem('leadgen_realtor_id', realtorId)
          }
          
          // Load existing messages
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            })))
          }
          
          // Load existing profile
          if (data.profile) {
            setProfile(data.profile)
          }
        }
      } catch (error) {
        console.error('Failed to initialize session:', error)
      }
    }

    initializeSession()
  }, [])

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
        // Don't show error to user, profile extraction is background process
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
      
      // Get realtor ID from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search)
      const realtorId = urlParams.get('realtorId') || localStorage.getItem('leadgen_realtor_id')
      
      console.log('Clear chat - Using realtor ID:', realtorId)
      
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
        localStorage.setItem('leadgen_session_id', data.sessionId)
        
        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: 'Hi! I\'m here to help you find your perfect property. What are you looking for?'
        }])
      }
    } catch (error) {
      console.error('Error clearing chat:', error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-700">Realtor AI Assistant</h1>
            <p className="text-gray-700">Find your perfect property with AI-powered assistance</p>
          </div>
          <div className="flex space-x-4">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                disabled={isClearing}
                className="text-gray-700 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 border border-gray-300 hover:border-gray-400"
              >
                {isClearing ? 'Starting...' : 'New Chat'}
              </button>
            )}
            <Link
              href="/auth/signin"
              className="text-gray-700 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-polynesian-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-polynesian-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <h3 className="text-lg font-medium mb-2">Welcome to Realtor AI Assistant!</h3>
                <p>Ask me anything about finding your perfect property. I can help with:</p>
                <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
                  <li>• Property search criteria</li>
                  <li>• Neighborhood information</li>
                  <li>• Market trends and pricing</li>
                  <li>• Home buying process</li>
                  <li>• Investment opportunities</li>
                </ul>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-700 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
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
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about properties, neighborhoods, or real estate..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:border-transparent"
                disabled={isLoading}
                autoFocus
              />
              <Button type="submit" disabled={!input.trim() || isLoading}>
                {isLoading ? 'Sending...' : 'Send'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
