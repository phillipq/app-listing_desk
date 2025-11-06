/**
 * Property Numbering System
 * 
 * MLS properties: MLS{number} (e.g., MLS12345, MLS-A12345, MLS-SK12345)
 * Manual properties: TLD{8-digit-number} (e.g., TLD10000001, TLD12345678)
 */

import { prisma } from '@/lib/prisma'

const TLD_START_NUMBER = 10000000 // Start at 10 million (TLD10000000)
const TLD_PREFIX = 'TLD'

/**
 * Check if an mlsId is a TLD (manual) property
 */
export function isTLDProperty(mlsId: string | null | undefined): boolean {
  if (!mlsId) return false
  return mlsId.startsWith(TLD_PREFIX)
}

/**
 * Check if an mlsId is an MLS property
 */
export function isMLSProperty(mlsId: string | null | undefined): boolean {
  if (!mlsId) return false
  return mlsId.toUpperCase().startsWith('MLS')
}

/**
 * Get the next available TLD number
 * Finds the highest existing TLD number and increments it, or starts at TLD_START_NUMBER
 */
export async function getNextTLDNumber(): Promise<string> {
  // Find all properties with TLD prefix
  const tldProperties = await prisma.property.findMany({
    where: {
      mlsId: {
        startsWith: TLD_PREFIX
      }
    },
    select: {
      mlsId: true
    },
    orderBy: {
      mlsId: 'desc'
    },
    take: 1 // Only need the highest one
  })

  if (tldProperties.length === 0 || !tldProperties[0]?.mlsId) {
    // No TLD properties exist yet, start at the beginning
    return `${TLD_PREFIX}${String(TLD_START_NUMBER).padStart(8, '0')}`
  }

  // Extract the number from the highest TLD ID
  const highestTLD = tldProperties[0].mlsId
  const numberPart = highestTLD.replace(TLD_PREFIX, '')
  const nextNumber = parseInt(numberPart, 10) + 1

  // Ensure we don't go below the start number (safety check)
  const finalNumber = Math.max(nextNumber, TLD_START_NUMBER)

  // Format as 8-digit number with leading zeros if needed
  return `${TLD_PREFIX}${String(finalNumber).padStart(8, '0')}`
}

/**
 * Format MLS ID for display
 */
export function formatPropertyNumber(mlsId: string | null | undefined): string {
  if (!mlsId) return 'N/A'
  
  if (isTLDProperty(mlsId)) {
    // TLD properties: display as "TLD12345678"
    return mlsId
  }
  
  if (isMLSProperty(mlsId)) {
    // MLS properties: display as "MLS12345" or keep original format
    return mlsId
  }
  
  // Unknown format, return as-is
  return mlsId
}

