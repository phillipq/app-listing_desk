
import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import DeactivateOldPackagesButton from '@/components/admin/DeactivateOldPackagesButton'
import SeedPackagesButton from '@/components/admin/SeedPackagesButton'
import { isAdmin } from '@/lib/admin-auth'
import { authOptions } from '@/lib/auth'
import { getAllPackages } from '@/lib/packages/service'
import { prisma } from '@/lib/prisma'

type Package = Prisma.PackageGetPayload<Record<string, never>>

interface PackageWithStats extends Package {
  userCount: number
}

export default async function AdminPackagesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/signin?redirect=/admin/packages')
  }

  const admin = await isAdmin(session.user.id)
  
  if (!admin) {
    redirect('/dashboard')
  }

  const packages = await getAllPackages()

  // Get user counts for each package
  const packageStats = await Promise.all(
    packages.map(async (pkg: Package) => {
      const userCount = await prisma.userPackage.count({
        where: {
          packageId: pkg.id,
          status: 'active'
        }
      })
      return { ...pkg, userCount }
    })
  )

  // Sort packages: Stripe packages first, then others
  const stripePackageOrder = ['realtor_pro', 'realtor_pro_comm', 'business_pro', 'business_pro_comm']
  const sortedPackages = [...packageStats].sort((a, b) => {
    const aIndex = stripePackageOrder.indexOf(a.slug)
    const bIndex = stripePackageOrder.indexOf(b.slug)
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
    if (aIndex !== -1) return -1
    if (bIndex !== -1) return 1
    // Then sort by type (base first), then name
    if (a.type !== b.type) return a.type === 'base' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  // Separate into Stripe packages and others
  const stripePackages = sortedPackages.filter(p => stripePackageOrder.includes(p.slug))
  const otherPackages = sortedPackages.filter(p => !stripePackageOrder.includes(p.slug))

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage available packages and pricing. These packages correspond to Stripe subscription plans.
            </p>
          </div>
          <div className="flex gap-2">
            <SeedPackagesButton />
            {otherPackages.length > 0 && <DeactivateOldPackagesButton />}
          </div>
        </div>
      </div>

      {/* Stripe Packages Section */}
      {stripePackages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Stripe Subscription Packages</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {stripePackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} isStripePackage={true} />
            ))}
          </div>
        </div>
      )}

      {/* Other Packages Section */}
      {otherPackages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Packages</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {otherPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} isStripePackage={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Package Card Component
function PackageCard({ pkg, isStripePackage }: { pkg: PackageWithStats; isStripePackage: boolean }) {
  const userType = pkg.slug?.includes('realtor') ? 'realtor' : pkg.slug?.includes('business') ? 'business' : null
  const hasComm = pkg.slug?.includes('_comm') || false

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${isStripePackage ? 'border-2 border-keppel-200' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">{pkg.name}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {pkg.slug && (
              <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded">
                {pkg.slug}
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              pkg.type === 'base'
                ? 'bg-keppel-100 text-keppel-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {pkg.type}
            </span>
            {userType && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                userType === 'realtor'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {userType === 'realtor' ? 'Real Estate' : 'Business'}
              </span>
            )}
            {hasComm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                + Comm
              </span>
            )}
          </div>
        </div>
        {pkg.isActive ? (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Inactive
          </span>
        )}
      </div>

      {pkg.description && (
        <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Price:</span>
          <span className="font-medium text-gray-900">
            {pkg.price ? `$${Number(pkg.price).toFixed(2)}/month` : 'Free'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Active Users:</span>
          <span className="font-medium text-gray-900">{pkg.userCount}</span>
        </div>
        {pkg.stripePriceId && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Stripe Price ID:</span>
            <span className="font-mono text-xs text-gray-600 truncate max-w-[150px]" title={pkg.stripePriceId}>
              {pkg.stripePriceId}
            </span>
          </div>
        )}
        {pkg.features && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Features:</span>
            <span className="font-medium text-gray-900">{pkg.features.length}</span>
          </div>
        )}
      </div>

      {pkg.features && pkg.features.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-2">Features:</p>
          <div className="flex flex-wrap gap-1">
            {pkg.features.slice(0, 5).map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {feature}
              </span>
            ))}
            {pkg.features.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                +{pkg.features.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

