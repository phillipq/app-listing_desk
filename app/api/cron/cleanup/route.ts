import { NextRequest, NextResponse } from 'next/server'
import { mlsCleanupService } from '../../../../lib/mls-cleanup'
import { mlsFreshnessService } from '../../../../lib/mls-freshness'

// Verify the request is from a legitimate source
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (!cronSecret) {
    console.warn('⚠️ CRON_SECRET not set - cleanup endpoint is disabled')
    return false
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  
  const token = authHeader.substring(7)
  return token === cronSecret
}

export async function GET(_request: NextRequest) {
  try {
    // Get cleanup statistics
    const stats = await mlsFreshnessService.getFreshnessStats()
    const healthScore = await mlsFreshnessService.getHealthScore()
    
    return NextResponse.json({
      success: true,
      stats: {
        totalProperties: stats.totalProperties,
        freshProperties: stats.freshProperties,
        staleProperties: stats.staleProperties,
        expiredProperties: stats.expiredProperties,
        healthScore,
        lastUpdated: stats.lastUpdated
      }
    })
  } catch (error) {
    console.error('Error getting cleanup stats:', error)
    return NextResponse.json(
      { error: 'Failed to get cleanup stats' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the request is legitimate
    if (!verifyCronRequest(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🧹 Starting MLS cleanup process...')
    
    // Run cleanup process (performs its own query for stale properties)
    const cleanupResults = await mlsCleanupService.performDailyCleanup()
    
    console.log(`✅ Cleanup completed: ${cleanupResults.updatedProperties} updated, ${cleanupResults.removedProperties} removed`)
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      updated: cleanupResults.updatedProperties,
      removed: cleanupResults.removedProperties,
      errors: cleanupResults.errors
    })
    
  } catch (error) {
    console.error('Error during cleanup:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Cleanup failed', details: errorMessage },
      { status: 500 }
    )
  }
}