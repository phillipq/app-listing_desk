"use client"


import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface FacebookGroup {
  id: string
  groupId: string
  name: string
  description?: string
  url: string
  isActive: boolean
  lastScraped?: string
  nextScrape?: string
  scrapeInterval: number
  createdAt: string
}

export default function FacebookGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [groups, setGroups] = useState<FacebookGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newGroup, setNewGroup] = useState({
    groupUrl: '',
    accessToken: '',
    scrapeInterval: 24
  })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchGroups()
  }, [session, status, router])

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/facebook/groups')
      if (response.ok) {
        const data = await response.json() as FacebookGroup[]
        setGroups(data)
      }
    } catch (error) {
      console.error("Failed to fetch Facebook groups:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsAdding(true)
      const response = await fetch('/api/facebook/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup)
      })

      if (response.ok) {
        setShowAddForm(false)
        setNewGroup({ groupUrl: '', accessToken: '', scrapeInterval: 24 })
        fetchGroups()
      } else {
        const error = await response.json() as { error?: string }
        alert(error.error || 'Failed to add group')
      }
    } catch (error) {
      console.error("Failed to add group:", error)
      alert("Failed to add group")
    } finally {
      setIsAdding(false)
    }
  }

  const handleScrapeGroup = async (groupId: string) => {
    try {
      const accessToken = prompt("Enter your Facebook access token:")
      if (!accessToken) return

      const response = await fetch(`/api/facebook/groups/${groupId}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      })

      if (response.ok) {
        const result = await response.json() as { newListings: number; updatedListings: number }
        alert(`Scraping completed! Found ${result.newListings} new listings and updated ${result.updatedListings} existing listings.`)
        fetchGroups()
      } else {
        const error = await response.json() as { error?: string }
        alert(error.error || 'Failed to scrape group')
      }
    } catch (error) {
      console.error("Failed to scrape group:", error)
      alert("Failed to scrape group")
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading Facebook groups...</p>
          </div>
        </div>
      
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Facebook Groups</h1>
              <p className="mt-2 text-gray-500">
                Manage Facebook groups for property listing scraping.
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-md hover:bg-keppel-600 transition-colors"
            >
              Add Group
            </button>
          </div>
        </div>

        {/* Add Group Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Add Facebook Group</h2>
            <form onSubmit={handleAddGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group URL
                </label>
                <input
                  type="url"
                  value={newGroup.groupUrl}
                  onChange={(e) => setNewGroup({ ...newGroup, groupUrl: e.target.value })}
                  placeholder="https://www.facebook.com/groups/123456789"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook Access Token
                </label>
                <input
                  type="password"
                  value={newGroup.accessToken}
                  onChange={(e) => setNewGroup({ ...newGroup, accessToken: e.target.value })}
                  placeholder="Your Facebook access token"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Get your access token from the Facebook Graph API Explorer
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scrape Interval (hours)
                </label>
                <select
                  value={newGroup.scrapeInterval}
                  onChange={(e) => setNewGroup({ ...newGroup, scrapeInterval: parseInt(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                >
                  <option value={6}>Every 6 hours</option>
                  <option value={12}>Every 12 hours</option>
                  <option value={24}>Every 24 hours</option>
                  <option value={48}>Every 48 hours</option>
                  <option value={168}>Weekly</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-md hover:bg-keppel-600 transition-colors disabled:opacity-50"
                >
                  {isAdding ? 'Adding...' : 'Add Group'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No Facebook groups configured.</p>
            <p className="text-gray-500 mt-2">Add a group to start scraping property listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 truncate">
                      {group.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {group.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {group.description && (
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex justify-between">
                      <span>Last Scraped:</span>
                      <span>{formatDate(group.lastScraped)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Scrape:</span>
                      <span>{formatDate(group.nextScrape)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Interval:</span>
                      <span>Every {group.scrapeInterval}h</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleScrapeGroup(group.id)}
                      className="flex-1 bg-keppel-500 text-seasalt-500 px-3 py-2 rounded-md hover:bg-keppel-600 transition-colors text-sm"
                    >
                      Scrape Now
                    </button>
                    <a
                      href={group.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-400 transition-colors text-sm text-center"
                    >
                      View Group
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    
  )
}
