import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
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

    // Get current date range for this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Get customer stats
    const totalCustomers = await prisma.customer.count({
      where: { userId: user.id }
    })

    const activeCustomers = await prisma.customer.count({
      where: { 
        userId: user.id,
        status: 'active'
      }
    })

    const newCustomersThisMonth = await prisma.customer.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Get service stats
    const totalServices = await prisma.service.count({
      where: { userId: user.id }
    })

    const activeServices = await prisma.service.count({
      where: { 
        userId: user.id,
        isActive: true
      }
    })

    // Get appointment stats
    const totalAppointments = await prisma.appointment.count({
      where: { userId: user.id }
    })

    const appointmentsThisMonth = await prisma.appointment.count({
      where: {
        userId: user.id,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    const confirmedAppointments = await prisma.appointment.count({
      where: {
        userId: user.id,
        status: 'confirmed'
      }
    })

    // Get upcoming appointments (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: now,
          lte: nextWeek
        },
        status: {
          in: ['scheduled', 'confirmed']
        }
      },
      include: {
        customer: true,
        service: true
      },
      orderBy: { startTime: 'asc' },
      take: 5
    })

    // Calculate revenue this month
    const appointmentsWithRevenue = await prisma.appointment.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        status: {
          in: ['confirmed', 'completed']
        }
      },
      include: {
        service: true
      }
    })

    const monthlyRevenue = appointmentsWithRevenue.reduce((total, appointment) => {
      return total + (appointment.service?.price || 0)
    }, 0)

    return NextResponse.json({
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        newThisMonth: newCustomersThisMonth
      },
      services: {
        total: totalServices,
        active: activeServices
      },
      appointments: {
        total: totalAppointments,
        thisMonth: appointmentsThisMonth,
        confirmed: confirmedAppointments,
        upcoming: upcomingAppointments
      },
      revenue: {
        thisMonth: monthlyRevenue
      }
    })
  } catch (error) {
    console.error('Error fetching CRM dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
