"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"


interface Lead {
  id: string
  sessionId: string
  email: string | null
  phone: string | null
  name: string | null
  leadScore: number
  isQualified: boolean
  createdAt: string
  lastActivity: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
}

interface LeadDetails {
  session: {
    id: string
    sessionId: string
    createdAt: string
    lastActivity: string
    isActive: boolean
    chatDuration: number
  }
  messages: Array<{
    id: string
    role: string
    content: string
    timestamp: string
  }>
  profile: {
    id: string
    email: string | null
    phone: string | null
    name: string | null
    propertyType: string | null
    bedrooms: number | null
    bathrooms: number | null
    priceRange: { min?: number; max?: number } | null
    location: string | null
    mustHaves: string[]
    niceToHaves: string[]
    timeline: string | null
    motivation: string | null
    currentSituation: string | null
    leadScore: number
    isQualified: boolean
    wantsContact: boolean
    notes: string | null
    createdAt: string
  } | null
}

interface MatchedProperty {
  id: string
  mlsId: string | null
  address: string
  city: string
  province: string
  postalCode: string | null
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  description: string | null
  squareFootage: number | null
  yearBuilt: number | null
  images: string[]
  status: string
  latitude: number | null
  longitude: number | null
  matchScore: number
  matchPercentage: number
  similarityScore: number
  matchReason: string
}

export default function LeadsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadDetails, setLeadDetails] = useState<LeadDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [filter, setFilter] = useState<'all' | 'new' | 'qualified' | 'converted'>('all')
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [showMatchPropertiesModal, setShowMatchPropertiesModal] = useState(false)
  const [matchingLead, setMatchingLead] = useState<Lead | null>(null)
  const [matchedProperties, setMatchedProperties] = useState<MatchedProperty[]>([])
  const [isMatching, setIsMatching] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchLeads()
  }, [session, status, router])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/dashboard/leads')
      if (response.ok) {
        const data = await response.json() as { leads: Lead[] }
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeadDetails = async (lead: Lead) => {
    setSelectedLead(lead)
    setLoadingDetails(true)
    try {
      const response = await fetch(`/api/dashboard/leads/${lead.sessionId}`)
      if (response.ok) {
        const data = await response.json() as LeadDetails
        setLeadDetails(data)
      }
    } catch (error) {
      console.error('Error fetching lead details:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleMatchProperties = async (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    setMatchingLead(lead)
    setShowMatchPropertiesModal(true)
    setIsMatching(true)
    setMatchedProperties([])

    try {
      const response = await fetch(`/api/leads/${lead.id}/match-properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json() as { properties: MatchedProperty[], totalMatches: number }
        setMatchedProperties(data.properties || [])
      } else {
        console.error('Failed to match properties')
        setMatchedProperties([])
      }
    } catch (error) {
      console.error('Error matching properties:', error)
      setMatchedProperties([])
    } finally {
      setIsMatching(false)
    }
  }

  const createCustomerFromLead = async (profile: LeadDetails['profile']) => {
    if (!profile || !profile.name) return
    
    setCreatingCustomer(true)
    try {
      const response = await fetch('/api/crm/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          status: 'lead',
          source: 'chatbot',
          notes: `Converted from lead. Property preferences: ${profile.propertyType || 'Not specified'}, ${profile.bedrooms || 'N/A'} bed, ${profile.bathrooms || 'N/A'} bath. Timeline: ${profile.timeline || 'Not specified'}. Motivation: ${profile.motivation || 'Not specified'}`,
          tags: ['converted-lead', profile.propertyType || 'general'].filter(Boolean)
        })
      })

      if (response.ok) {
        const data = await response.json() as { customer: { name: string } }
        alert(`Customer "${data.customer.name}" created successfully! You can now schedule appointments with them.`)
        setShowCreateCustomerModal(false)
      } else {
        const errorData = await response.json() as { message?: string }
        alert(`Error creating customer: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('Error creating customer. Please try again.')
    } finally {
      setCreatingCustomer(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLeadScoreColor = (score: number) => {
    if (score >= 80) return 'text-gray-700 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-700 bg-red-100'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      case 'lost': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'web_chat': return '💬'
      case 'sms': return '📱'
      case 'whatsapp': return '📲'
      case 'instagram': return '📷'
      case 'voice': return '📞'
      default: return '❓'
    }
  }

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true
    return lead.status === filter
  })

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading leads...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        {selectedLead ? (
          <div className="flex items-center">
            <button
              onClick={() => {
                setSelectedLead(null)
                setLeadDetails(null)
              }}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Back to leads list"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Lead Details</h1>
              <p className="text-gray-500 mt-2">Viewing details for {selectedLead.name || 'Anonymous'}</p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-gray-700">Lead Management</h1>
            <p className="text-gray-500 mt-2">Manage and track your potential clients</p>
          </div>
        )}
      </div>

      {/* Content Area */}
      {!selectedLead ? (
        /* Leads Table */
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 overflow-hidden">
          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-keppel-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Leads ({leads.length})
              </button>
              <button
                onClick={() => setFilter('new')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'new' 
                    ? 'bg-keppel-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                New ({leads.filter(l => l.status === 'new').length})
              </button>
              <button
                onClick={() => setFilter('qualified')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'qualified' 
                    ? 'bg-keppel-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Qualified ({leads.filter(l => l.status === 'qualified').length})
              </button>
              <button
                onClick={() => setFilter('converted')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'converted' 
                    ? 'bg-keppel-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Converted ({leads.filter(l => l.status === 'converted').length})
              </button>
            </div>
          </div>

          {filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead: Lead) => {
                    const isSelected = selectedLead !== null && (selectedLead as Lead).id === lead.id
                    return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-50 cursor-pointer transition-colors duration-200 ${
                        isSelected ? 'bg-keppel-50' : ''
                      }`}
                      onClick={() => fetchLeadDetails(lead)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-keppel-500 shadow-soft-sm flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-700">
                              {lead.name || 'Anonymous'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {lead.email || lead.phone || 'No contact info'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getSourceIcon(lead.source || 'web_chat')}</span>
                          <span className="text-sm text-gray-700 capitalize">
                            {lead.source?.replace('_', ' ') || 'Web Chat'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeadScoreColor(lead.leadScore)}`}>
                          {lead.leadScore}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1) || 'New'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.lastActivity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => handleMatchProperties(lead, e)}
                          className="text-keppel-600 hover:text-keppel-800 hover:bg-keppel-50 px-3 py-1 rounded-md transition-colors"
                          title="Match properties to this lead"
                        >
                          Match Properties
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No leads found</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'all' 
                  ? "Start conversations with potential clients using your chatbot to see leads appear here."
                  : `No leads found with status "${filter}". Try a different filter.`
                }
              </p>
              {filter === 'all' && (
                <Link
                  href={`/?realtorId=${session?.user?.id}`}
                  className="inline-flex items-center px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-md hover:shadow-soft-md transition-all duration-200"
                >
                  View Chatbot
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Lead Details - Same as existing implementation */
        <div>
          {loadingDetails ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading lead details...</p>
              </div>
            </div>
          ) : leadDetails ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Chat Conversation */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Chat Conversation</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {leadDetails.messages && leadDetails.messages.length > 0 ? (
                      leadDetails.messages.map((message, index) => (
                        <div key={message.id || index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-keppel-500 text-seasalt-500' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No messages found</p>
                    )}
                  </div>
                </div>

                {/* Property Preferences and Additional Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Property Preferences */}
                  {leadDetails.profile && (
                    <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Property Preferences</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Property Type</label>
                          <p className="text-gray-700">{leadDetails.profile.propertyType || 'Not specified'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Bedrooms</label>
                            <p className="text-gray-700">{leadDetails.profile.bedrooms || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Bathrooms</label>
                            <p className="text-gray-700">{leadDetails.profile.bathrooms || 'Not specified'}</p>
                          </div>
                        </div>
                        {leadDetails.profile.priceRange && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Price Range</label>
                            <p className="text-gray-700">
                              ${leadDetails.profile.priceRange.min?.toLocaleString() || '0'} - ${leadDetails.profile.priceRange.max?.toLocaleString() || 'No limit'}
                            </p>
                          </div>
                        )}
                        {leadDetails.profile.location && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Preferred Location</label>
                            <p className="text-gray-700">{leadDetails.profile.location}</p>
                          </div>
                        )}
                        {leadDetails.profile.mustHaves && leadDetails.profile.mustHaves.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Must Haves</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {leadDetails.profile.mustHaves.map((item, index) => (
                                <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-keppel-100 text-keppel-800 rounded-full">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {leadDetails.profile.niceToHaves && leadDetails.profile.niceToHaves.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Nice to Haves</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {leadDetails.profile.niceToHaves.map((item, index) => (
                                <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                  {item}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {leadDetails.profile && (leadDetails.profile.timeline || leadDetails.profile.motivation || leadDetails.profile.currentSituation || leadDetails.profile.notes) && (
                    <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Additional Information</h3>
                      <div className="space-y-3">
                        {leadDetails.profile.timeline && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Timeline</label>
                            <p className="text-gray-700">{leadDetails.profile.timeline}</p>
                          </div>
                        )}
                        {leadDetails.profile.motivation && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Motivation</label>
                            <p className="text-gray-700">{leadDetails.profile.motivation}</p>
                          </div>
                        )}
                        {leadDetails.profile.currentSituation && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Current Situation</label>
                            <p className="text-gray-700">{leadDetails.profile.currentSituation}</p>
                          </div>
                        )}
                        {leadDetails.profile.notes && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Notes</label>
                            <p className="text-gray-700">{leadDetails.profile.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Lead Information */}
              <div className="space-y-6">
                {/* Lead Assessment */}
                <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Lead Assessment</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Lead Score</span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getLeadScoreColor(leadDetails.profile?.leadScore || 0)}`}>
                        {leadDetails.profile?.leadScore || 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Status</span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(leadDetails.profile?.isQualified ? 'qualified' : 'new')}`}>
                        {leadDetails.profile?.isQualified ? 'Lead Ready' : 'Incomplete Lead'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Wants Contact</span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        leadDetails.profile?.wantsContact ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {leadDetails.profile?.wantsContact ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Chat Duration</span>
                      <span className="text-gray-700">{Math.round(leadDetails.session.chatDuration / 60)} min</span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-700">{leadDetails.profile?.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-700">{leadDetails.profile?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-700">{leadDetails.profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {/* Create Customer Button */}
                  {leadDetails.profile?.name && (leadDetails.profile?.email || leadDetails.profile?.phone) && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowCreateCustomerModal(true)}
                        disabled={creatingCustomer}
                        className="w-full bg-keppel-500 text-white px-4 py-2 rounded-lg hover:bg-keppel-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingCustomer ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create Customer
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>Failed to load lead details</p>
            </div>
          )}
        </div>
      )}

      {/* Create Customer Confirmation Modal */}
      {showCreateCustomerModal && leadDetails?.profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700">Create Customer from Lead</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to create a customer record for <strong>{leadDetails.profile.name}</strong>?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Customer Details:</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {leadDetails.profile.name}</p>
                  {leadDetails.profile.email && <p><strong>Email:</strong> {leadDetails.profile.email}</p>}
                  {leadDetails.profile.phone && <p><strong>Phone:</strong> {leadDetails.profile.phone}</p>}
                  <p><strong>Status:</strong> Lead</p>
                  <p><strong>Source:</strong> Chatbot</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateCustomerModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    createCustomerFromLead(leadDetails.profile!)
                    setShowCreateCustomerModal(false)
                  }}
                  disabled={creatingCustomer}
                  className="flex-1 bg-keppel-500 text-white px-4 py-2 rounded-lg hover:bg-keppel-600 disabled:opacity-50"
                >
                  {creatingCustomer ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Properties Modal */}
      {showMatchPropertiesModal && matchingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-700">Matched Properties for {matchingLead.name || 'Lead'}</h2>
                <p className="text-sm text-gray-500 mt-1">Properties matched based on lead preferences</p>
              </div>
              <button
                onClick={() => {
                  setShowMatchPropertiesModal(false)
                  setMatchingLead(null)
                  setMatchedProperties([])
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isMatching ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Matching properties...</p>
                  </div>
                </div>
              ) : matchedProperties.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No matching properties found.</p>
                  <p className="text-gray-400 mt-2">Try updating the lead's preferences or adding more properties.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      Found <span className="font-semibold">{matchedProperties.length}</span> matching properties
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchedProperties.map((property) => (
                      <div
                        key={property.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          window.open(`/realtor/properties/${property.mlsId || property.id}`, '_blank')
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{property.address}</h3>
                            <p className="text-sm text-gray-500">{property.city}, {property.province}</p>
                          </div>
                          {property.matchPercentage !== undefined && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              property.matchPercentage >= 80 ? 'bg-green-100 text-green-800' :
                              property.matchPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {property.matchPercentage}% match
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-2 font-semibold text-gray-900">
                              ${property.price?.toLocaleString() || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-2 text-gray-900 capitalize">{property.propertyType || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Bedrooms:</span>
                            <span className="ml-2 text-gray-900">{property.bedrooms || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Bathrooms:</span>
                            <span className="ml-2 text-gray-900">{property.bathrooms || 'N/A'}</span>
                          </div>
                        </div>
                        {property.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
                        )}
                        {property.matchReason && (
                          <p className="text-xs text-gray-500 mt-2 italic">{property.matchReason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowMatchPropertiesModal(false)
                  setMatchingLead(null)
                  setMatchedProperties([])
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
