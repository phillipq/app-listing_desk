import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('Properties API - Session:', session?.user?.id)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Properties API - Fetching properties for realtor:', session.user.id)
    
    const properties = await prisma.property.findMany({
      where: {
        realtorId: session.user.id,
        status: 'active'
      },
      select: {
        id: true,
        mlsId: true,
        address: true,
        city: true,
        province: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        propertyType: true,
        latitude: true,
        longitude: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('Properties API - Found properties:', properties.length)
    return NextResponse.json(properties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}
