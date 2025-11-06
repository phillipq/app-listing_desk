import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { isAdmin } from '@/lib/admin-auth'
import { authOptions } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin?redirect=/admin')
  }

  const admin = await isAdmin(session.user.id)
  
  if (!admin) {
    redirect('/dashboard')
  }

  // This layout is nested inside the dashboard layout
  // The dashboard layout handles the sidebar, so we just render children here
  return <>{children}</>
}

