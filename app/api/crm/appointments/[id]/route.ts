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
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        userId: user.id
      },
      include: {
        customer: true,
        service: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    const body = await request.json() as { customerId: string; serviceId: string; scheduledAt: string; duration: number | string; status?: string; notes?: string }
    const { customerId, serviceId, scheduledAt, duration, status, notes } = body

    // Validate required fields
    if (!customerId || !serviceId || !scheduledAt || !duration) {
      return NextResponse.json({ 
        error: 'Customer, service, scheduled time, and duration are required' 
      }, { status: 400 })
    }

    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Verify customer and service belong to user
    const [customer, service] = await Promise.all([
      prisma.customer.findFirst({
        where: { id: customerId, userId: user.id }
      }),
      prisma.service.findFirst({
        where: { id: serviceId, userId: user.id }
      })
    ])

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const start = new Date(scheduledAt)
    const end = new Date(start.getTime() + (typeof duration === 'number' ? duration : parseInt(duration)) * 60000)

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        customerId,
        serviceId,
        startTime: start,
        endTime: end,
        status: status || 'pending',
        notes: notes || null
      },
      include: {
        customer: true,
        service: true
      }
    })

    return NextResponse.json({ appointment })
  } catch (error) {
    console.error('Error updating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Check if appointment exists and belongs to user
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    await prisma.appointment.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Appointment deleted successfully' })
  } catch (error) {
    console.error('Error deleting appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
