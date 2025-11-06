import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../../lib/auth"
import { prisma } from "../../../../lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log('Debug: Checking leads for realtor:', session.user.id)

    // Get all leads for this realtor
    const leads = await prisma.lead.findMany({
      where: {
        realtorId: session.user.id
      },
      include: {
        conversations: {
          include: {
            messages: {
              orderBy: { timestamp: 'desc' },
              take: 3
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log('Debug: Found leads:', leads.length)

    // Extract profile data from aiSummary for leads that have it
    const leadsWithProfiles = leads.filter(lead => lead.aiSummary)
    
    return NextResponse.json({
      realtorId: session.user.id,
      leadsCount: leads.length,
      profilesCount: leadsWithProfiles.length,
      leads: leads.map(lead => {
        const allMessages = lead.conversations.flatMap(conv => conv.messages)
        
        interface ProfileData {
          contactInfo?: { email?: string; name?: string; phone?: string }
          leadScore?: number
          propertyPreferences?: unknown
          neighborhoodPreferences?: unknown
          timeline?: unknown
          notes?: string
        }
        
        let profileData: ProfileData | null = null
        
        if (lead.aiSummary) {
          try {
            profileData = JSON.parse(lead.aiSummary) as ProfileData
          } catch {
            profileData = null
          }
        }
        
        return {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          hasProfile: !!lead.aiSummary,
          profileEmail: profileData?.contactInfo?.email || lead.email,
          profileName: profileData?.contactInfo?.name || lead.name,
          leadScore: profileData?.leadScore || 0,
          isQualified: lead.isLeadReady,
          status: lead.status,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          messagesCount: allMessages.length,
          conversationsCount: lead.conversations.length,
          recentMessages: allMessages.slice(0, 3).map(m => ({
            role: m.isIncoming ? 'user' : 'assistant',
            content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
            timestamp: m.timestamp
          }))
        }
      }),
      profiles: leadsWithProfiles.map(lead => {
        interface ProfileData {
          contactInfo?: { email?: string; name?: string; phone?: string }
          leadScore?: number
        }
        
        let profileData: ProfileData | null = null
        
        if (lead.aiSummary) {
          try {
            profileData = JSON.parse(lead.aiSummary) as ProfileData
          } catch {
            profileData = null
          }
        }
        
        return {
          id: lead.id,
          email: profileData?.contactInfo?.email || lead.email,
          name: profileData?.contactInfo?.name || lead.name,
          phone: profileData?.contactInfo?.phone || lead.phone,
          leadScore: profileData?.leadScore || 0,
          isQualified: lead.isLeadReady,
          createdAt: lead.createdAt,
          leadId: lead.id
        }
      })
    })

  } catch (error) {
    console.error("Debug leads error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
