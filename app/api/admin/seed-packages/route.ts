import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { isAdmin } from '@/lib/admin-auth'
import { authOptions } from '@/lib/auth'
import { seedDefaultPackages } from '@/lib/packages/service'

/**
 * POST /api/admin/seed-packages
 * Seed the 4 Stripe subscription packages
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

    await seedDefaultPackages()

    return NextResponse.json({
      success: true,
      message: 'Packages seeded successfully'
    })
  } catch (error) {
    console.error('Error seeding packages:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed packages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

