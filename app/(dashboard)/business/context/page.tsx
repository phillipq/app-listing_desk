"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface BusinessContext {
  businessInfo: {
    name: string
    description: string
    services: string[]
    specialties: string[]
    location: string
    hours: string
    contactInfo: string
  }
  additionalContext: string
}

export default function BusinessContextPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [context, setContext] = useState<BusinessContext>({
    businessInfo: {
      name: "",
      description: "",
      services: [],
      specialties: [],
      location: "",
      hours: "",
      contactInfo: ""
    },
    additionalContext: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [newService, setNewService] = useState("")
  const [newSpecialty, setNewSpecialty] = useState("")

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
      const response = await fetch("/api/business/context")
      if (response.ok) {
        const data = await response.json() as { context?: BusinessContext }
        setContext(data.context || {
          businessInfo: {
            name: "",
            description: "",
            services: [],
            specialties: [],
            location: "",
            hours: "",
            contactInfo: ""
          },
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
      const response = await fetch("/api/business/context", {
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
      businessInfo: {
        ...prev.businessInfo,
        services: [...prev.businessInfo.services, newService.trim()]
      }
    }))
    setNewService("")
  }

  const removeService = (index: number) => {
    setContext(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        services: prev.businessInfo.services.filter((_, i) => i !== index)
      }
    }))
  }

  const addSpecialty = () => {
    if (!newSpecialty.trim()) return
    setContext(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        specialties: [...prev.businessInfo.specialties, newSpecialty.trim()]
      }
    }))
    setNewSpecialty("")
  }

  const removeSpecialty = (index: number) => {
    setContext(prev => ({
      ...prev,
      businessInfo: {
        ...prev.businessInfo,
        specialties: prev.businessInfo.specialties.filter((_, i) => i !== index)
      }
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
                Configure your business information to help the chatbot provide accurate responses about your services.
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

        {/* Business Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Business Information</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                value={context.businessInfo.name}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, name: e.target.value }
                }))}
                placeholder="Your business name"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={context.businessInfo.description}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, description: e.target.value }
                }))}
                placeholder="Describe your business and what you do..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={context.businessInfo.location}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, location: e.target.value }
                }))}
                placeholder="e.g., Downtown Seattle, 123 Main St"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Hours</label>
              <input
                type="text"
                value={context.businessInfo.hours}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, hours: e.target.value }
                }))}
                placeholder="e.g., Mon-Fri 9am-5pm, Sat 10am-2pm"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Information</label>
              <input
                type="text"
                value={context.businessInfo.contactInfo}
                onChange={(e) => setContext(prev => ({
                  ...prev,
                  businessInfo: { ...prev.businessInfo, contactInfo: e.target.value }
                }))}
                placeholder="e.g., Phone: (555) 123-4567, Email: info@business.com"
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
                {context.businessInfo.services.map((service, index) => (
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
                {context.businessInfo.specialties.map((specialty, index) => (
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

        {/* Additional Context */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Additional Context</h2>
          <p className="text-sm text-gray-500 mb-4">
            Add any additional information that will help the chatbot answer questions about your business.
          </p>
          <textarea
            value={context.additionalContext}
            onChange={(e) => setContext(prev => ({ ...prev, additionalContext: e.target.value }))}
            placeholder="e.g., 'We specialize in helping small businesses. We offer flexible payment plans. Our team has over 20 years of combined experience.'"
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
          />
        </div>

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

