'use client'

import { useState } from 'react'

interface TourProperty {
  id: string
  mlsId: string
  address: string
  city: string
  province: string
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  latitude?: number
  longitude?: number
  customDuration?: number
}

interface PropertyListProps {
  properties: TourProperty[]
  onReorder: (properties: TourProperty[]) => void
  onRemove: (propertyId: string) => void
  onNext: () => void
  onBack: () => void
}

export default function PropertyList({ properties, onReorder, onRemove, onNext, onBack }: PropertyListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const newProperties = [...properties]
    const draggedProperty = newProperties[draggedIndex]
    
    if (!draggedProperty) {
      setDraggedIndex(null)
      return
    }
    
    // Remove the dragged item
    newProperties.splice(draggedIndex, 1)
    
    // Insert at the new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    newProperties.splice(insertIndex, 0, draggedProperty)
    
    // Update order numbers
    const reorderedProperties = newProperties.map((prop, index) => ({
      ...prop,
      order: index + 1
    }))
    
    onReorder(reorderedProperties)
    setDraggedIndex(null)
  }

  const moveProperty = (fromIndex: number, toIndex: number) => {
    const newProperties = [...properties]
    const [movedProperty] = newProperties.splice(fromIndex, 1)
    
    if (!movedProperty) return
    
    newProperties.splice(toIndex, 0, movedProperty)
    
    // Update order numbers
    const reorderedProperties = newProperties.map((prop, index) => ({
      ...prop,
      order: index + 1
    }))
    
    onReorder(reorderedProperties)
  }

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-700">No properties found</h3>
          <p className="mt-1 text-sm text-gray-500">Please go back and enter valid MLS numbers.</p>
          <div className="mt-6">
            <button
              onClick={onBack}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Tour Properties</h2>
        <p className="text-gray-500">
          Drag and drop to reorder the properties for optimal routing. The order you set here will be used to calculate the most efficient tour route.
        </p>
      </div>

      <div className="space-y-3">
        {properties.map((property, index) => (
          <div
            key={property.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-slate-50 cursor-move transition-colors"
          >
            {/* Drag Handle */}
            <div className="flex-shrink-0 mr-4">
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>

            {/* Property Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-pumpkin-800 mr-3">
                  #{index + 1}
                </span>
                <p className="text-sm font-medium text-gray-700 truncate">
                  {property.mlsId}
                </p>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {property.address}
              </p>
            </div>

            {/* Move Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => moveProperty(index, Math.max(0, index - 1))}
                disabled={index === 0}
                className="p-1 text-gray-500 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveProperty(index, Math.min(properties.length - 1, index + 1))}
                disabled={index === properties.length - 1}
                className="p-1 text-gray-500 hover:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={() => onRemove(property.id)}
                className="p-1 text-red-400 hover:text-gray-700"
                title="Remove property"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} in tour
          </span>
          <button
            onClick={onNext}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-gray-700 bg-keppel-500 hover:bg-keppel-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-keppel-500"
          >
            Configure Tour
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
