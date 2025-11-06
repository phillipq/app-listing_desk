import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get specific realtor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const realtor = await prisma.realtor.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        isAdmin: true,
        isActive: true,
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
    console.error('❌ Error fetching realtor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch realtor' },
      { status: 500 }
    )
  }
}

// PUT - Update realtor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json() as {
      name?: string
      email?: string
      domain?: string
      isAdmin?: boolean
      isActive?: boolean
      password?: string
    }
    const { name, email, domain, isAdmin, isActive, password } = body

    // Check if email is already taken by another realtor
    if (email) {
      const existingRealtor = await prisma.realtor.findFirst({
        where: {
          email: email,
          id: { not: id }
        }
      })

      if (existingRealtor) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another realtor' },
          { status: 400 }
        )
      }
    }

    // Check if domain is already taken by another realtor
    if (domain) {
      const existingDomain = await prisma.realtor.findFirst({
        where: {
          domain: domain,
          id: { not: id }
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
      isAdmin?: boolean
      isActive?: boolean
      password?: string
    } = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (domain !== undefined) updateData.domain = domain
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin
    if (isActive !== undefined) updateData.isActive = isActive
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedRealtor = await prisma.realtor.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        isAdmin: true,
        isActive: true,
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
      }
    })
  } catch (error) {
    console.error('❌ Error updating realtor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update realtor' },
      { status: 500 }
    )
  }
}

// DELETE - Delete realtor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if realtor exists
    const realtor = await prisma.realtor.findUnique({
      where: { id },
      select: { id: true, isAdmin: true }
    })

    if (!realtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // Prevent deleting admin users
    if (realtor.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin users' },
        { status: 400 }
      )
    }

    // Delete realtor (cascade will handle related records)
    await prisma.realtor.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Realtor deleted successfully'
    })
  } catch (error) {
    console.error('❌ Error deleting realtor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete realtor' },
      { status: 500 }
    )
  }
}
