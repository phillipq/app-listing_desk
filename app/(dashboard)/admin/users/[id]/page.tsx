
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import DeleteUserButton from '@/components/admin/DeleteUserButton'
import SubscriptionManager from '@/components/admin/SubscriptionManager'
import UserPackageManager from '@/components/admin/UserPackageManager'
import { isAdmin } from '@/lib/admin-auth'
import { authOptions } from '@/lib/auth'
import { getAllPackages } from '@/lib/packages/service'
import { prisma } from '@/lib/prisma'

export default async function AdminUserDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin?redirect=/admin/users')
  }

  const admin = await isAdmin(session.user.id)
  
  if (!admin) {
    redirect('/dashboard')
  }

  const { id } = await params

  const user = await prisma.realtor.findUnique({
    where: { id },
    include: {
      userPackages: {
        include: {
          package: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      },
      subscriptions: {
        include: {
          package: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!user) {
    redirect('/admin/users')
  }

  const allPackages = await getAllPackages()
  
  // Convert Decimal to number for client components
  const packagesForClient = allPackages.map(pkg => ({
    ...pkg,
    price: pkg.price ? Number(pkg.price) : null
  }))
  
  const _userPackageSlugs = user.userPackages
    .filter(up => up.status === 'active')
    .map(up => up.package.slug)

  // Convert user packages with Decimal conversion
  const userPackagesForClient = user.userPackages.map(up => ({
    ...up,
    package: {
      ...up.package,
      price: up.package.price ? Number(up.package.price) : null
    }
  }))

  // Convert subscriptions with Decimal conversion
  const subscriptionsForClient = user.subscriptions.map(sub => ({
    ...sub,
    package: {
      ...sub.package,
      price: sub.package.price ? Number(sub.package.price) : null
    }
  }))

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-keppel-600 hover:text-keppel-700 mb-4 inline-block"
        >
          ← Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{user.name || 'User'}</h1>
        <p className="mt-2 text-sm text-gray-600">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">User Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.name || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Subscription Status</dt>
              <dd className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : user.subscriptionStatus === 'trial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.subscriptionStatus || 'inactive'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stripe Customer ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{user.stripeCustomerId || 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Is Admin</dt>
              <dd className="mt-1">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.isAdmin
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.isAdmin ? 'Yes' : 'No'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Package Management */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Package Management</h2>
          {/* eslint-disable @typescript-eslint/no-explicit-any */}
          <UserPackageManager
            userId={user.id}
            currentPackages={userPackagesForClient as any}
            allPackages={packagesForClient as any}
          />
          {/* eslint-enable @typescript-eslint/no-explicit-any */}
        </div>
      </div>

      {/* Subscriptions Management */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription Management</h2>
        {/* eslint-disable @typescript-eslint/no-explicit-any */}
        <SubscriptionManager
          userId={user.id}
          subscriptions={subscriptionsForClient as any}
          allPackages={packagesForClient as any}
        />
        {/* eslint-enable @typescript-eslint/no-explicit-any */}
      </div>

      {/* Danger Zone */}
      <div className="mt-6 bg-white shadow rounded-lg p-6 border-2 border-red-200">
        <h2 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Permanently delete this user and all associated data. This action cannot be undone.
        </p>
        <DeleteUserButton userId={user.id} userEmail={user.email} />
      </div>
    </div>
  )
}

