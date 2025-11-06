'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CommunicationSetupRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new setup center
    router.replace('/setup')
  }, [router])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keppel-500 mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Redirecting to Setup Center...</h2>
        <p className="text-gray-500">Taking you to the new setup experience.</p>
      </div>
    </div>
  )
}
