import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all custom search terms for the realtor
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get realtor by session user ID
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id }
    })

    if (!realtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    const searchTerms = await prisma.customSearchTerm.findMany({
      where: {
        realtorId: realtor.id,
        isActive: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      searchTerms
    })
  } catch (error) {
    console.error('Error fetching custom search terms:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to fetch search terms', details: message },
      { status: 500 }
    )
  }
}

// POST - Create new custom search term(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as {
      keywords: string[]
      location?: string
      category?: string
    }

    if (!body.keywords || !Array.isArray(body.keywords) || body.keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Keywords array is required' },
        { status: 400 }
      )
    }

    if (body.keywords.length > 3) {
      return NextResponse.json(
        { success: false, error: 'Maximum 3 search terms allowed' },
        { status: 400 }
      )
    }

    // Get realtor
    const realtor = await prisma.realtor.findUnique({
      where: { email: session.user.email || '' }
    })

    if (!realtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // Delete existing active terms and create new ones
    await prisma.customSearchTerm.updateMany({
      where: {
        realtorId: realtor.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // Create new search terms
    const created = await Promise.all(
      body.keywords.map(keyword =>
        prisma.customSearchTerm.create({
          data: {
            keyword: keyword.trim(),
            location: body.location || null,
            category: body.category || null,
            realtorId: realtor.id,
            isActive: true
          }
        })
      )
    )

    return NextResponse.json({
      success: true,
      searchTerms: created,
      message: 'Search terms saved successfully'
    })
  } catch (error) {
    console.error('Error creating custom search terms:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to create search terms', details: message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific custom search term
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the search term ID from query params
    const { searchParams } = new URL(request.url)
    const termId = searchParams.get('id')
    
    if (!termId) {
      return NextResponse.json(
        { success: false, error: 'Search term ID is required' },
        { status: 400 }
      )
    }

    // Get realtor
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id }
    })

    if (!realtor) {
      return NextResponse.json(
        { success: false, error: 'Realtor not found' },
        { status: 404 }
      )
    }

    // Verify the search term belongs to this realtor and delete it
    const deleted = await prisma.customSearchTerm.deleteMany({
      where: {
        id: termId,
        realtorId: realtor.id
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Search term not found or you do not have permission to delete it' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Search term deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting custom search term:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to delete search term', details: message },
      { status: 500 }
    )
  }
}

