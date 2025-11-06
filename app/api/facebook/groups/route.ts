import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import FacebookAPIService from '@/lib/facebook-api'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groups = await prisma.facebookGroup.findMany({
      where: { realtorId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching Facebook groups:', error)
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { groupUrl: string; accessToken: string; scrapeInterval?: number }
    const { groupUrl, accessToken, scrapeInterval = 24 } = body

    if (!groupUrl || !accessToken) {
      return NextResponse.json({ error: 'Group URL and access token are required' }, { status: 400 })
    }

    // Extract group ID from URL
    const groupIdMatch = groupUrl.match(/groups\/(\d+)/)
    if (!groupIdMatch) {
      return NextResponse.json({ error: 'Invalid Facebook group URL' }, { status: 400 })
    }

    const groupId = groupIdMatch[1]!

    // Validate access token and get group info
    const facebookAPI = new FacebookAPIService(accessToken)
    
    if (!(await facebookAPI.validateToken())) {
      return NextResponse.json({ error: 'Invalid Facebook access token' }, { status: 400 })
    }

    const groupInfo = await facebookAPI.getGroupInfo(groupId)
    
    // Check if group already exists
    const existingGroup = await prisma.facebookGroup.findFirst({
      where: { 
        groupId: groupId,
        realtorId: session.user.id 
      }
    })

    if (existingGroup) {
      return NextResponse.json({ error: 'Group already exists' }, { status: 400 })
    }

    // Create new group
    const group = await prisma.facebookGroup.create({
      data: {
        groupId: groupId,
        name: groupInfo.name,
        description: groupInfo.description,
        url: groupUrl,
        scrapeInterval: scrapeInterval,
        nextScrape: new Date(Date.now() + scrapeInterval * 60 * 60 * 1000),
        realtorId: session.user.id
      }
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error creating Facebook group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
