import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const service = await prisma.service.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as { name?: string; description?: string | null; price?: number | string; duration?: number | string; isActive?: boolean }
    const { name, description, price, duration, isActive } = body

    // Validate required fields
    if (!name || price === undefined || duration === undefined) {
      return NextResponse.json({ 
        error: 'Name, price, and duration are required' 
      }, { status: 400 })
    }

    // Check if service exists and belongs to user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: typeof price === 'number' ? price : parseFloat(String(price)),
        duration: typeof duration === 'number' ? duration : parseInt(String(duration)),
        isActive: isActive ?? true
      }
    })

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if service exists and belongs to user
    const existingService = await prisma.service.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check if service has any appointments
    const appointmentsCount = await prisma.appointment.count({
      where: { serviceId: id }
    })

    if (appointmentsCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete service with existing appointments' 
      }, { status: 400 })
    }

    await prisma.service.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
