import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 Fetching realtors for admin dashboard...')
    
    // Get all realtors (excluding admin users) with their property and session counts
    const realtors = await prisma.realtor.findMany({
      where: {
        isAdmin: false  // Exclude admin users from the main list
      },
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            sessions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Transform the data to include counts
    const realtorsWithCounts = realtors.map(realtor => ({
      id: realtor.id,
      name: realtor.name,
      email: realtor.email,
      domain: realtor.domain,
      isAdmin: realtor.isAdmin,
      isActive: realtor.isActive,
      createdAt: realtor.createdAt.toISOString(),
      propertiesCount: realtor._count.properties,
      sessionsCount: realtor._count.sessions
    }))
    
    console.log(`📊 Found ${realtorsWithCounts.length} realtors`)
    
    // Get admin count separately
    const adminCount = await prisma.realtor.count({
      where: { isAdmin: true }
    })

    return NextResponse.json({
      success: true,
      realtors: realtorsWithCounts,
      total: realtorsWithCounts.length,
      active: realtorsWithCounts.filter(r => r.isActive).length,
      admins: adminCount
    })
    
  } catch (error) {
    console.error('❌ Error fetching realtors:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch realtors'
      },
      { status: 500 }
    )
  }
}

// POST - Create new realtor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string
      email: string
      domain: string
      password: string
      isAdmin?: boolean
    }
    const { name, email, domain, password, isAdmin = false } = body

    // Validate required fields
    if (!name || !email || !domain || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, domain, and password are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await prisma.realtor.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 400 }
      )
    }

    // Check if domain already exists
    const existingDomain = await prisma.realtor.findUnique({
      where: { domain }
    })

    if (existingDomain) {
      return NextResponse.json(
        { success: false, error: 'Domain already in use' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate API key
    const apiKey = `key-${Math.random().toString(36).substr(2, 9)}`

    // Create realtor
    const newRealtor = await prisma.realtor.create({
      data: {
        name,
        email,
        domain,
        password: hashedPassword,
        isAdmin,
        isActive: true,
        apiKey
      },
      select: {
        id: true,
        name: true,
        email: true,
        domain: true,
        isAdmin: true,
        isActive: true,
        apiKey: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      realtor: newRealtor,
      message: 'Realtor created successfully'
    })
  } catch (error) {
    console.error('❌ Error creating realtor:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create realtor' },
      { status: 500 }
    )
  }
}
