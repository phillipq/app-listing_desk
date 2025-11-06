import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


export default async function BusinessDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Business Dashboard</h1>
        <p className="text-gray-600">Manage your business communications and leads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Lead Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Management</h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/communication/leads" 
              className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="font-medium text-blue-900">All Leads</div>
              <div className="text-sm text-blue-700">View and manage all leads</div>
            </Link>
            <Link 
              href="/dashboard/communication/inbox" 
              className="block p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <div className="font-medium text-indigo-900">Unified Inbox</div>
              <div className="text-sm text-indigo-700">All messages in one place</div>
            </Link>
            <Link 
              href="/dashboard/communication/analytics" 
              className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="font-medium text-purple-900">Lead Analytics</div>
              <div className="text-sm text-purple-700">Track lead conversion</div>
            </Link>
          </div>
        </div>

        {/* Communication Channels */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/communication/sms" 
              className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="font-medium text-green-900">SMS Messages</div>
              <div className="text-sm text-green-700">Text with customers</div>
            </Link>
            <Link 
              href="/dashboard/communication/whatsapp" 
              className="block p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <div className="font-medium text-emerald-900">WhatsApp</div>
              <div className="text-sm text-emerald-700">WhatsApp conversations</div>
            </Link>
            <Link 
              href="/dashboard/communication/voicemail" 
              className="block p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="font-medium text-yellow-900">Voicemail</div>
              <div className="text-sm text-yellow-700">Voice messages and calls</div>
            </Link>
          </div>
        </div>

        {/* AI Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Features</h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/communication/ai-responses" 
              className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="font-medium text-purple-900">Auto-Responses</div>
              <div className="text-sm text-purple-700">AI-powered responses</div>
            </Link>
            <Link 
              href="/dashboard/communication/lead-scoring" 
              className="block p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <div className="font-medium text-pink-900">Lead Scoring</div>
              <div className="text-sm text-pink-700">AI lead qualification</div>
            </Link>
            <Link 
              href="/dashboard/communication/summaries" 
              className="block p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="font-medium text-orange-900">Conversation Summaries</div>
              <div className="text-sm text-orange-700">AI conversation insights</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
