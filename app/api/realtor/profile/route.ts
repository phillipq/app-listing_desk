import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get current realtor profile
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        isAdmin: true,
        isActive: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            properties: true,
            sessions: true
          }
        }
      }
    })

    if (!realtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      realtor: {
        ...realtor,
        propertiesCount: realtor._count.properties,
        sessionsCount: realtor._count.sessions
      }
    })
  } catch (error) {
    console.error('❌ Error fetching realtor profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update current realtor profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as {
      name?: string
      email?: string
      domain?: string
      password?: string
      currentPassword?: string
    }
    const { name, email, domain, password, currentPassword } = body

    // Get current realtor
    const currentRealtor = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, email: true, domain: true }
    })

    if (!currentRealtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // If changing password, verify current password
    if (password && currentPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, currentRealtor.password || '')
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        )
      }
    }

    // Check if email is already taken by another realtor
    if (email && email !== currentRealtor.email) {
      const existingEmail = await prisma.realtor.findFirst({
        where: {
          email: email,
          id: { not: session.user.id }
        }
      })

      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another realtor' },
          { status: 400 }
        )
      }
    }

    // Check if domain is already taken by another realtor
    if (domain && domain !== currentRealtor.domain) {
      const existingDomain = await prisma.realtor.findFirst({
        where: {
          domain: domain,
          id: { not: session.user.id }
        }
      })

      if (existingDomain) {
        return NextResponse.json(
          { success: false, error: 'Domain already in use by another realtor' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: {
      name?: string
      email?: string
      domain?: string
      password?: string
    } = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (domain !== undefined) updateData.domain = domain
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedRealtor = await prisma.realtor.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        isAdmin: true,
        isActive: true,
        apiKey: true,
        updatedAt: true,
        _count: {
          select: {
            properties: true,
            sessions: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      realtor: {
        ...updatedRealtor,
        propertiesCount: updatedRealtor._count.properties,
        sessionsCount: updatedRealtor._count.sessions
      },
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('❌ Error updating realtor profile:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to update profile', details: message },
      { status: 500 }
    )
  }
}
