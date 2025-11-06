'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { PlanType, subscriptionPlans } from '@/lib/stripe'

function PricingContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSignupFlow = searchParams.get('signup') === 'true'
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelectPlan = async (planKey: string) => {
    if (status === 'loading') {
      setError('Please wait while we check your session...')
      return
    }

    if (!session?.user) {
      // Redirect to signup if not logged in
      router.push(`/auth/signup?plan=${planKey}`)
      return
    }

    setLoadingPlan(planKey)
    setError('')

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planKey }),
      })

      const data = await response.json() as { checkoutUrl?: string; error?: string }

      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        setError(data.error || 'Failed to start checkout. Please try again.')
        setLoadingPlan(null)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('An error occurred. Please try again.')
      setLoadingPlan(null)
    }
  }

  // Get all plans in order: Realtor Pro, Realtor Pro + Comm, Business Pro, Business Pro + Comm
  const allPlans = [
    ['realtor_pro', subscriptionPlans.realtor_pro],
    ['realtor_pro_comm', subscriptionPlans.realtor_pro_comm],
    ['business_pro', subscriptionPlans.business_pro],
    ['business_pro_comm', subscriptionPlans.business_pro_comm],
  ] as [PlanType, typeof subscriptionPlans[PlanType]][]

  return (
    <div className="min-h-screen bg-seasalt-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-700 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-500 mb-2">
            Start your 7-day free trial. No credit card required to start.
          </p>
          <p className="text-sm text-gray-400">
            Cancel anytime during the trial - you won't be charged
          </p>
        </div>

        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* All Plans in One Row */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {allPlans.map(([planKey, plan]) => (
              <div
                key={planKey}
                className={`bg-white rounded-xl shadow-soft-lg border-2 p-6 flex flex-col ${
                  plan.includesCommunications
                    ? 'border-keppel-500 relative' 
                    : 'border-gray-200'
                }`}
              >
                {plan.includesCommunications && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-keppel-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* User Type Badge */}
                <div className="mb-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    plan.userType === 'realtor' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {plan.userType === 'realtor' ? 'Real Estate' : 'Business'}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-700 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 text-sm">/{plan.interval}</span>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    {plan.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-4 h-4 text-keppel-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-600 text-xs leading-relaxed">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-xs text-gray-500 pl-6">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => handleSelectPlan(planKey)}
                  disabled={loadingPlan !== null}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium transition-all text-sm ${
                    plan.includesCommunications
                      ? 'bg-keppel-500 text-white hover:bg-keppel-600 shadow-soft-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === planKey ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    isSignupFlow ? 'Continue to Sign Up' : 'Start Free Trial'
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Trial Info */}
        <div className="mt-12 text-center">
          <div className="bg-keppel-50 border border-keppel-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              ✨ 7-Day Free Trial
            </h3>
            <p className="text-gray-600">
              Start your free trial today. No credit card required until the trial ends.
              You'll have full access to all features during your trial period.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-soft-sm">
              <h3 className="font-semibold text-gray-700 mb-2">
                When will I be charged?
              </h3>
              <p className="text-gray-600">
                Your 7-day free trial starts immediately. You won't be charged until the trial ends.
                You can cancel anytime during the trial with no charges.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-soft-sm">
              <h3 className="font-semibold text-gray-700 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time from your dashboard.
                Changes take effect immediately.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-soft-sm">
              <h3 className="font-semibold text-gray-700 mb-2">
                What's included in the Communications package?
              </h3>
              <p className="text-gray-600">
                The Communications add-on includes Social Media Hub, Communication Hub, WhatsApp and Instagram integrations, 
                SMS & Voicemail, and multi-channel messaging capabilities.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-soft-sm">
              <h3 className="font-semibold text-gray-700 mb-2">
                What happens after the trial?
              </h3>
              <p className="text-gray-600">
                If you don't cancel during the trial, your subscription will automatically continue
                and you'll be charged the monthly rate. You can cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-seasalt-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
