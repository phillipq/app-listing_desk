/**
 * Package Access Control Utilities
 */

import { prisma } from '@/lib/prisma'
import { getFeatureAccess } from './features'

export interface UserPackageInfo {
  slug: string
  name: string
  type: 'base' | 'addon'
  status: string
}

/**
 * Check if user has access to required packages
 */
export async function checkPackageAccess(
  userId: string,
  requiredPackages: string[]
): Promise<boolean> {
  if (!userId) return false
  
  const userPackages = await prisma.userPackage.findMany({
    where: {
      userId,
      status: 'active',
      OR: [
        { expiresAt: null }, // Never expires
        { expiresAt: { gte: new Date() } } // Not expired yet
      ]
    },
    include: {
      package: true
    }
  })
  
  const userPackageSlugs = userPackages
    .map(up => up.package.slug)
    .filter(Boolean)
  
  // Check if user has at least one required package
  return requiredPackages.some(slug => userPackageSlugs.includes(slug))
}

/**
 * Get user's active packages
 */
export async function getUserPackages(userId: string): Promise<UserPackageInfo[]> {
  const userPackages = await prisma.userPackage.findMany({
    where: {
      userId,
      status: 'active',
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    },
    include: {
      package: true
    }
  })
  
  return userPackages.map(up => ({
    slug: up.package.slug,
    name: up.package.name,
    type: up.package.type as 'base' | 'addon',
    status: up.status
  }))
}

/**
 * Get user's package slugs (for quick checks)
 */
export async function getUserPackageSlugs(userId: string): Promise<string[]> {
  const packages = await getUserPackages(userId)
  return packages.map(p => p.slug)
}

/**
 * Check if user can access a specific page
 */
export async function canAccessPage(
  userId: string,
  pagePath: string
): Promise<boolean> {
  const feature = getFeatureAccess(pagePath)
  
  if (!feature) {
    // No access control defined - allow access by default
    // (or deny by default, depending on your preference)
    return true
  }
  
  return checkPackageAccess(userId, feature.requiredPackages)
}

/**
 * Check if user has base package
 */
export async function hasBasePackage(userId: string): Promise<boolean> {
  const packages = await getUserPackages(userId)
  return packages.some(p => p.type === 'base')
}

/**
 * Check if user has specific package
 */
export async function hasPackage(
  userId: string,
  packageSlug: string
): Promise<boolean> {
  const slugs = await getUserPackageSlugs(userId)
  return slugs.includes(packageSlug)
}

