import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface MLSFreshnessStats {
  totalProperties: number
  freshProperties: number
  staleProperties: number
  expiredProperties: number
  lastUpdated: Date | null
}

export class MLSFreshnessService {
  // Track MLS data freshness
  async getFreshnessStats(): Promise<MLSFreshnessStats> {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [totalProperties, freshProperties, staleProperties, expiredProperties] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({
        where: { updatedAt: { gte: oneDayAgo } }
      }),
      prisma.property.count({
        where: { 
          updatedAt: { 
            gte: oneWeekAgo,
            lt: oneDayAgo 
          } 
        }
      }),
      prisma.property.count({
        where: { updatedAt: { lt: oneWeekAgo } }
      })
    ])

    const lastUpdated = await prisma.property.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    })

    return {
      totalProperties,
      freshProperties,
      staleProperties,
      expiredProperties,
      lastUpdated: lastUpdated?.updatedAt || null
    }
  }

  // Get properties that need updating
  async getPropertiesNeedingUpdate(limit: number = 100): Promise<Array<{ mlsId: string | null; updatedAt: Date; rawData: unknown }>> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    return await prisma.property.findMany({
      where: {
        updatedAt: {
          lt: oneDayAgo
        },
        mlsId: { not: null }
      },
      orderBy: {
        updatedAt: 'asc'
      },
      take: limit,
      select: {
        mlsId: true,
        updatedAt: true,
        rawData: true
      }
    })
  }

  // Mark property as updated
  async markPropertyUpdated(mlsId: string): Promise<void> {
    await prisma.property.update({
      where: { mlsId },
      data: { updatedAt: new Date() }
    })
  }

  // Get freshness health score (0-100)
  async getHealthScore(): Promise<number> {
    const stats = await this.getFreshnessStats()
    
    if (stats.totalProperties === 0) return 100
    
    const freshRatio = stats.freshProperties / stats.totalProperties
    const staleRatio = stats.staleProperties / stats.totalProperties
    const expiredRatio = stats.expiredProperties / stats.totalProperties
    
    // Calculate health score
    const healthScore = Math.round(
      (freshRatio * 100) + 
      (staleRatio * 50) + 
      (expiredRatio * 0)
    )
    
    return Math.max(0, Math.min(100, healthScore))
  }
}

export const mlsFreshnessService = new MLSFreshnessService()
