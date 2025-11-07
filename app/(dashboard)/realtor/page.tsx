import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'



export default async function RealtorDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Realtor Tools</h1>
        <p className="text-gray-600">Manage your real estate business and properties</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Property Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Management</h3>
          <div className="space-y-3">
            <Link 
              href="/realtor/properties" 
              className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="font-medium text-blue-900">Property Listings</div>
              <div className="text-sm text-blue-700">Manage MLS, Facebook, and manual listings</div>
            </Link>
            <Link 
              href="/realtor/properties/manual" 
              className="block p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="font-medium text-green-900">Add Manual Property</div>
              <div className="text-sm text-green-700">Add properties not in MLS</div>
            </Link>
            <Link 
              href="/realtor/properties/facebook-groups" 
              className="block p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="font-medium text-purple-900">Facebook Groups</div>
              <div className="text-sm text-purple-700">Monitor Facebook property groups</div>
            </Link>
          </div>
        </div>

        {/* Location Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Analysis</h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/realtor/location-insights" 
              className="block p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="font-medium text-orange-900">Location Insights</div>
              <div className="text-sm text-orange-700">Analyze neighborhoods and amenities</div>
            </Link>
          </div>
        </div>

        {/* Tour Planning */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tour Planning</h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/realtor/showing-tours" 
              className="block p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <div className="font-medium text-indigo-900">Showing Tours</div>
              <div className="text-sm text-indigo-700">Plan and optimize property tours</div>
            </Link>
          </div>
        </div>

        {/* Knowledge Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Knowledge Management</h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/realtor/context" 
              className="block p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
            >
              <div className="font-medium text-pink-900">Realtor Context</div>
              <div className="text-sm text-pink-700">Manage community knowledge and expertise</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}