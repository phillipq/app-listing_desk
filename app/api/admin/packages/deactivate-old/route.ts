import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isAdmin } from '@/lib/admin-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/admin/packages/deactivate-old
 * Deactivate old packages (real_estate, business, communications)
 * Admin only
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Deactivate old packages
    const oldPackageSlugs = ['real_estate', 'business', 'communications']
    
    const result = await prisma.package.updateMany({
      where: {
        slug: {
          in: oldPackageSlugs
        }
      },
      data: {
        isActive: false
      }
    })

    return NextResponse.json({
      success: true,
      message: `Deactivated ${result.count} old package(s)`,
      deactivated: result.count
    })
  } catch (error) {
    console.error('Error deactivating old packages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to deactivate packages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

