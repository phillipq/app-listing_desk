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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')

    const where: Prisma.AppointmentWhereInput = {
      userId: user.id
    }

    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: true,
        service: true
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Error fetching appointments:', error)
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

    const body = await request.json() as { customerId?: string; serviceId?: string; scheduledAt?: string; duration?: number | string; status?: string; notes?: string }
    const { 
      customerId, 
      serviceId, 
      scheduledAt, 
      duration, 
      status, 
      notes 
    } = body

    if (!customerId || !serviceId || !scheduledAt || !duration) {
      return NextResponse.json({ 
        error: 'Customer, service, scheduled time, and duration are required' 
      }, { status: 400 })
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

    const startTime = new Date(scheduledAt as string)
    const minutes = typeof duration === 'number' ? duration : parseInt(duration || '0')
    const endTime = new Date(startTime.getTime() + minutes * 60000)

    // Check for conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        userId: user.id,
        startTime: {
          lt: endTime
        },
        endTime: {
          gt: startTime
        }
      }
    })

    if (conflictingAppointment) {
      return NextResponse.json({ 
        error: 'Appointment conflicts with existing appointment' 
      }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        title: `${service.name} - ${customer.name}`,
        description: service.description,
        startTime,
        endTime,
        status: status || 'pending',
        notes: notes || null,
        customerId,
        serviceId,
        userId: user.id
      },
      include: {
        customer: true,
        service: true
      }
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
