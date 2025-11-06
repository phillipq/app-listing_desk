'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteUserButtonProps {
  userId: string
  userEmail: string
}

export default function DeleteUserButton({ userId, userEmail }: DeleteUserButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Are you absolutely sure you want to delete ${userEmail}? This will permanently delete all their data and cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json() as { error?: string; success?: boolean; message?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      alert('User deleted successfully')
      router.push('/admin/users')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div>
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Delete User
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-red-600 font-medium">Confirm deletion:</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete User'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

