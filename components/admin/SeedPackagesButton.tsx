'use client'

import { useState } from 'react'

export default function SeedPackagesButton() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSeed = async () => {
    if (!confirm('This will create or update the 4 Stripe subscription packages. Continue?')) {
      return
    }

    setIsSeeding(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/seed-packages', {
        method: 'POST'
      })

      const data = await response.json() as { error?: string; success?: boolean; message?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to seed packages')
      }

      setMessage({ type: 'success', text: data.message || 'Packages seeded successfully!' })
      // Reload page after a moment to show updated packages
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to seed packages'
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleSeed}
        disabled={isSeeding}
        className="px-4 py-2 bg-keppel-600 text-white rounded-md hover:bg-keppel-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {isSeeding ? (
          <span className="flex items-center">
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
            Seeding...
          </span>
        ) : (
          'Seed Stripe Packages'
        )}
      </button>
      {message && (
        <div className={`mt-2 p-3 rounded-md text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800'
            : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}

