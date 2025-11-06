'use client'
import { useState } from 'react'
import GeocodingHelper from "@/components/GeocodingHelper"


interface AddPropertyFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddPropertyForm({ onClose, onSuccess }: AddPropertyFormProps) {
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    province: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: 'residential',
    description: '',
    squareFootage: '',
    yearBuilt: '',
    lotSize: '',
    features: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const requestData = {
        ...formData,
        price: formData.price ? parseInt(formData.price) : 0,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : 0,
        squareFootage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        lotSize: formData.lotSize ? parseFloat(formData.lotSize) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(f => f) : []
      }
      
      console.log('Sending property data:', requestData)
      console.log('Postal code being sent:', requestData.postalCode)
      
      const response = await fetch('/api/property/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json() as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create property')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Add Manual Property</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-gray-700">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  id="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="123 Main Street"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="Vancouver"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                  Province/State *
                </label>
                <input
                  type="text"
                  name="province"
                  id="province"
                  required
                  value={formData.province}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="BC"
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="V6B 1A1"
                />
              </div>
            </div>

            {/* Coordinates */}
            <GeocodingHelper
              onCoordinatesFound={(coordinates) => {
                setFormData(prev => ({
                  ...prev,
                  latitude: coordinates.lat.toString(),
                  longitude: coordinates.lng.toString()
                }))
              }}
              onAddressFound={(address) => {
                setFormData(prev => ({
                  ...prev,
                  address: address
                }))
              }}
              onAddressParsed={(parsed) => {
                setFormData(prev => ({
                  ...prev,
                  address: parsed.address,
                  city: parsed.city,
                  province: parsed.province,
                  postalCode: parsed.postalCode
                }))
              }}
              currentAddress={formData.address}
              currentCoordinates={formData.latitude && formData.longitude ? {
                lat: parseFloat(formData.latitude),
                lng: parseFloat(formData.longitude)
              } : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  id="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="49.2827"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  id="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="-123.1207"
                />
              </div>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  id="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="750000"
                />
              </div>
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">
                  Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  id="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="3"
                />
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">
                  Bathrooms
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="bathrooms"
                  id="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="2.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
                  Property Type
                </label>
                <select
                  name="propertyType"
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                >
                  <option value="residential">Residential</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label htmlFor="squareFootage" className="block text-sm font-medium text-gray-700">
                  Square Footage
                </label>
                <input
                  type="number"
                  name="squareFootage"
                  id="squareFootage"
                  value={formData.squareFootage}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="1500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700">
                  Year Built
                </label>
                <input
                  type="number"
                  name="yearBuilt"
                  id="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="2010"
                />
              </div>
              <div>
                <label htmlFor="lotSize" className="block text-sm font-medium text-gray-700">
                  Lot Size (acres)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="lotSize"
                  id="lotSize"
                  value={formData.lotSize}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                  placeholder="0.25"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                placeholder="Beautiful property with great features..."
              />
            </div>

            <div>
              <label htmlFor="features" className="block text-sm font-medium text-gray-700">
                Features (comma-separated)
              </label>
              <input
                type="text"
                name="features"
                id="features"
                value={formData.features}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-keppel-500 focus:border-keppel-500"
                placeholder="garage, fireplace, pool, garden"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-keppel-500 hover:bg-keppel-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
