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

    console.log('Leads API: Getting leads for realtor:', session.user.id)

    // Get realtor's sessions
    const sessions = await prisma.session.findMany({
      where: {
        realtorId: session.user.id
      },
      include: {
        realtor: true
      }
    })

    console.log('Leads API: Found sessions:', sessions.length)

    // Get realtor's leads directly from Lead model
    const leads = await prisma.lead.findMany({
      where: {
        realtorId: session.user.id
      },
      orderBy: { createdAt: 'desc' }
    })

    // Format leads data
    const formattedLeads = leads.map(lead => ({
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

    console.log('Leads API: Returning leads:', formattedLeads.length)

    return NextResponse.json({ leads: formattedLeads })

  } catch (error) {
    console.error("Leads API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
