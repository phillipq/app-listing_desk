import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '../../../../lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { sessionId?: string }
    const { sessionId } = body
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Get API key from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid API key' },
        { status: 401 }
      )
    }
    
    const apiKey = authHeader.replace('Bearer ', '')
    
    // Find realtor by API key
    const realtor = await prisma.realtor.findUnique({
      where: { apiKey },
      select: { id: true }
    })
    
    if (!realtor) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Get session and verify ownership
    const session = await prisma.session.findUnique({
      where: { sessionToken: sessionId }
    })
    
    if (!session || session.realtorId !== realtor.id) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 403 }
      )
    }
    
    // Note: Conversation history storage not implemented in current schema
    // Messages are stored via CommunicationChannel and Conversation models
    // For profile extraction, we'd need to fetch messages from a different source
    const messages: Array<{ role: string; content: string }> = []
    
    // Use OpenAI to extract structured data
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Extract structured customer information from this real estate conversation. Return a JSON object with:
          {
            "contactInfo": {
              "name": "string or null",
              "email": "string or null", 
              "phone": "string or null"
            },
            "propertyPreferences": {
              "propertyType": "string or null",
              "bedrooms": "number or null",
              "bathrooms": "number or null",
              "priceRange": {"min": number, "max": number} or null,
              "location": "string or null"
            },
            "neighborhoodPreferences": {
              "priority": "string or null (family, convenience, lifestyle, commute)",
              "transportation": "string or null (car, transit, walking)",
              "specificNeeds": ["string"] or null
            },
            "timeline": {
              "when": "string or null",
              "currentSituation": "string or null"
            },
            "leadScore": number (0-100 based on engagement and contact info),
            "notes": "string or null"
          }

IMPORTANT PRICE RANGE EXTRACTION:
- "below 500k" or "under 500k" = max: 500000, min: null
- "above 300k" or "over 300k" = min: 300000, max: null  
- "between 300k and 500k" = min: 300000, max: 500000
- "around 400k" = min: 350000, max: 450000 (approximate range)
- "budget of 500k" = max: 500000, min: null
- "up to 500k" = max: 500000, min: null`
        },
        {
          role: 'user',
          content: `Extract information from this conversation:\n\n${messages.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n')}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    })
    
    interface ProfileData {
      contactInfo?: {
        name?: string | null
        email?: string | null
        phone?: string | null
      }
      propertyPreferences?: {
        propertyType?: string | null
        bedrooms?: number | null
        bathrooms?: number | null
        priceRange?: { min?: number; max?: number } | null
        location?: string | null
      }
      neighborhoodPreferences?: {
        priority?: string | null
        transportation?: string | null
        specificNeeds?: string[] | null
      }
      timeline?: {
        when?: string | null
        currentSituation?: string | null
      }
      leadScore?: number
      notes?: string | null
    }
    
    const profileData = JSON.parse(completion.choices[0]?.message?.content || '{}') as ProfileData
    
    // Note: CustomerProfile model doesn't exist in current schema
    // Would need to create a Lead or Customer record instead
    // For now, we'll return the extracted data without storing it
    
    const extractedProfile = {
      contactInfo: {
        name: profileData.contactInfo?.name || null,
        email: profileData.contactInfo?.email || null,
        phone: profileData.contactInfo?.phone || null
      },
      propertyPreferences: {
        propertyType: profileData.propertyPreferences?.propertyType || null,
        bedrooms: profileData.propertyPreferences?.bedrooms || null,
        bathrooms: profileData.propertyPreferences?.bathrooms || null,
        priceRange: profileData.propertyPreferences?.priceRange || null,
        location: profileData.propertyPreferences?.location || null
      },
      neighborhoodPreferences: {
        priority: profileData.neighborhoodPreferences?.priority || null,
        transportation: profileData.neighborhoodPreferences?.transportation || null,
        specificNeeds: profileData.neighborhoodPreferences?.specificNeeds || []
      },
      timeline: {
        when: profileData.timeline?.when || null,
        currentSituation: profileData.timeline?.currentSituation || null
      },
      leadScore: profileData.leadScore || 0,
      notes: profileData.notes || null,
      isQualified: (profileData.leadScore || 0) >= 50 && 
                   (profileData.contactInfo?.email || profileData.contactInfo?.phone)
    }
    
    return NextResponse.json({
      success: true,
      profile: extractedProfile
    })
    
  } catch (error) {
    console.error('Profile extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract profile' },
      { status: 500 }
    )
  }
}
