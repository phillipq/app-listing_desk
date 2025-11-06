import { NextRequest, NextResponse } from 'next/server'
import { adminApiMiddleware } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE - Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const authCheck = await adminApiMiddleware(request)
  if (authCheck) return authCheck

  try {
    const { id } = await params

    // Check if user exists
    const user = await prisma.realtor.findUnique({
      where: { id },
      select: { id: true, isAdmin: true, email: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting admin users
    if (user.isAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete admin users' },
        { status: 400 }
      )
    }

    // Delete user (cascade will handle related records)
    await prisma.realtor.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: `User ${user.email} deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

