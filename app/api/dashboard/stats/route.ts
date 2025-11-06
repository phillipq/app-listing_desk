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

    console.log('Dashboard stats: Getting data for realtor:', session.user.id)

    // Get realtor's properties
    const properties = await prisma.property.findMany({
      where: {
        realtorId: session.user.id,
        status: "active"
      }
    })

    // Get realtor's leads
    const leads = await prisma.lead.findMany({
      where: {
        realtorId: session.user.id
      }
    })

    // Calculate stats
    const totalProperties = properties.length
    const totalSessions = 0 // No session tracking in current schema
    const totalLeads = leads.length
    const leadReadyLeads = leads.filter(lead => lead.isLeadReady).length

    const averageLeadScore = 0 // No lead scoring system in current schema

    // Get recent leads with contact info
    const recentLeads = leads
      .map(lead => ({
        id: lead.id,
        sessionId: lead.id, // Using lead ID as session ID
        email: lead.email,
        phone: lead.phone,
        name: lead.name,
        leadScore: 0, // No lead scoring in current schema
        isQualified: lead.isLeadReady,
        createdAt: lead.createdAt.toISOString(),
        lastActivity: lead.updatedAt.toISOString()
      }))
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 10) // Get 10 most recent

    const result = {
      totalProperties,
      totalSessions,
      leadReadyLeads,
      totalLeads,
      averageLeadScore,
      leads: recentLeads
    }

    console.log('Dashboard stats: Returning result:', result)

    return NextResponse.json(result)

  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
