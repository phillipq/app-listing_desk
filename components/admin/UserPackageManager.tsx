'use client'

import { Package, UserPackage } from '@prisma/client'
import { useState } from 'react'

interface UserPackageManagerProps {
  userId: string
  currentPackages: Array<UserPackage & { package: Package }>
  allPackages: Package[]
}

export default function UserPackageManager({
  userId,
  currentPackages,
  allPackages
}: UserPackageManagerProps) {
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    currentPackages.filter(p => p.status === 'active').map(p => p.packageId)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handlePackageToggle = (packageId: string) => {
    setSelectedPackages(prev => {
      if (prev.includes(packageId)) {
        return prev.filter(id => id !== packageId)
      } else {
        return [...prev, packageId]
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageIds: selectedPackages }),
      })

      const data = await response.json() as { error?: string; success?: boolean }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update packages')
      }

      setMessage({ type: 'success', text: 'Packages updated successfully' })
      // Reload page after a moment to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update packages'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const activePackages = currentPackages.filter(p => p.status === 'active')
  // Only show active packages for assignment
  const basePackages = allPackages.filter(p => p.type === 'base' && p.isActive)
  const addonPackages = allPackages.filter(p => p.type === 'addon' && p.isActive)

  return (
    <div className="space-y-4">
      {/* Current Active Packages */}
      {activePackages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Current Packages</h3>
          <div className="flex flex-wrap gap-2">
            {activePackages.map((up) => (
              <span
                key={up.id}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  up.package.type === 'base'
                    ? 'bg-keppel-100 text-keppel-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {up.package.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Package Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Assign Packages</h3>
        
        {/* Base Packages */}
        {basePackages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Base Packages (select one)</p>
            <div className="space-y-2">
              {basePackages
                .sort((a, b) => {
                  // Sort by: realtor packages first, then business
                  const order = ['realtor_pro', 'realtor_pro_comm', 'business_pro', 'business_pro_comm']
                  const aIndex = order.indexOf(a.slug)
                  const bIndex = order.indexOf(b.slug)
                  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
                  if (aIndex !== -1) return -1
                  if (bIndex !== -1) return 1
                  return a.name.localeCompare(b.name)
                })
                .map((pkg) => (
                <label
                  key={pkg.id}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="base-package"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={() => {
                      // Only allow one base package
                      const newSelected = selectedPackages.filter(
                        id => !basePackages.some(bp => bp.id === id)
                      )
                      setSelectedPackages([...newSelected, pkg.id])
                    }}
                    className="h-4 w-4 text-keppel-600 focus:ring-keppel-500 border-gray-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                        {pkg.slug && (
                          <span className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded">
                            {pkg.slug}
                          </span>
                        )}
                      </div>
                      {pkg.price && (
                        <span className="text-sm text-gray-500">
                          ${Number(pkg.price).toFixed(2)}/month
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Addon Packages */}
        {addonPackages.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Addon Packages (select multiple)</p>
            <div className="space-y-2">
              {addonPackages.map((pkg) => (
                <label
                  key={pkg.id}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={() => handlePackageToggle(pkg.id)}
                    className="h-4 w-4 text-keppel-600 focus:ring-keppel-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{pkg.name}</span>
                      {pkg.price && (
                        <span className="text-sm text-gray-500">
                          ${Number(pkg.price).toFixed(2)}/month
                        </span>
                      )}
                    </div>
                    {pkg.description && (
                      <p className="text-xs text-gray-500 mt-1">{pkg.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-4 py-2 bg-keppel-600 text-white rounded-lg hover:bg-keppel-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? 'Saving...' : 'Save Package Changes'}
      </button>
    </div>
  )
}

