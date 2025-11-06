import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { MLSFilters, mlsService } from '../../../../lib/mls'
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
    
    // Parse filters from query parameters
    const filters: MLSFilters = {
      city: searchParams.get('city') || undefined,
      province: searchParams.get('province') || undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minBedrooms: searchParams.get('minBedrooms') ? parseInt(searchParams.get('minBedrooms')!) : undefined,
      maxBedrooms: searchParams.get('maxBedrooms') ? parseInt(searchParams.get('maxBedrooms')!) : undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      status: searchParams.get('status') || undefined,
      neighborhood: searchParams.get('neighborhood') || undefined
    }

    // Fetch properties from MLS
    const mlsProperties = await mlsService.fetchProperties(filters)

    // Store/update properties in database
    const storedProperties = []
    for (const mlsProperty of mlsProperties) {
      try {
        const property = await prisma.property.upsert({
          where: { mlsId: mlsProperty.mlsId },
          update: {
            address: mlsProperty.address,
            city: mlsProperty.city,
            province: mlsProperty.province,
            postalCode: mlsProperty.postalCode,
            price: mlsProperty.price,
            bedrooms: mlsProperty.bedrooms,
            bathrooms: mlsProperty.bathrooms,
            propertyType: mlsProperty.propertyType,
            squareFootage: mlsProperty.squareFootage,
            yearBuilt: mlsProperty.yearBuilt,
            description: mlsProperty.description,
            images: mlsProperty.images || [],
            status: mlsProperty.status || 'active',
            listDate: mlsProperty.listDate,
            daysOnMarket: mlsProperty.daysOnMarket,
            latitude: mlsProperty.latitude,
            longitude: mlsProperty.longitude,
            // Store all MLS property data in rawData JSON field
            rawData: mlsProperty as unknown as Prisma.InputJsonValue
          },
          create: {
            realtorId: session.user.id,
            mlsId: mlsProperty.mlsId,
            address: mlsProperty.address,
            city: mlsProperty.city,
            province: mlsProperty.province,
            postalCode: mlsProperty.postalCode,
            price: mlsProperty.price,
            bedrooms: mlsProperty.bedrooms,
            bathrooms: mlsProperty.bathrooms,
            propertyType: mlsProperty.propertyType,
            squareFootage: mlsProperty.squareFootage,
            yearBuilt: mlsProperty.yearBuilt,
            description: mlsProperty.description,
            images: mlsProperty.images || [],
            status: mlsProperty.status || 'active',
            listDate: mlsProperty.listDate,
            daysOnMarket: mlsProperty.daysOnMarket,
            latitude: mlsProperty.latitude,
            longitude: mlsProperty.longitude,
            // Store all MLS property data in rawData JSON field
            rawData: mlsProperty as unknown as Prisma.InputJsonValue
          }
        })
        storedProperties.push(property)
      } catch (error) {
        console.error(`Error storing property ${mlsProperty.mlsId}:`, error)
        // Continue with other properties even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      count: storedProperties.length,
      properties: storedProperties
    })

  } catch (error) {
    console.error('MLS properties fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MLS properties' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as { 
      searchCriteria?: {
        location?: string
        priceRange?: { min: number; max: number }
        bedrooms?: number
        bathrooms?: number
        propertyType?: string
        features?: string[]
      }
    }
    const { searchCriteria } = body

    // Search properties based on criteria
    const mlsProperties = await mlsService.searchProperties(searchCriteria || {})

    // Store properties in database
    const storedProperties = []
    for (const mlsProperty of mlsProperties) {
      try {
        const property = await prisma.property.upsert({
          where: { mlsId: mlsProperty.mlsId },
          update: {
            // Update existing properties with fresh data
            price: mlsProperty.price,
            status: mlsProperty.status || 'active',
            // Store all MLS property data in rawData JSON field
            rawData: mlsProperty as unknown as Prisma.InputJsonValue
          },
          create: {
            realtorId: session.user.id,
            mlsId: mlsProperty.mlsId,
            address: mlsProperty.address,
            city: mlsProperty.city,
            province: mlsProperty.province,
            postalCode: mlsProperty.postalCode,
            price: mlsProperty.price,
            bedrooms: mlsProperty.bedrooms,
            bathrooms: mlsProperty.bathrooms,
            propertyType: mlsProperty.propertyType,
            squareFootage: mlsProperty.squareFootage,
            yearBuilt: mlsProperty.yearBuilt,
            description: mlsProperty.description,
            images: mlsProperty.images || [],
            status: mlsProperty.status || 'active',
            listDate: mlsProperty.listDate,
            daysOnMarket: mlsProperty.daysOnMarket,
            latitude: mlsProperty.latitude,
            longitude: mlsProperty.longitude,
            // Store all MLS property data in rawData JSON field
            rawData: mlsProperty as unknown as Prisma.InputJsonValue
          }
        })
        storedProperties.push(property)
      } catch (error) {
        console.error(`Error storing property ${mlsProperty.mlsId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      count: storedProperties.length,
      properties: storedProperties
    })

  } catch (error) {
    console.error('MLS search error:', error)
    return NextResponse.json(
      { error: 'Failed to search MLS properties' },
      { status: 500 }
    )
  }
}
