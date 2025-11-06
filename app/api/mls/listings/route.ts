import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    const city = searchParams.get('city')
    const province = searchParams.get('province')
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined
    const minBedrooms = searchParams.get('minBedrooms') ? parseInt(searchParams.get('minBedrooms')!) : undefined
    const maxBedrooms = searchParams.get('maxBedrooms') ? parseInt(searchParams.get('maxBedrooms')!) : undefined
    const propertyType = searchParams.get('propertyType')
    const status = searchParams.get('status') || 'active'

    // Build where clause
    const where: {
      realtorId: string
      status?: string
      city?: { contains: string; mode: 'insensitive' }
      province?: { contains: string; mode: 'insensitive' }
      price?: { gte?: number; lte?: number }
      bedrooms?: { gte?: number; lte?: number }
      propertyType?: { contains: string; mode: 'insensitive' }
    } = {
      realtorId: session.user.id,
      status: status || 'active'
    }

    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (province) where.province = { contains: province, mode: 'insensitive' }
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = minPrice
      if (maxPrice) where.price.lte = maxPrice
    }
    if (minBedrooms || maxBedrooms) {
      where.bedrooms = {}
      if (minBedrooms) where.bedrooms.gte = minBedrooms
      if (maxBedrooms) where.bedrooms.lte = maxBedrooms
    }
    if (propertyType) where.propertyType = { contains: propertyType, mode: 'insensitive' }

    // Get properties with pagination
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.property.count({ where })
    ])

    return NextResponse.json({
      success: true,
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('MLS listings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MLS listings' },
      { status: 500 }
    )
  }
}
