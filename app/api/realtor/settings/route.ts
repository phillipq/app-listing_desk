import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
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
      select: { name: true, domain: true }
    })

    if (!realtor) {
      return NextResponse.json(
        { error: 'Realtor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      name: realtor.name,
      domain: realtor.domain
    })

  } catch (error) {
    console.error('Settings fetch error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch settings', details: message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, domain } = await request.json() as { name?: string; domain?: string }

    const updatedRealtor = await prisma.realtor.update({
      where: { id: session.user.id },
      data: {
        name: name,
        domain: domain
      },
      select: { name: true, domain: true }
    })

    return NextResponse.json(updatedRealtor)

  } catch (error) {
    console.error('Settings update error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update settings', details: message },
      { status: 500 }
    )
  }
}
