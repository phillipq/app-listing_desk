import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import OpenAI from 'openai'
import { authOptions } from "../../../../lib/auth"
import { prisma } from "../../../../lib/prisma"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log('Debug: Extracting profiles for realtor:', session.user.id)

    // Get all leads without AI summaries (which contain profile data)
    const leadsWithoutProfiles = await prisma.lead.findMany({
      where: {
        realtorId: session.user.id,
        aiSummary: null
      },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { timestamp: 'asc' }
            }
          }
        }
      }
    })

    console.log('Debug: Found leads without profiles:', leadsWithoutProfiles.length)

    const results = []

    for (const lead of leadsWithoutProfiles) {
      // Get all messages from all conversations for this lead
      const allMessages = lead.conversations.flatMap(conv => conv.messages)
      
      if (allMessages.length < 2) {
        results.push({
          leadId: lead.id,
          status: 'skipped',
          reason: 'Not enough messages'
        })
        continue
      }

      try {
        // Build conversation history from messages
        const conversationHistory = allMessages.map(msg => ({
          role: msg.isIncoming ? 'user' : 'assistant',
          content: msg.content
        }))
        
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
              content: `Extract information from this conversation:\n\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`
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
            priceRange?: { min: number; max: number } | null
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
        
        // Update lead with AI summary (structured profile data)
        const aiSummary = JSON.stringify({
          contactInfo: profileData.contactInfo || {},
          propertyPreferences: profileData.propertyPreferences || {},
          neighborhoodPreferences: profileData.neighborhoodPreferences || {},
          timeline: profileData.timeline || {},
          leadScore: profileData.leadScore || 0,
          notes: profileData.notes || null
        })
        
        const leadScore = profileData.leadScore || 0
        const hasContactInfo = !!(profileData.contactInfo?.email || profileData.contactInfo?.phone)
        const isQualified = leadScore >= 50 && hasContactInfo
        
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            aiSummary: aiSummary,
            name: profileData.contactInfo?.name || lead.name,
            email: profileData.contactInfo?.email || lead.email,
            phone: profileData.contactInfo?.phone || lead.phone,
            isLeadReady: isQualified,
            status: isQualified ? 'qualified' : lead.status
          }
        })
        
        results.push({
          leadId: lead.id,
          status: 'success',
          leadScore: leadScore,
          isQualified: isQualified
        })
        
        console.log('Debug: Created profile for lead:', lead.id)
      } catch (error) {
        console.error('Debug: Error creating profile for lead:', lead.id, error)
        results.push({
          leadId: lead.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: 'Profile extraction completed',
      results,
      totalProcessed: results.length,
      successful: results.filter(r => r.status === 'success').length,
      errors: results.filter(r => r.status === 'error').length
    })

  } catch (error) {
    console.error("Debug extract profiles error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
