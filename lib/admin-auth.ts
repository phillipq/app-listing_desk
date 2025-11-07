/**
 * Admin Authentication Utilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Check if current user is an admin
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  if (!userId) {
    const session = await getServerSession(authOptions)
    userId = session?.user?.id
  }

  if (!userId) return false

  const user = await prisma.realtor.findUnique({
    where: { id: userId },
    select: { isAdmin: true }
  })

  return user?.isAdmin === true
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin(): Promise<string> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized - Please log in')
  }

  const admin = await isAdmin(session.user.id)
  
  if (!admin) {
    throw new Error('Forbidden - Admin access required')
  }

  return session.user.id
}

/**
 * Middleware for API routes - requires admin
 */
export async function adminApiMiddleware(_request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized - Please log in' },
      { status: 401 }
    )
  }

  const admin = await isAdmin(session.user.id)
  
  if (!admin) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  return null // Allowed
}

/**
 * Make a user an admin
 */
export async function makeUserAdmin(userId: string) {
  return prisma.realtor.update({
    where: { id: userId },
    data: { isAdmin: true }
  })
}

/**
 * Remove admin status from user
 */
export async function removeUserAdmin(userId: string) {
  return prisma.realtor.update({
    where: { id: userId },
    data: { isAdmin: false }
  })
}

