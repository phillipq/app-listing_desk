import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type PropertyWhere = Prisma.PropertyWhereInput

interface PropertyWithRelations {
  id: string
  mlsId: string | null
  facebookGroupId?: string | null
  facebookPostId?: string | null
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const source = searchParams.get('source') || 'all'
    const city = searchParams.get('city')
    const province = searchParams.get('province')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minBedrooms = searchParams.get('minBedrooms')
    const maxBedrooms = searchParams.get('maxBedrooms')
    const propertyType = searchParams.get('propertyType')
    const status = searchParams.get('status') || 'active'

    const skip = (page - 1) * limit

    // Build where clause
    const where: PropertyWhere = {
      realtorId: session.user.id,
      status: 'active'
    }

    // Add source filter
    if (source !== 'all') {
      if (source === 'mls') {
        where.mlsId = { not: null }
      } else if (source === 'facebook') {
        where.facebookPostId = { not: null }
      } else if (source === 'manual') {
        where.mlsId = { startsWith: 'TLD' }
      }
    }

    // Add other filters
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (province) where.province = { contains: province, mode: 'insensitive' }
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) (where.price as Prisma.IntFilter).gte = parseInt(minPrice)
      if (maxPrice) (where.price as Prisma.IntFilter).lte = parseInt(maxPrice)
    }
    if (minBedrooms || maxBedrooms) {
      where.bedrooms = {}
      if (minBedrooms) (where.bedrooms as Prisma.IntFilter).gte = parseInt(minBedrooms)
      if (maxBedrooms) (where.bedrooms as Prisma.IntFilter).lte = parseInt(maxBedrooms)
    }
    if (propertyType) where.propertyType = propertyType
    if (status) where.status = status

    // Get total count
    const total = await prisma.property.count({ where })

    // Get properties
    const properties = await prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    // Transform properties to include source information
    const transformedProperties = properties.map(property => ({
      id: property.id,
      mlsId: property.mlsId,
      mlsNumber: property.mlsId?.startsWith('TLD') ? undefined : property.mlsId,
      address: property.address,
      city: property.city,
      province: property.province,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      propertyType: property.propertyType,
      squareFootage: property.squareFootage,
      status: property.status,
      images: property.images,
      description: property.description,
      listDate: property.listDate?.toISOString(),
      daysOnMarket: property.daysOnMarket,
      source: property.mlsId?.startsWith('TLD') ? 'manual' : 
              (property as PropertyWithRelations).facebookPostId ? 'facebook' : 'mls',
      facebookGroupId: (property as PropertyWithRelations).facebookGroupId,
      facebookPostId: (property as PropertyWithRelations).facebookPostId
    }))

    return NextResponse.json({
      success: true,
      properties: transformedProperties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching property listings:', error)
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
  }
}
