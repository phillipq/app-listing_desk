import { NextRequest, NextResponse } from 'next/server'
import { adminApiMiddleware } from '@/lib/admin-auth'
import { assignPackageToUser, removePackageFromUser } from '@/lib/packages/service'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin access
  const authCheck = await adminApiMiddleware(request)
  if (authCheck) return authCheck

  try {
    const { packageIds } = await request.json() as { packageIds: string[] }

    if (!Array.isArray(packageIds)) {
      return NextResponse.json(
        { error: 'packageIds must be an array' },
        { status: 400 }
      )
    }

    const { id: userId } = await params

    // Verify user exists
    const user = await prisma.realtor.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get current active packages
    const currentPackages = await prisma.userPackage.findMany({
      where: {
        userId,
        status: 'active'
      }
    })

    const currentPackageIds = currentPackages.map(p => p.packageId)
    
    // Packages to add
    const toAdd = packageIds.filter(id => !currentPackageIds.includes(id))
    
    // Packages to remove
    const toRemove = currentPackageIds.filter(id => !packageIds.includes(id))

    // Validate: Only one base package
    const allPackages = await prisma.package.findMany({
      where: { id: { in: packageIds } }
    })

    const basePackages = allPackages.filter(p => p.type === 'base')
    if (basePackages.length > 1) {
      return NextResponse.json(
        { error: 'User can only have one base package' },
        { status: 400 }
      )
    }

    // Remove packages
    for (const packageId of toRemove) {
      await removePackageFromUser(userId, packageId)
    }

    // Add packages
    for (const packageId of toAdd) {
      await assignPackageToUser(userId, packageId)
    }

    // Update user subscription status
    const activePackagesCount = packageIds.length
    const newStatus = activePackagesCount > 0 ? 'active' : 'inactive'

    // Get base package for subscription creation
    const basePackage = basePackages[0]

    await prisma.realtor.update({
      where: { id: userId },
      data: { 
        subscriptionStatus: newStatus
        // Note: User type is determined dynamically from subscription, not stored on Realtor model
      }
    })

    // Create or update subscription if we have a base package
    if (basePackage && activePackagesCount > 0) {
      // Check if subscription already exists
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          packageId: basePackage.id,
          status: { in: ['active', 'trialing'] }
        }
      })

      if (!existingSubscription) {
        // Create a subscription record
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)

        await prisma.subscription.create({
          data: {
            userId,
            packageId: basePackage.id,
            stripeSubscriptionId: `sub_admin_${Date.now()}`,
            stripeCustomerId: user.stripeCustomerId || `cus_admin_${Date.now()}`,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: false
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Packages updated successfully',
      added: toAdd.length,
      removed: toRemove.length
    })
  } catch (error) {
    console.error('Error updating user packages:', error)
    return NextResponse.json(
      { error: 'Failed to update packages', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

