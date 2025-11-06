"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface RealtorContext {
  realtorInfo: {
    name: string
    description: string
    services: string[]
    specialties: string[]
    location: string
    hours: string
    contactInfo: string
  }
  communities: Array<{
    name: string
    description: string
    schools: string[]
    amenities: string[]
    notes: string
  }>
  additionalContext: string
}

export default function ContextPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [context, setContext] = useState<RealtorContext>({
    realtorInfo: {
      name: "",
      description: "",
      services: [],
      specialties: [],
      location: "",
      hours: "",
      contactInfo: ""
    },
    communities: [],
    additionalContext: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [newService, setNewService] = useState("")
  const [newSpecialty, setNewSpecialty] = useState("")
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    schools: [] as string[],
    amenities: [] as string[],
    notes: ""
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchContext()
  }, [session, status, router])

  const fetchContext = async () => {
    try {
      const response = await fetch("/api/realtor/context")
      if (response.ok) {
        const data = await response.json() as { context?: RealtorContext }
        setContext(data.context || {
          realtorInfo: {
            name: "",
            description: "",
            services: [],
            specialties: [],
            location: "",
            hours: "",
            contactInfo: ""
          },
          communities: [],
          additionalContext: ""
        })
      }
    } catch (error) {
      console.error("Failed to fetch context:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/realtor/context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context })
      })

      if (response.ok) {
        setMessage("Context saved successfully!")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("Failed to save context")
        setTimeout(() => setMessage(""), 3000)
      }
    } catch (error) {
      console.error("Failed to save context:", error)
      setMessage("Failed to save context")
      setTimeout(() => setMessage(""), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const addService = () => {
    if (!newService.trim()) return
    setContext(prev => ({
      ...prev,
      realtorInfo: {
        ...prev.realtorInfo,
        services: [...prev.realtorInfo.services, newService.trim()]
      }
    }))
    setNewService("")
  }

  const removeService = (index: number) => {
    setContext(prev => ({
      ...prev,
      realtorInfo: {
        ...prev.realtorInfo,
        services: prev.realtorInfo.services.filter((_, i) => i !== index)
      }
    }))
  }

  const addSpecialty = () => {
    if (!newSpecialty.trim()) return
    setContext(prev => ({
      ...prev,
      realtorInfo: {
        ...prev.realtorInfo,
        specialties: [...prev.realtorInfo.specialties, newSpecialty.trim()]
      }
    }))
    setNewSpecialty("")
  }

  const removeSpecialty = (index: number) => {
    setContext(prev => ({
      ...prev,
      realtorInfo: {
        ...prev.realtorInfo,
        specialties: prev.realtorInfo.specialties.filter((_, i) => i !== index)
      }
    }))
  }

  const addCommunity = () => {
    if (!newCommunity.name.trim()) {
      setMessage("Please enter a community name")
      setTimeout(() => setMessage(""), 3000)
      return
    }

    if (editingIndex !== null) {
      // Editing existing community
      setContext(prev => ({
        ...prev,
        communities: prev.communities.map((community, index) => 
          index === editingIndex ? { ...newCommunity } : community
        )
      }))
      setMessage("Community updated successfully!")
    } else {
      // Adding new community
      setContext(prev => ({
        ...prev,
        communities: [...prev.communities, { ...newCommunity }]
      }))
      setMessage("Community added successfully!")
    }

    // Reset the form and close modal
    setNewCommunity({
      name: "",
      description: "",
      schools: [],
      amenities: [],
      notes: ""
    })
    setEditingIndex(null)
    setIsModalOpen(false)

    setTimeout(() => setMessage(""), 3000)
  }

  const openModal = () => {
    setEditingIndex(null)
    setNewCommunity({
      name: "",
      description: "",
      schools: [],
      amenities: [],
      notes: ""
    })
    setIsModalOpen(true)
  }

  const editCommunity = (index: number) => {
    const community = context.communities[index]
    if (!community) return
    setNewCommunity({
      name: community.name,
      description: community.description,
      schools: [...community.schools],
      amenities: [...community.amenities],
      notes: community.notes
    })
    setEditingIndex(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingIndex(null)
    setNewCommunity({
      name: "",
      description: "",
      schools: [],
      amenities: [],
      notes: ""
    })
  }

  const removeCommunity = (index: number) => {
    setContext(prev => ({
      ...prev,
      communities: prev.communities.filter((_, i) => i !== index)
    }))
  }

  const addNewCommunityArrayItem = (field: 'schools' | 'amenities', value: string) => {
    if (!value.trim()) return
    setNewCommunity(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }))
  }

  const removeNewCommunityArrayItem = (field: 'schools' | 'amenities', itemIndex: number) => {
    setNewCommunity(prev => ({
      ...prev,
      [field]: prev[field].filter((_, j) => j !== itemIndex)
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-keppel-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading context...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Chatbot Context</h1>
              <p className="mt-2 text-gray-500">
                Configure your realtor information and local knowledge to help the chatbot provide accurate responses.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes("successfully") 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        {/* Realtor Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Realtor Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Realtor Name</label>
              <input
                type="text"
                value={context.realtorInfo.name}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  realtorInfo: { ...prev.realtorInfo, name: e.target.value }
                }))}
                placeholder="Your name or realtor name"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={context.realtorInfo.description}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  realtorInfo: { ...prev.realtorInfo, description: e.target.value }
                }))}
                placeholder="Describe your real estate services and approach..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Area</label>
              <input
                type="text"
                value={context.realtorInfo.location}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  realtorInfo: { ...prev.realtorInfo, location: e.target.value }
                }))}
                placeholder="e.g., Downtown Seattle, King County, Bellevue"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
              <input
                type="text"
                value={context.realtorInfo.hours}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  realtorInfo: { ...prev.realtorInfo, hours: e.target.value }
                }))}
                placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
              <input
                type="text"
                value={context.realtorInfo.contactInfo}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  realtorInfo: { ...prev.realtorInfo, contactInfo: e.target.value }
                }))}
                placeholder="e.g., Phone: (555) 123-4567, Email: info@realtor.com"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addService()}
                  placeholder="Add a service"
                  className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                />
                <button
                  onClick={addService}
                  className="bg-keppel-500 text-white px-4 py-2 rounded-md hover:bg-keppel-600 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {context.realtorInfo.services.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {service}
                    <button
                      onClick={() => removeService(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSpecialty()}
                  placeholder="Add a specialty"
                  className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                />
                <button
                  onClick={addSpecialty}
                  className="bg-keppel-500 text-white px-4 py-2 rounded-md hover:bg-keppel-600 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {context.realtorInfo.specialties.map((specialty, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {specialty}
                    <button
                      onClick={() => removeSpecialty(index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Communities & Areas */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-700">Communities & Areas</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add specific information about communities, neighborhoods, or areas you work in.
              </p>
            </div>
            <button
              onClick={openModal}
              className="bg-keppel-500 text-white px-4 py-2 rounded-md hover:bg-keppel-600 transition-colors"
            >
              Add Community
            </button>
          </div>

          {/* Communities Table */}
          {context.communities.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-700">Added Communities</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Community
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Schools
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amenities
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {context.communities.map((community, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-700">
                            {community.name || 'Unnamed Community'}
                          </div>
                          {community.notes && (
                            <div className="text-sm text-gray-500 mt-1">
                              {community.notes.length > 100 
                                ? `${community.notes.substring(0, 100)}...` 
                                : community.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {community.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {community.schools.length > 0 ? (
                              community.schools.slice(0, 2).map((school, schoolIndex) => (
                                <span
                                  key={schoolIndex}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {school}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">None</span>
                            )}
                            {community.schools.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{community.schools.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {community.amenities.length > 0 ? (
                              community.amenities.slice(0, 2).map((amenity, amenityIndex) => (
                                <span
                                  key={amenityIndex}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                >
                                  {amenity}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">None</span>
                            )}
                            {community.amenities.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{community.amenities.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => editCommunity(index)}
                              className="text-gray-700 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeCommunity(index)}
                              className="text-gray-700 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {context.communities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No communities added yet.</p>
              <p className="text-sm">Click "Add Community" to get started.</p>
            </div>
          )}
        </div>

        {/* Additional Context */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Additional Context</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add any additional information that will help the chatbot answer questions about your real estate services.
          </p>
          <textarea
            value={context.additionalContext}
            onChange={(e) => setContext(prev => ({ ...prev, additionalContext: e.target.value }))}
            placeholder="e.g., 'We specialize in first-time homebuyers. We offer free consultations. Our team has over 15 years of combined experience in the local market.'"
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
          />
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700">
                    {editingIndex !== null ? 'Edit Community' : 'Add New Community'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Community Name *
                    </label>
                    <input
                      type="text"
                      value={newCommunity.name}
                      onChange={(e) => setNewCommunity(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Hillsong, Downtown Core, Westside"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newCommunity.description}
                      onChange={(e) => setNewCommunity(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g., 'A family-friendly community with excellent schools and parks'"
                      className="w-full h-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schools
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add school name"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addNewCommunityArrayItem('schools', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addNewCommunityArrayItem('schools', input.value)
                          input.value = ''
                        }}
                        className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newCommunity.schools.map((school, schoolIndex) => (
                        <span
                          key={schoolIndex}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {school}
                          <button
                            onClick={() => removeNewCommunityArrayItem('schools', schoolIndex)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amenities
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add amenity"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addNewCommunityArrayItem('amenities', e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement
                          addNewCommunityArrayItem('amenities', input.value)
                          input.value = ''
                        }}
                        className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newCommunity.amenities.map((amenity, amenityIndex) => (
                        <span
                          key={amenityIndex}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {amenity}
                          <button
                            onClick={() => removeNewCommunityArrayItem('amenities', amenityIndex)}
                            className="text-green-600 hover:text-green-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={newCommunity.notes}
                      onChange={(e) => setNewCommunity(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g., 'This area is very new with no schools built yet, but plans are in place for a new elementary school by 2025.'"
                      className="w-full h-16 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={closeModal}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCommunity}
                    className="bg-keppel-500 text-white px-4 py-2 rounded-md hover:bg-keppel-600 transition-colors"
                  >
                    {editingIndex !== null ? 'Update Community' : 'Add Community'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-keppel-500 text-white px-6 py-3 rounded-md hover:bg-keppel-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save Context"}
          </button>
        </div>
      </div>
    </div>
  )
}
