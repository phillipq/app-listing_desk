'use client'

import { Package, Subscription } from '@prisma/client'
import { useState } from 'react'

interface SubscriptionManagerProps {
  userId: string
  subscriptions: Array<Subscription & { package: Package }>
  allPackages: Package[]
}

export default function SubscriptionManager({
  userId,
  subscriptions,
  allPackages
}: SubscriptionManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string>('')
  const [stripeSubscriptionId, setStripeSubscriptionId] = useState<string>('')
  const [stripeCustomerId, setStripeCustomerId] = useState<string>('')
  const [status, setStatus] = useState<string>('active')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleCreateSubscription = async () => {
    if (!selectedPackageId) {
      setMessage({ type: 'error', text: 'Please select a package' })
      return
    }

    setIsCreating(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/users/${userId}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedPackageId,
          stripeSubscriptionId: stripeSubscriptionId || undefined,
          stripeCustomerId: stripeCustomerId || undefined,
          status,
        }),
      })

      const data = await response.json() as { error?: string; success?: boolean }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      setMessage({ type: 'success', text: 'Subscription created successfully' })
      setShowCreateForm(false)
      // Reset form
      setSelectedPackageId('')
      setStripeSubscriptionId('')
      setStripeCustomerId('')
      setStatus('active')
      // Reload page after a moment to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create subscription'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json() as { error?: string; success?: boolean }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }

      setMessage({ type: 'success', text: 'Subscription updated successfully' })
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update subscription'
      })
    }
  }

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      })

      const data = await response.json() as { error?: string; success?: boolean }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setMessage({ type: 'success', text: 'Subscription cancelled successfully' })
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to cancel subscription'
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Manage Subscriptions</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3 py-1.5 text-sm bg-keppel-600 text-white rounded-md hover:bg-keppel-700"
        >
          {showCreateForm ? 'Cancel' : '+ Create Subscription'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Create New Subscription</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Package *
              </label>
              <select
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="">Select a package</option>
                {allPackages
                  .filter(pkg => pkg.isActive) // Only show active packages
                  .sort((a, b) => {
                    // Sort by: realtor packages first, then business, then by name
                    const order = ['realtor_pro', 'realtor_pro_comm', 'business_pro', 'business_pro_comm']
                    const aIndex = order.indexOf(a.slug || '')
                    const bIndex = order.indexOf(b.slug || '')
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
                    if (aIndex !== -1) return -1
                    if (bIndex !== -1) return 1
                    return a.name.localeCompare(b.name)
                  })
                  .map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} {pkg.slug && `(${pkg.slug})`} - ${Number(pkg.price || 0).toFixed(2)}/month
                    </option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stripe Subscription ID (optional)
                </label>
                <input
                  type="text"
                  value={stripeSubscriptionId}
                  onChange={(e) => setStripeSubscriptionId(e.target.value)}
                  placeholder="sub_..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-keppel-500 focus:border-keppel-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stripe Customer ID (optional)
                </label>
                <input
                  type="text"
                  value={stripeCustomerId}
                  onChange={(e) => setStripeCustomerId(e.target.value)}
                  placeholder="cus_..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-keppel-500 focus:border-keppel-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="unpaid">Unpaid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={handleCreateSubscription}
              disabled={isCreating || !selectedPackageId}
              className="w-full px-4 py-2 bg-keppel-600 text-white rounded-md hover:bg-keppel-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isCreating ? 'Creating...' : 'Create Subscription'}
            </button>
          </div>
        </div>
      )}

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

      {/* Subscriptions List */}
      {subscriptions.length > 0 ? (
        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 border rounded-lg bg-white"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{sub.package.name}</span>
                    {sub.package.slug && (
                      <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded">
                        {sub.package.slug}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      sub.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : sub.status === 'cancelled'
                        ? 'bg-gray-100 text-gray-800'
                        : sub.status === 'trialing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {sub.stripeSubscriptionId && (
                      <div>Subscription: <span className="font-mono">{sub.stripeSubscriptionId}</span></div>
                    )}
                    {sub.stripeCustomerId && (
                      <div>Customer: <span className="font-mono">{sub.stripeCustomerId}</span></div>
                    )}
                    <div>
                      Period: {new Date(sub.currentPeriodStart).toLocaleDateString()} - {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </div>
                    {sub.cancelAtPeriodEnd && (
                      <div className="text-yellow-600">⚠️ Will cancel at period end</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  {sub.status === 'active' && (
                    <>
                      <select
                        value={sub.status}
                        onChange={(e) => handleUpdateStatus(sub.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-keppel-500 focus:border-keppel-500"
                      >
                        <option value="active">Active</option>
                        <option value="past_due">Past Due</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => handleCancelSubscription(sub.id)}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {sub.status !== 'active' && (
                    <select
                      value={sub.status}
                      onChange={(e) => handleUpdateStatus(sub.id, e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-keppel-500 focus:border-keppel-500"
                    >
                      <option value="active">Active</option>
                      <option value="trialing">Trialing</option>
                      <option value="past_due">Past Due</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No subscriptions found</p>
      )}
    </div>
  )
}

