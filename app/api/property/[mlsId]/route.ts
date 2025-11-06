import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId } = await params

    // Get property from database
    const property = await prisma.property.findFirst({
      where: {
        mlsId,
        realtorId: session.user.id,
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
        squareFootage: true,
        status: true,
        images: true,
        description: true,
        listDate: true,
        daysOnMarket: true,
        yearBuilt: true,
        rawData: true,
        latitude: true,
        longitude: true
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ property })

  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId } = await params
    const body = await request.json() as {
      address?: string
      city?: string
      province?: string
      postalCode?: string
      price?: number
      bedrooms?: number
      bathrooms?: number
      propertyType?: string
      description?: string
      squareFootage?: number
      yearBuilt?: number
      lotSize?: number
      latitude?: number
      longitude?: number
      features?: string[]
    }

    // Check if property exists and belongs to the user
    const existingProperty = await prisma.property.findFirst({
      where: {
        mlsId,
        realtorId: session.user.id,
        status: 'active'
      }
    })

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Build update data object
    const updateData: {
      address?: string
      city?: string
      province?: string
      postalCode?: string | null
      price?: number
      bedrooms?: number
      bathrooms?: number
      propertyType?: string
      description?: string | null
      squareFootage?: number | null
      yearBuilt?: number | null
      latitude?: number | null
      longitude?: number | null
      rawData?: Prisma.InputJsonValue
    } = {}

    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.province !== undefined) updateData.province = body.province
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode || null
    if (body.price !== undefined) updateData.price = body.price
    if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms
    if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.squareFootage !== undefined) updateData.squareFootage = body.squareFootage || null
    if (body.yearBuilt !== undefined) updateData.yearBuilt = body.yearBuilt || null
    if (body.latitude !== undefined) updateData.latitude = body.latitude || null
    if (body.longitude !== undefined) updateData.longitude = body.longitude || null

    // Update rawData to include features if provided
    if (body.features !== undefined) {
      const currentRawData = existingProperty.rawData as Record<string, unknown> || {}
      updateData.rawData = {
        ...currentRawData,
        features: body.features,
        source: currentRawData.source || 'manual',
        manualEntry: true,
        entryDate: currentRawData.entryDate || new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      } as Prisma.InputJsonValue
    }

    // Update the property
    const updatedProperty = await prisma.property.update({
      where: { mlsId },
      data: updateData,
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
        images: true,
        rawData: true
      }
    })

    // Regenerate embeddings for the updated property (async, don't block response)
    const { vectorSearchService } = await import('@/lib/vector-search')
    const propertyData = {
      id: updatedProperty.id,
      mlsId: updatedProperty.mlsId || updatedProperty.id,
      address: updatedProperty.address,
      city: updatedProperty.city,
      province: updatedProperty.province,
      postalCode: updatedProperty.postalCode,
      price: updatedProperty.price,
      bedrooms: updatedProperty.bedrooms,
      bathrooms: updatedProperty.bathrooms,
      propertyType: updatedProperty.propertyType,
      description: updatedProperty.description,
      squareFootage: updatedProperty.squareFootage,
      yearBuilt: updatedProperty.yearBuilt,
      features: body.features || [],
      images: updatedProperty.images
    }

    // Generate embeddings in background (don't await to avoid blocking response)
    vectorSearchService.generateEmbeddings(propertyData)
      .then(embedding => vectorSearchService.storePropertyEmbedding(embedding))
      .then(() => console.log(`✅ Regenerated embeddings for property ${updatedProperty.mlsId}`))
      .catch(error => console.error(`❌ Error regenerating embeddings for property ${updatedProperty.mlsId}:`, error))

    return NextResponse.json({
      success: true,
      property: updatedProperty
    })

  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mlsId } = await params

    // Check if property exists and belongs to the user
    const property = await prisma.property.findFirst({
      where: {
        mlsId,
        realtorId: session.user.id,
        status: 'active'
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Soft delete the property by setting status
    await prisma.property.update({
      where: { mlsId },
      data: { status: 'inactive' }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}
