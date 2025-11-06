'use client'

import { useState } from 'react'

export default function DeactivateOldPackagesButton() {
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleDeactivate = async () => {
    if (!confirm('This will deactivate the old packages (real_estate, business, communications). They will no longer appear in package selection. Continue?')) {
      return
    }

    setIsDeactivating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/packages/deactivate-old', {
        method: 'POST'
      })

      const data = await response.json() as { error?: string; success?: boolean; message?: string; deactivated?: number }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate packages')
      }

      setMessage({ 
        type: 'success', 
        text: data.message || `Successfully deactivated ${data.deactivated || 0} package(s)!` 
      })
      // Reload page after a moment to show updated packages
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to deactivate packages'
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDeactivate}
        disabled={isDeactivating}
        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        {isDeactivating ? (
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
            Deactivating...
          </span>
        ) : (
          'Deactivate Old Packages'
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

