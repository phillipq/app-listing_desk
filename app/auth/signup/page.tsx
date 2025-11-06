"use client"

import _bcrypt from "bcryptjs"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Suspense } from "react"
import { useEffect, useState } from "react"

function SignUpContent() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    domain: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // If no plan is selected, redirect to pricing page
  useEffect(() => {
    if (!plan) {
      router.push('/pricing?signup=true')
    }
  }, [plan, router])

  // Don't render form if no plan is selected
  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-seasalt-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to pricing...</p>
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          domain: formData.domain,
        }),
      })

      const data = await response.json() as { error?: string; realtor?: { id: string; email: string } }

      if (response.ok && data.realtor) {
        // Auto-login the user
        try {
          const signInResult = await signIn('credentials', {
            email: data.realtor.email,
            password: formData.password,
            redirect: false,
          })

          if (signInResult?.ok) {
            // If plan was selected, initiate Stripe checkout
            if (plan) {
              try {
                const checkoutResponse = await fetch('/api/stripe/checkout', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ plan }),
                })

                const checkoutData = await checkoutResponse.json() as { checkoutUrl?: string; error?: string }

                if (checkoutResponse.ok && checkoutData.checkoutUrl) {
                  // Redirect to Stripe checkout
                  window.location.href = checkoutData.checkoutUrl
                  return
                } else {
                  // If checkout fails, create a trial subscription so user can see correct tools
                  console.error('Checkout error:', checkoutData.error)
                  try {
                    await fetch('/api/auth/create-trial-subscription', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ plan }),
                    })
                  } catch (trialError) {
                    console.error('Failed to create trial subscription:', trialError)
                  }
                  // Still redirect to dashboard - user can retry checkout later
                  router.push('/dashboard?checkout_error=true')
                  return
                }
              } catch (checkoutError) {
                console.error('Checkout error:', checkoutError)
                // If checkout fails, create a trial subscription so user can see correct tools
                try {
                  await fetch('/api/auth/create-trial-subscription', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ plan }),
                  })
                } catch (trialError) {
                  console.error('Failed to create trial subscription:', trialError)
                }
                // Still redirect to dashboard - user can retry checkout later
                router.push('/dashboard?checkout_error=true')
                return
              }
            } else {
              // No plan selected, go to pricing page
              router.push("/pricing?newSignup=true")
              return
            }
          } else {
            // Login failed, redirect to signin
            router.push("/auth/signin?error=login_failed")
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError)
          // If auto-login fails, redirect to signin
          router.push("/auth/signin")
        }
      } else {
        setError(data.error || "An error occurred")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-seasalt-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-keppel-500 rounded-xl shadow-soft-lg flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-seasalt-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-700">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Start generating leads with AI-powered chatbots
          </p>
          {plan && (
            <div className="mt-4 inline-block px-4 py-2 bg-keppel-100 text-keppel-800 rounded-lg text-sm font-medium">
              Selected Plan: {plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          )}
        </div>

        {/* Signup Form */}
        <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-soft-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 transition-all duration-200 text-gray-700 placeholder-gray-500"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 transition-all duration-200 text-gray-700 placeholder-gray-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                  Website Domain
                </label>
                <input
                  id="domain"
                  name="domain"
                  type="text"
                  required
                  value={formData.domain}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 transition-all duration-200 text-gray-700 placeholder-gray-500"
                  placeholder="yourwebsite.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 transition-all duration-200 text-gray-700 placeholder-gray-500"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 transition-all duration-200 text-gray-700 placeholder-gray-500"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-xl shadow-soft-sm hover:shadow-soft-md focus:outline-none focus:ring-2 focus:ring-keppel-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-seasalt-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/auth/signin" className="font-medium text-keppel-500 hover:text-keppel-600 transition-colors duration-200">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SignUp() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-seasalt-50">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
