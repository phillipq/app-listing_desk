import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const where: Prisma.ServiceWhereInput = {
      userId: user.id
    }

    if (activeOnly) {
      where.isActive = true
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json() as { name?: string; description?: string | null; price?: number | string; duration?: number | string; isActive?: boolean }
    const { name, description, price, duration, isActive } = body

    if (!name || price === undefined || duration === undefined) {
      return NextResponse.json({ 
        error: 'Name, price, and duration are required' 
      }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: typeof price === 'number' ? price : parseFloat(String(price)),
        duration: typeof duration === 'number' ? duration : parseInt(String(duration)),
        isActive: isActive !== false,
        userId: user.id
      }
    })

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
