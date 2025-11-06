"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"

export default function DeploymentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const handleDeployChatbot = async () => {
    setLoading(true)
    try {
      // Add deployment logic here
      console.log('Deploying chatbot...')
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Chatbot deployed successfully!')
    } catch (error) {
      console.error('Deployment failed:', error)
      alert('Deployment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <DashboardLayout currentPage="/dashboard/deployment">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading deployment page...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout currentPage="/dashboard/deployment">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-700">Deployment</h1>
          <p className="text-gray-500 mt-2">Test and deploy your realtor chatbot</p>
        </div>

        {/* Deployment Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Deploy Chatbot Card */}
          <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-keppel-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-seasalt-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">Deploy Chatbot</h3>
                <p className="text-sm text-gray-500">Deploy your chatbot to production</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              Deploy your realtor chatbot to make it available to potential clients. 
              This will make your chatbot live and accessible via the public URL.
            </p>
            <button
              onClick={handleDeployChatbot}
              disabled={loading}
              className="w-full bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-seasalt-500 mr-2"></div>
                  Deploying...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  Deploy Chatbot
                </div>
              )}
            </button>
          </div>

          {/* View Chatbot Card */}
          <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-keppel-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                <svg className="w-6 h-6 text-seasalt-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">View Chatbot</h3>
                <p className="text-sm text-gray-500">Test your chatbot in action</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              Open your chatbot in a new tab to test its functionality and see how it 
              interacts with potential clients.
            </p>
            <Link
              href={`/?realtorId=${session?.user?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-200 text-sm font-medium inline-flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Chatbot
            </Link>
          </div>
        </div>

        {/* Deployment Status */}
        <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Deployment Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Chatbot Status</span>
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-buff-100 text-buff-800">
                Ready to Deploy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Last Deployment</span>
              <span className="text-gray-500">Never deployed</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Public URL</span>
              <span className="text-gray-500">Not available</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Deployment Instructions</h3>
          <div className="space-y-3 text-gray-700">
            <p>1. <strong>Test your chatbot</strong> by clicking "View Chatbot" to ensure it's working correctly</p>
            <p>2. <strong>Deploy your chatbot</strong> by clicking "Deploy Chatbot" to make it live</p>
            <p>3. <strong>Share the public URL</strong> with potential clients to start generating leads</p>
            <p>4. <strong>Monitor leads</strong> in the Leads section to track your chatbot's performance</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}