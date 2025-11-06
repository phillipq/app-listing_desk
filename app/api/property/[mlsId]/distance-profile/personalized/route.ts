import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { distanceProfileService } from '../../../../../../lib/distance-profile-service'
import { prisma } from '../../../../../../lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mlsId: string }> }
) {
  try {
    const { mlsId } = await params
    const body = await request.json() as { leadId?: string; categories?: string[] }
    const { leadId: _leadId, categories } = body
    
    // Get the current session to verify the realtor
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Find the realtor
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id }
    })
    
    if (!realtor) {
      return NextResponse.json({ error: 'Realtor not found' }, { status: 404 })
    }
    
    // Get the property
    const property = await prisma.property.findFirst({
      where: { mlsId, realtorId: realtor.id }
    })
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    // Get lead preferences if leadId is provided
    const _leadPreferences: { selectedCategories?: string[] } | null = null
    
    // Use provided categories or lead preferences
    const categoryArray = categories || [
      'schools', 'hospitals', 'parks', 'shopping', 'dining', 'gyms', 'transit_stations'
    ]
    
    // Convert array to Record<string, boolean> format
    const amenityCategories = categoryArray.reduce((acc, category) => {
      acc[category] = true
      return acc
    }, {} as Record<string, boolean>)
    
    // Generate personalized distance profile
    const profile = await distanceProfileService.generateDistanceProfile({
      propertyId: property.id,
      realtorId: session.user.id,
      isAdHoc: false,
      categories: amenityCategories
    })
    
    return NextResponse.json({
      success: true,
      profile,
      personalized: true,
      categories: amenityCategories,
      leadPreferences: {
        hasPreferences: false
      }
    })
    
  } catch (error) {
    console.error('Error generating personalized distance profile:', error)
    return NextResponse.json(
      { error: 'Failed to generate personalized distance profile' },
      { status: 500 }
    )
  }
}
