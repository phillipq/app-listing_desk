'use client'

import { useState } from 'react'

interface Appointment {
  id: string
  customerId: string
  serviceId: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  service: {
    id: string
    name: string
    price: number
  }
}

interface CalendarViewProps {
  appointments: Appointment[]
  onAppointmentClick: (appointment: Appointment) => void
}

type ViewMode = 'day' | 'week' | 'month'

export default function CalendarView({ appointments, onAppointmentClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('week')

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime)
      return aptDate.toISOString().split('T')[0] === dateStr
    })
  }

  const getAppointmentsForWeek = (date: Date) => {
    const weekDays = getWeekDays(date)
    const weekAppointments: Array<{ date: Date; appointments: Appointment[] }> = []
    
    weekDays.forEach(day => {
      const dayAppointments = getAppointmentsForDate(day)
      weekAppointments.push({
        date: day,
        appointments: dayAppointments
      })
    })
    
    return weekAppointments
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateHeader = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate)
      const start = weekDays[0]
      const end = weekDays[6]
      if (!start || !end) return ''
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }
  }

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate)
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-24 gap-1">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="text-xs text-gray-500 p-2 border-r border-gray-200">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          {dayAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No appointments scheduled for this day
            </div>
          ) : (
            dayAppointments
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((appointment) => {
                const startTime = new Date(appointment.startTime)
                const endTime = new Date(appointment.endTime)
                
                return (
                  <div
                    key={appointment.id}
                    onClick={() => onAppointmentClick(appointment)}
                    className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(appointment.status)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{appointment.customer.name}</h3>
                        <p className="text-sm opacity-75">{appointment.service.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatTime(appointment.startTime)}
                        </p>
                        <p className="text-xs opacity-75">
                          {Math.round((endTime.getTime() - startTime.getTime()) / 60000)} min
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekData = getAppointmentsForWeek(currentDate)
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-medium text-gray-700 p-2 border-b">
            {day}
          </div>
        ))}
        
        {weekData.map(({ date, appointments }, index) => (
          <div key={index} className="min-h-32 border border-gray-200 p-2">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {date.getDate()}
            </div>
            <div className="space-y-1">
              {appointments.slice(0, 3).map((appointment: Appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => onAppointmentClick(appointment)}
                  className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(appointment.status)}`}
                >
                  <div className="truncate">{appointment.customer.name}</div>
                  <div className="truncate text-xs opacity-75">{formatTime(appointment.startTime)}</div>
                </div>
              ))}
              {appointments.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{appointments.length - 3} more
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center font-medium text-gray-700 p-2 border-b">
            {day}
          </div>
        ))}
        
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="min-h-24 border border-gray-200"></div>
          }
          
          const dayAppointments = getAppointmentsForDate(date)
          
          return (
            <div key={index} className="min-h-24 border border-gray-200 p-1">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 2).map((appointment) => (
                  <div
                    key={appointment.id}
                    onClick={() => onAppointmentClick(appointment)}
                    className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(appointment.status)}`}
                  >
                    <div className="truncate">{appointment.customer.name}</div>
                    <div className="truncate text-xs opacity-75">{formatTime(appointment.startTime)}</div>
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayAppointments.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100">
      {/* Calendar Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">Calendar</h2>
          
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-keppel-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm text-keppel-600 hover:text-keppel-700 hover:bg-keppel-50 rounded-lg"
              >
                Today
              </button>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-2">
          <h3 className="text-xl font-semibold text-gray-800">{formatDateHeader()}</h3>
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="p-6">
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'month' && renderMonthView()}
      </div>
    </div>
  )
}
