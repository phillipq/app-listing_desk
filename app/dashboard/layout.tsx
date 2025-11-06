import { PrismaClient } from '@prisma/client'
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import CollapsibleSidebar from "@/components/CollapsibleSidebar"
import { isAdmin } from "@/lib/admin-auth"
import { getUserTypeFromPlan, hasCommunicationsAccess } from '@/lib/subscription-access'
import { UserTier } from "@/lib/user-tiers"
import { authOptions } from "../../lib/auth"

const prisma = new PrismaClient()

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Get user tier and role from database
  let userTier = UserTier.REALTOR_PRO // Default fallback
  let userRole = 'realtor' // Default fallback
  let hasCommunications = false
  
  try {
    // First, try to get user type from subscription plan
    // Pass email because userId might be NextAuth User.id, but subscriptions use Realtor.id
    console.log('[Dashboard Layout] Calling getUserTypeFromPlan with userId:', session.user.id, 'email:', session.user.email)
    const planUserType = await getUserTypeFromPlan(session.user.id, session.user.email || undefined)
    console.log('[Dashboard Layout] getUserTypeFromPlan returned:', planUserType)
    if (planUserType) {
      userRole = planUserType
      console.log('[Dashboard Layout] User role from plan:', planUserType)
    } else {
      console.log('[Dashboard Layout] No plan user type found, will use fallback')
    }

    // Check if user has communications access
    hasCommunications = await hasCommunicationsAccess(session.user.id, session.user.email || undefined)
    console.log('[Dashboard Layout] hasCommunications:', hasCommunications)

    // Check if user exists in Realtor table (current auth system)
    const realtor = await prisma.realtor.findUnique({
      where: { email: session.user.email! }
    })
    
    if (realtor) {
      // Check if this realtor also has business capabilities
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
      })
      
      if (user) {
        // User has both realtor and business capabilities
        userTier = UserTier.REALTOR_PRO
        userRole = 'both' // Special role that shows both tool sets
      } else if (!planUserType) {
        // Standard realtor (only if we didn't get type from plan)
        userTier = UserTier.REALTOR_PRO
        userRole = 'realtor'
      }
    } else {
      // Check if user exists in User table (new system)
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! }
      })
      
      if (user) {
        // Map tier string to UserTier enum with fallbacks
        userTier = user.tier === 'realtor_pro' ? UserTier.REALTOR_PRO : 
                   user.tier === 'business_pro' ? UserTier.ALL_IN_ONE_SOCIAL : 
                   UserTier.STARTER
        if (!planUserType) {
          userRole = user.role || 'realtor'
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    // Use defaults if database query fails
  }

  // Check if user is admin - use the same helper function as admin layout
  let isUserAdmin = false
  try {
    isUserAdmin = await isAdmin(session.user.id)
    
    // If admin check by ID fails, try by email
    if (!isUserAdmin && session.user.email) {
      const realtorByEmail = await prisma.realtor.findUnique({
        where: { email: session.user.email },
        select: { isAdmin: true }
      })
      isUserAdmin = realtorByEmail?.isAdmin === true
    }
    
    // Debug log
    console.log(`[Dashboard Layout /dashboard] User ID: ${session.user.id}, Email: ${session.user.email}, Admin: ${isUserAdmin}`)
  } catch (error) {
    console.error('[Dashboard Layout /dashboard] Error checking admin:', error)
  }

  console.log('[Dashboard Layout] Final values - userRole:', userRole, 'userTier:', userTier, 'hasCommunications:', hasCommunications)

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      <div className="flex h-full">
        <CollapsibleSidebar 
          userTier={userTier} 
          userRole={userRole} 
          isAdmin={isUserAdmin}
          hasCommunications={hasCommunications}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
