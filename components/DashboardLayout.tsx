'use client'

import { ReactNode } from 'react'
import DashboardSidebar from './DashboardSidebar'

interface DashboardLayoutProps {
  children: ReactNode
  currentPage?: string
}

export default function DashboardLayout({ children, currentPage }: DashboardLayoutProps) {
  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <DashboardSidebar currentPage={currentPage} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  )
}
