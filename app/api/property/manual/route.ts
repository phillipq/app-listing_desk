import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNextTLDNumber } from '@/lib/property-numbering'
import { vectorSearchService } from '@/lib/vector-search'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as {
      address: string
      city: string
      province: string
      postalCode?: string
      latitude?: number
      longitude?: number
      price?: number
      bedrooms?: number
      bathrooms?: number
      propertyType?: string
      description?: string
      squareFootage?: number
      yearBuilt?: number
      lotSize?: number
      features?: string[]
    }
    console.log('Received property data:', body)
    console.log('Postal code received:', body.postalCode)
    
    const {
      address,
      city,
      province,
      postalCode: _postalCode,
      latitude,
      longitude,
      price,
      bedrooms,
      bathrooms,
      propertyType,
      description,
      squareFootage,
      yearBuilt,
      lotSize: _lotSize,
      features: _features = []
    } = body

    // Validate required fields
    if (!address || !city || !province) {
      return NextResponse.json(
        { error: 'Address, city, and province are required' },
        { status: 400 }
      )
    }

    // Validate coordinates if provided
    if (latitude && (latitude < -90 || latitude > 90)) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (longitude && (longitude < -180 || longitude > 180)) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      )
    }

    // Generate a unique TLD number for manual properties (e.g., TLD10000001)
    const mlsId = await getNextTLDNumber()

    // Create the property
    const property = await prisma.property.create({
      data: {
        realtorId: session.user.id,
        mlsId,
        address,
        city,
        province,
        postalCode: _postalCode || null,
        price: price || 0,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        propertyType: propertyType || 'residential',
        description: description || null,
        squareFootage: squareFootage || null,
        yearBuilt: yearBuilt || null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'active',
        images: [],
        rawData: {
          manualEntry: true,
          entryDate: new Date().toISOString(),
          source: 'manual',
          features: _features
        }
      }
    })

    // Generate and store embeddings for the new property (async, don't block response)
    const propertyData = {
      id: property.id,
      mlsId: property.mlsId || property.id,
      address: property.address,
      city: property.city,
      province: property.province,
      postalCode: property.postalCode,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      propertyType: property.propertyType,
      description: property.description,
      squareFootage: property.squareFootage,
      yearBuilt: property.yearBuilt,
      features: _features,
      images: property.images
    }

    // Generate embeddings in background (don't await to avoid blocking response)
    vectorSearchService.generateEmbeddings(propertyData)
      .then(embedding => vectorSearchService.storePropertyEmbedding(embedding))
      .then(() => console.log(`✅ Generated embeddings for manual property ${property.mlsId}`))
      .catch(error => console.error(`❌ Error generating embeddings for property ${property.mlsId}:`, error))

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        mlsId: property.mlsId,
        address: property.address,
        city: property.city,
        province: property.province,
        postalCode: property.postalCode,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        propertyType: property.propertyType,
        latitude: property.latitude,
        longitude: property.longitude,
        description: property.description
      }
    })

  } catch (error) {
    console.error('Error creating manual property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get manual properties (those with mlsId starting with 'TLD')
    const properties = await prisma.property.findMany({
      where: {
        realtorId: session.user.id,
        mlsId: {
          startsWith: 'TLD'
        },
        status: 'active'
      },
      select: {
        id: true,
        mlsId: true,
        address: true,
        city: true,
        province: true,
        postalCode: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
        description: true,
        squareFootage: true,
        yearBuilt: true,
        latitude: true,
        longitude: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        rawData: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    const total = await prisma.property.count({
      where: {
        realtorId: session.user.id,
        mlsId: {
          startsWith: 'TLD'
        },
        status: 'active'
      }
    })

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching manual properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}
