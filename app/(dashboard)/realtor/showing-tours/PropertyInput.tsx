'use client'

import { useState } from 'react'

interface Property {
  id: string
  mlsId: string
  address: string
  city: string
  province: string
  latitude?: number
  longitude?: number
}

interface PropertyInputProps {
  mlsInput: string
  setMlsInput: (value: string) => void
  onSubmit: (mlsNumbers: string[]) => void
  properties: Property[]
}

export default function PropertyInput({ mlsInput, setMlsInput, onSubmit, properties }: PropertyInputProps) {
  const [suggestions, setSuggestions] = useState<Property[]>([])

  const handleInputChange = (value: string) => {
    setMlsInput(value)
    
    if (value.length > 2) {
      const filtered = properties.filter(prop => 
        prop.mlsId.toLowerCase().includes(value.toLowerCase()) ||
        prop.address.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const mlsNumbers = mlsInput
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
    
    if (mlsNumbers.length === 0) {
      alert('Please enter at least one MLS number.')
      return
    }

    onSubmit(mlsNumbers)
  }

  const handleSuggestionClick = (property: Property) => {
    const currentLines = mlsInput.split('\n')
    const lastLine = currentLines[currentLines.length - 1] || ''
    const newInput = mlsInput.replace(lastLine, property.mlsId) + '\n'
    setMlsInput(newInput)
    setSuggestions([])
  }

  const _handleAddProperty = () => {
    setMlsInput(mlsInput + '\n')
  }

  return (
    <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Add Properties to Tour</h2>
        <p className="text-gray-500">
          Enter MLS numbers for the properties you want to include in your showing tour. 
          You can enter multiple MLS numbers, one per line.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="mls-input" className="block text-sm font-medium text-gray-700 mb-2">
            MLS Numbers
          </label>
          <div className="relative">
            <textarea
              id="mls-input"
              value={mlsInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter MLS numbers, one per line:&#10;Example: MLS12345&#10;TLD10000001&#10;MLS-A12345"
              className="w-full h-32 px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none transition-all duration-200"
            />
            
            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-soft-lg max-h-60 overflow-auto">
                {suggestions.map((property) => (
                  <button
                    key={property.id}
                    type="button"
                    onClick={() => handleSuggestionClick(property)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors duration-200"
                  >
                    <div className="font-medium text-gray-700">{property.mlsId}</div>
                    <div className="text-sm text-gray-500">{property.address}, {property.city}, {property.province}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Start typing to see property suggestions, or enter MLS numbers directly.
          </p>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-soft-sm text-seasalt-500 bg-keppel-500 hover:shadow-soft-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500 transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Plan Showings
          </button>
        </div>
      </form>

    </div>
  )
}
