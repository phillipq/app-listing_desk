import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { lookupLinkedInProfile } from '@/lib/linkedin-service'

interface Contact {
  email: string
  name: string | null
}

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { contacts } = await request.json() as { contacts: Contact[] }
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'Invalid contacts array' },
        { status: 400 }
      )
    }

    // Limit to 50 contacts per request to avoid rate limits
    const contactsToProcess = contacts.slice(0, 50)
    const profiles: PersonProfile[] = []

    // Process contacts in parallel (with concurrency limit)
    const BATCH_SIZE = 5
    for (let i = 0; i < contactsToProcess.length; i += BATCH_SIZE) {
      const batch = contactsToProcess.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.allSettled(
        batch.map(contact => lookupPersonProfile(contact))
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value) {
          profiles.push(result.value)
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < contactsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Contact research lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup contacts' },
      { status: 500 }
    )
  }
}

/**
 * Lookup a person's profile across multiple sources
 */
async function lookupPersonProfile(contact: Contact): Promise<PersonProfile | null> {
  const profile: PersonProfile = {
    email: contact.email,
    name: contact.name,
    sources: []
  }

  try {
    // 1. LinkedIn lookup (primary source)
    const linkedinData = await lookupLinkedInProfile(contact.email, contact.name)
    if (linkedinData) {
      profile.linkedinUrl = linkedinData.url
      profile.linkedinTitle = linkedinData.title
      profile.linkedinCompany = linkedinData.company
      profile.linkedinImage = linkedinData.image
      profile.profileImage = linkedinData.image
      profile.sources.push('LinkedIn')
    }
  } catch (error) {
    console.error(`LinkedIn lookup failed for ${contact.email}:`, error)
  }

  // TODO: Add Instagram lookup
  // TODO: Add website search
  // TODO: Add other sources

  // Only return profile if we found at least one source
  if (profile.sources.length > 0) {
    return profile
  }

  // Return basic profile even if no sources found
  return profile
}

