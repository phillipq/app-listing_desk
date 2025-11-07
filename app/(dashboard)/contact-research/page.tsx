'use client'

import { useState } from 'react'
import PersonCard from '@/components/contact-research/PersonCard'
import { extractAllContacts, type ParsedContact } from '@/lib/email-parser'

interface PersonProfile {
  email: string
  name: string | null
  linkedinUrl?: string
  linkedinTitle?: string
  linkedinCompany?: string
  linkedinImage?: string
  instagramUrl?: string
  websiteUrl?: string
  profileImage?: string
  sources: string[]
}

export default function ContactResearchPage() {
  const [emailHeader, setEmailHeader] = useState('')
  const [contacts, setContacts] = useState<ParsedContact[]>([])
  const [profiles, setProfiles] = useState<PersonProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleParse = () => {
    try {
      setError(null)
      const extracted = extractAllContacts(emailHeader)
      setContacts(extracted)
      
      if (extracted.length === 0) {
        setError('No contacts found in email header. Please check the format.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse email header')
    }
  }

  const handleLookup = async () => {
    if (contacts.length === 0) {
      setError('Please parse email header first')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/contact-research/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: contacts.map(c => ({
            email: c.email,
            name: c.name
          }))
        }),
      })

      if (!response.ok) {
        const errorData = await response.json() as { error?: string }
        throw new Error(errorData.error || 'Failed to lookup contacts')
      }

      const data = await response.json() as { profiles: PersonProfile[] }
      setProfiles(data.profiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lookup contacts')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Research</h1>
        <p className="text-gray-600">
          Paste email headers to quickly research meeting participants and contacts
        </p>
      </div>

      {/* Email Header Input */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Header</h2>
        <textarea
          value={emailHeader}
          onChange={(e) => setEmailHeader(e.target.value)}
          placeholder="Paste email header here (From:, To:, Cc: fields)..."
          className="w-full h-48 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Parse Contacts
          </button>
          {contacts.length > 0 && (
            <>
              <button
                onClick={handleLookup}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Looking up...' : `Lookup ${contacts.length} Contact${contacts.length !== 1 ? 's' : ''}`}
              </button>
              <span className="px-4 py-2 text-gray-600 flex items-center">
                Found {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Parsed Contacts Preview */}
      {contacts.length > 0 && profiles.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Parsed Contacts ({contacts.length})
          </h2>
          <div className="space-y-2">
            {contacts.map((contact, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {contact.name || 'No name'}
                </div>
                <div className="text-sm text-gray-600">{contact.email}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Person Profiles */}
      {profiles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Research Results ({profiles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile, idx) => (
              <PersonCard key={idx} profile={profile} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

