'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ApiSuccessResponse {
  success: true
  stats: {
    propertiesCached: number
    embeddingsCreated: number
  }
}

interface ApiErrorResponse {
  error: string
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse

type ResultState = {
  success: true
  data: ApiSuccessResponse
} | {
  success: false
  error: string
}

export default function PopulateDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)
  const router = useRouter()

  const handlePopulateDatabase = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/populate-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json() as ApiResponse
      
      if (response.ok) {
        if ('success' in data && data.success && 'stats' in data) {
          setResult({ success: true, data: data as ApiSuccessResponse })
        } else {
          setResult({ success: false, error: 'Unexpected response format' })
        }
      } else {
        const errorMessage = 'error' in data ? (data as ApiErrorResponse).error : 'Failed to populate database'
        setResult({ success: false, error: errorMessage })
      }
    } catch {
      setResult({ success: false, error: 'Failed to populate database' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/admin')}
              className="text-gray-700 hover:text-pumpkin-800 mb-4"
            >
              ← Back to Admin Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-700">Populate Database</h1>
            <p className="text-gray-500 mt-2">
              Clear existing property data and populate with 100 properties from the API, including vector embeddings.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">⚠️ Warning</h3>
              <p className="text-yellow-700">
                This will clear all existing property data and replace it with fresh data from the API. 
                This process may take several minutes to complete.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handlePopulateDatabase}
                disabled={isLoading}
                className="px-6 py-3 bg-keppel-500 text-seasalt-500 rounded-lg hover:bg-keppel-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Populating Database...' : 'Populate Database'}
              </button>
            </div>

            {isLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-keppel-500 mr-3"></div>
                  <span className="text-pumpkin-800">Populating database with 100 properties and generating embeddings...</span>
                </div>
              </div>
            )}

            {result && (
              <div className={`border rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`text-lg font-medium mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? '✅ Success!' : '❌ Error'}
                </h3>
                
                {result.success ? (
                  <div className="text-gray-700">
                    <p className="mb-2">Database populated successfully!</p>
                    <div className="bg-green-100 rounded p-3">
                      <h4 className="font-medium mb-2">Statistics:</h4>
                      <ul className="space-y-1 text-sm">
                        <li>Properties cached: {result.data.stats.propertiesCached}</li>
                        <li>Embeddings created: {result.data.stats.embeddingsCreated}</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700">{result.error as string}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
