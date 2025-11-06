import { DistanceProfileService } from '@/lib/distance-profile-service'

/**
 * Scheduled cleanup job for old deactivated profiles
 * Run this daily to prevent database bloat
 */
export async function runDailyCleanup() {
  try {
    console.log('🧹 Starting daily cleanup of old deactivated profiles...')
    
    const distanceProfileService = new DistanceProfileService()
    const result = await distanceProfileService.cleanupOldDeactivatedProfiles()
    
    if (result.deleted > 0) {
      console.log(`✅ Cleanup completed: Removed ${result.deleted} old profiles`)
    } else {
      console.log('✅ Cleanup completed: No old profiles to remove')
    }
    
    return result
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
    throw error
  }
}

/**
 * Manual cleanup trigger
 * Call this from admin panel or cron job
 */
export async function triggerCleanup() {
  return await runDailyCleanup()
}
