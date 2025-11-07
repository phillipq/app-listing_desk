/**
 * Admin Dashboard Statistics
 */

import { prisma } from '@/lib/prisma'

export interface RevenueStats {
  totalRevenue: number
  monthlyRevenue: number
  activeSubscriptions: number
  totalUsers: number
  usersByPackage: Array<{
    packageName: string
    packageSlug: string
    count: number
    revenue: number
  }>
  recentSubscriptions: Array<{
    id: string
    userName: string
    packageName: string
    amount: number
    status: string
    createdAt: Date
  }>
}

/**
 * Get revenue statistics for admin dashboard
 */
export async function getRevenueStats(): Promise<RevenueStats> {
  // Get all active subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active'
    },
    include: {
      package: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  // Calculate total revenue (all time)
  const allSubscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'cancelled', 'past_due'] }
    },
    include: {
      package: true
    }
  })

  // Calculate monthly revenue (current month)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlySubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
      currentPeriodStart: {
        gte: startOfMonth
      }
    },
    include: {
      package: true
    }
  })

  // Calculate totals
  const totalRevenue = allSubscriptions.reduce((sum: number, sub) => {
    return sum + (sub.package.price ? Number(sub.package.price) : 0)
  }, 0)

  const monthlyRevenue = monthlySubscriptions.reduce((sum: number, sub) => {
    return sum + (sub.package.price ? Number(sub.package.price) : 0)
  }, 0)

  // Group by package
  const packageStats = new Map<string, { count: number; revenue: number; name: string; slug: string }>()
  
  subscriptions.forEach(sub => {
    const slug = sub.package.slug
    const price = sub.package.price ? Number(sub.package.price) : 0
    
    if (!packageStats.has(slug)) {
      packageStats.set(slug, {
        count: 0,
        revenue: 0,
        name: sub.package.name,
        slug: sub.package.slug
      })
    }
    
    const stat = packageStats.get(slug)!
    stat.count++
    stat.revenue += price
  })

  // Get recent subscriptions (last 10)
  const recentSubscriptions = await prisma.subscription.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      package: true,
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  // Total users count
  const totalUsers = await prisma.realtor.count({
    where: {
      isAdmin: false // Don't count admins
    }
  })

  return {
    totalRevenue,
    monthlyRevenue,
    activeSubscriptions: subscriptions.length,
    totalUsers,
    usersByPackage: Array.from(packageStats.values()).map(stat => ({
      packageName: stat.name,
      packageSlug: stat.slug,
      count: stat.count,
      revenue: stat.revenue
    })),
    recentSubscriptions: recentSubscriptions.map(sub => ({
      id: sub.id,
      userName: sub.user.name || sub.user.email,
      packageName: sub.package.name,
      amount: sub.package.price ? Number(sub.package.price) : 0,
      status: sub.status,
      createdAt: sub.createdAt
    }))
  }
}

