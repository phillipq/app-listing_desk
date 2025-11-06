import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DistanceProfileService } from '@/lib/distance-profile-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (you can add admin role check here)
    // For now, allowing any authenticated user to run cleanup
    
    const distanceProfileService = new DistanceProfileService()
    const result = await distanceProfileService.cleanupOldDeactivatedProfiles()
    
    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.deleted} old deactivated profiles`,
      deleted: result.deleted
    })
  } catch (error) {
    console.error('Error running cleanup:', error)
    return NextResponse.json(
      { error: 'Failed to run cleanup' },
      { status: 500 }
    )
  }
}
