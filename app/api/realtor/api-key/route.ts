import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { v4 as uuidv4 } from 'uuid'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { apiKey: true, name: true, domain: true }
    })

    if (!realtor) {
      return NextResponse.json(
        { error: 'Realtor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      apiKey: realtor.apiKey,
      name: realtor.name,
      domain: realtor.domain
    })

  } catch (error) {
    console.error('API key fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    )
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate new API key
    const newApiKey = `realtor_${uuidv4().replace(/-/g, '')}`

    const updatedRealtor = await prisma.realtor.update({
      where: { id: session.user.id },
      data: { apiKey: newApiKey },
      select: { apiKey: true, name: true, domain: true }
    })

    return NextResponse.json({
      apiKey: updatedRealtor.apiKey,
      name: updatedRealtor.name,
      domain: updatedRealtor.domain
    })

  } catch (error) {
    console.error('API key generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}
