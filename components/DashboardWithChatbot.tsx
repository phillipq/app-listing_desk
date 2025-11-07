"use client"

import { useSession } from "next-auth/react"
import FloatingChatWidget from "./FloatingChatWidget"

interface DashboardWithChatbotProps {
  children: React.ReactNode
}

export default function DashboardWithChatbot({ children }: DashboardWithChatbotProps) {
  const { data: session } = useSession()

  // Only show chatbot if user is logged in
  if (!session?.user?.id) {
    return <>{children}</>
  }

  return (
    <>
      {children}
      <FloatingChatWidget
        realtorId={session.user.id}
        realtorName={session.user.name || "Assistant"}
        primaryColor="#5AA197" // keppel-500
        position="bottom-right"
        isInternal={true}
      />
    </>
  )
}

