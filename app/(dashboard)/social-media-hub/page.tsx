'use client'

import Image from 'next/image'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { INSTAGRAM_TEMPLATES } from '@/lib/instagram-templates'

interface CustomSearchTerm {
  id: string
  keyword: string
  location: string | null
  category: string | null
  isActive: boolean
  createdAt: string
}

interface TrendDataPoint {
  date: string
  value: number
}

interface TrendingSearch {
  id?: string
  keyword: string
  location: string
  category?: string
  searchVolume?: number
  trendDirection?: 'up' | 'down' | 'stable'
  rank?: number
  trendData?: TrendDataPoint[]
  lastUpdated: Date | string
}

export default function SocialMediaHub() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'custom' | 'overall' | 'templates'>('custom')
  const [searchTerms, setSearchTerms] = useState<CustomSearchTerm[]>([])
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([])
  const [overallTrending, setOverallTrending] = useState<TrendingSearch[]>([])
  const [rssTrending, setRssTrending] = useState<Array<{
    title: string
    link: string
    pubDate: string
    description?: string
    category?: string
    traffic?: string
    picture?: string
    pictureSource?: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [overallLoading, setOverallLoading] = useState(false)
  const [rssLoading, setRssLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [overallRefreshing, setOverallRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newKeywords, setNewKeywords] = useState<string[]>(['', '', ''])
  const [location, setLocation] = useState('')
  
  // Template generation state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [userInput, setUserInput] = useState('')
  const [generatedCaption, setGeneratedCaption] = useState('')
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchSearchTerms()
      if (activeTab === 'custom') {
        fetchTrendingSearches()
      } else if (activeTab === 'overall') {
        fetchOverallTrending()
        fetchRSSTrending()
      }
      // Templates tab doesn't need to fetch data on load
    }
  }, [session, activeTab])

  const fetchSearchTerms = async () => {
    try {
      const response = await fetch('/api/social-media/custom-search-terms')
      const data = await response.json() as { success: boolean; searchTerms?: CustomSearchTerm[] }
      
      if (data.success && data.searchTerms) {
        setSearchTerms(data.searchTerms)
        if (data.searchTerms.length > 0 && data.searchTerms[0]) {
          setLocation(data.searchTerms[0].location || '')
        }
      }
    } catch (error) {
      console.error('Error fetching search terms:', error)
    }
  }

  const fetchTrendingSearches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social-media/trending-searches')
      const data = await response.json() as { 
        success: boolean
        trendingSearches?: TrendingSearch[]
        message?: string
      }
      
      if (data.success && data.trendingSearches) {
        setTrendingSearches(data.trendingSearches)
      }
    } catch (error) {
      console.error('Error fetching trending searches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSearchTerm = async (termId: string) => {
    if (!confirm('Are you sure you want to delete this search term?')) {
      return
    }

    try {
      const response = await fetch(`/api/social-media/custom-search-terms?id=${termId}`, {
        method: 'DELETE'
      })
      const data = await response.json() as { success: boolean; error?: string }
      
      if (data.success) {
        // Refresh the search terms list
        await fetchSearchTerms()
        // Also refresh trending searches if on the custom tab
        if (activeTab === 'custom') {
          await fetchTrendingSearches()
        }
      } else {
        alert(`Failed to delete search term: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting search term:', error)
      alert('Failed to delete search term. Please try again.')
    }
  }

  const handleSaveSearchTerms = async () => {
    const keywords = newKeywords.filter(k => k.trim() !== '')
    
    if (keywords.length === 0) {
      alert('Please enter at least one search term')
      return
    }

    try {
      const response = await fetch('/api/social-media/custom-search-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          location: location.trim() || undefined
        })
      })

      const data = await response.json() as { success: boolean; message?: string }
      
      if (data.success) {
        setShowAddModal(false)
        setNewKeywords(['', '', ''])
        setLocation('')
        await fetchSearchTerms()
        await fetchTrendingSearches()
      } else {
        alert(data.message || 'Failed to save search terms')
      }
    } catch (error) {
      console.error('Error saving search terms:', error)
      alert('Failed to save search terms')
    }
  }

  const fetchOverallTrending = async () => {
    try {
      setOverallLoading(true)
      const response = await fetch('/api/social-media/overall-trending')
      const data = await response.json() as { 
        success: boolean
        trendingSearches?: TrendingSearch[]
        location?: string
      }
      
      if (data.success && data.trendingSearches) {
        setOverallTrending(data.trendingSearches)
        if (data.location) {
          setLocation(data.location)
        }
      }
    } catch (error) {
      console.error('Error fetching overall trending searches:', error)
    } finally {
      setOverallLoading(false)
    }
  }

  const fetchRSSTrending = async () => {
    try {
      setRssLoading(true)
      const response = await fetch('/api/social-media/rss-trending')
      const data = await response.json() as {
        success: boolean
        trendingTopics?: Array<{
          title: string
          link: string
          pubDate: string
          description?: string
          category?: string
          traffic?: string
          picture?: string
          pictureSource?: string
        }>
        location?: string
        error?: string
        details?: string
      }
      
      if (data.success && data.trendingTopics) {
        // Filter out any items with missing titles (likely invalid data)
        const validTopics = data.trendingTopics.filter(topic => 
          topic.title && topic.title.trim() !== '' && topic.title !== 'Untitled'
        )
        
        if (validTopics.length > 0) {
          setRssTrending(validTopics)
          console.log(`Loaded ${validTopics.length} valid trending topics from RSS feed (${data.trendingTopics.length - validTopics.length} filtered out)`)
        } else {
          console.warn('RSS feed returned items but all had empty titles. Full data:', data.trendingTopics)
          setRssTrending([])
          alert('RSS feed returned data but topics are missing titles. This may be a parsing issue with Google Trends RSS format.')
        }
      } else {
        console.error('Failed to fetch RSS trending topics:', data.error || data.details)
        // Show user-friendly error message
        if (data.error || data.details) {
          alert(`Failed to load trending topics: ${data.error || data.details}`)
        }
      }
    } catch (error) {
      console.error('Error fetching RSS trending topics:', error)
      alert('Failed to fetch trending topics. Please try again later.')
    } finally {
      setRssLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (activeTab === 'custom') {
      setRefreshing(true)
      try {
        const response = await fetch('/api/social-media/trending-searches', {
          method: 'POST'
        })

        const data = await response.json() as { success: boolean; message?: string }
        
        if (data.success) {
          await fetchTrendingSearches()
        }
      } catch (error) {
        console.error('Error refreshing trends:', error)
      } finally {
        setRefreshing(false)
      }
        } else {
      setOverallRefreshing(true)
      try {
        const response = await fetch('/api/social-media/overall-trending', {
          method: 'POST'
        })

        const data = await response.json() as { success: boolean; message?: string }
        
        if (data.success) {
          await Promise.all([fetchOverallTrending(), fetchRSSTrending()])
        }
      } catch (error) {
        console.error('Error refreshing overall trends:', error)
      } finally {
        setOverallRefreshing(false)
      }
    }
  }

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'up':
        return '📈'
      case 'down':
        return '📉'
      default:
        return '➡️'
    }
  }

  const handleGeneratePost = async () => {
    if (!selectedTemplate || !userInput.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/social-media/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          userInput: userInput.trim(),
          location: location || 'your area',
          // Optionally include trending topic if available
          trendingTopic: rssTrending[0]?.title || undefined,
        }),
      })

      const data = await response.json() as {
        success: boolean
        caption?: string
        hashtags?: string[]
        error?: string
      }

      if (data.success && data.caption) {
        setGeneratedCaption(data.caption)
        setGeneratedHashtags(data.hashtags || [])
      } else {
        alert(data.error || 'Failed to generate post')
      }
    } catch (error) {
      console.error('Error generating post:', error)
      alert('Failed to generate post. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyToClipboard = () => {
    const fullPost = `${generatedCaption}\n\n${generatedHashtags.map(tag => `#${tag}`).join(' ')}`
    navigator.clipboard.writeText(fullPost)
    alert('Copied to clipboard!')
  }

  const getTrendColor = (direction?: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatTrendValue = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  if (loading && trendingSearches.length === 0) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keppel-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-700 mb-2">Social Media Hub</h1>
          <p className="text-gray-500">Track trending searches and generate engaging social media content</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={activeTab === 'custom' ? refreshing : overallRefreshing}
            className="px-4 py-2 bg-keppel-50 text-keppel-700 rounded-lg hover:bg-keppel-100 transition-colors disabled:opacity-50"
          >
            {activeTab === 'custom' 
              ? (refreshing ? 'Refreshing...' : '🔄 Refresh Trends')
              : (overallRefreshing ? 'Refreshing...' : '🔄 Refresh Trends')
            }
          </button>
          {activeTab === 'custom' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
            >
              {searchTerms.length > 0 ? '✏️ Edit Search Terms' : '➕ Add Search Terms'}
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('custom')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'custom'
                  ? 'border-keppel-500 text-keppel-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🔍 Custom Search Terms
            </button>
            <button
              onClick={() => setActiveTab('overall')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'overall'
                  ? 'border-keppel-500 text-keppel-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📈 Overall Trending Searches
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'templates'
                  ? 'border-keppel-500 text-keppel-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Post Templates
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'custom' && (
        <>
      {/* Custom Search Terms Section */}
      {searchTerms.length === 0 ? (
        <div className="bg-gradient-to-r from-keppel-50 to-cyan-50 rounded-xl p-8 mb-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Search Terms Configured</h2>
          <p className="text-gray-600 mb-6">Add 2-3 custom search terms to start tracking trending searches</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
          >
            Add Search Terms
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Your Custom Search Terms</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-keppel-600 hover:text-keppel-700"
            >
              Edit
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {searchTerms.map((term) => (
              <span
                key={term.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-keppel-50 text-keppel-700 rounded-lg border border-keppel-200"
              >
                {term.keyword}
                <button
                  onClick={() => handleDeleteSearchTerm(term.id)}
                  className="ml-1 text-red-500 hover:text-red-700 transition-colors"
                  title="Delete search term"
                  aria-label={`Delete ${term.keyword}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          {location && (
            <p className="text-sm text-gray-500 mt-3">📍 Location: {location}</p>
          )}
        </div>
      )}

      {/* Trending Searches Dashboard */}
      {trendingSearches.length > 0 ? (
        <div className="space-y-6">
          {trendingSearches.map((trend) => (
            <div
              key={trend.keyword}
              className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">{trend.keyword}</h3>
                  <p className="text-sm text-gray-500">{trend.location}</p>
                </div>
                <div className={`px-3 py-1 rounded-lg border ${getTrendColor(trend.trendDirection)}`}>
                  <span className="text-sm font-medium">
                    {getTrendIcon(trend.trendDirection)} {trend.trendDirection?.toUpperCase() || 'STABLE'}
                  </span>
                </div>
              </div>

              {trend.searchVolume && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Search Volume</p>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatTrendValue(trend.searchVolume)}
                  </p>
                </div>
              )}

              {trend.trendData && trend.trendData.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Trend (Last 30 Days)</p>
                  <div className="h-32 flex items-end gap-1">
                    {trend.trendData.slice(-30).map((point, i) => {
                      const maxValue = Math.max(...trend.trendData!.map(p => p.value))
                      const height = (point.value / maxValue) * 100
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-keppel-400 rounded-t hover:bg-keppel-500 transition-colors"
                          style={{ height: `${height}%` }}
                          title={`${point.date}: ${point.value}`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{trend.trendData[0]?.date}</span>
                    <span>{trend.trendData[trend.trendData.length - 1]?.date}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(trend.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : searchTerms.length > 0 ? (
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Trending Data Yet</h3>
          <p className="text-gray-500 mb-4">Click "Refresh Trends" to fetch the latest data</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
          >
            Refresh Trends
          </button>
        </div>
      ) : null}
        </>
      )}
      
      {activeTab === 'overall' && (
        <>
          {/* Overall Trending Searches Tab */}
          
          {/* RSS Trending Topics Section */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-700">🔥 Today's Trending Topics (RSS)</h2>
                  <p className="text-sm text-gray-500">Trending topics from Google Trends RSS feed for Canada (refreshes every 2 hours)</p>
                </div>
                <button
                  onClick={fetchRSSTrending}
                  disabled={rssLoading}
                  className="px-3 py-1 text-sm bg-keppel-50 text-keppel-700 rounded-lg hover:bg-keppel-100 transition-colors disabled:opacity-50"
                >
                  {rssLoading ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>

              {rssLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-keppel-500"></div>
                </div>
              ) : rssTrending.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Showing {rssTrending.length} trending topic{rssTrending.length !== 1 ? 's' : ''} from Google Trends (Canada)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rssTrending.slice(0, 12).map((topic, idx) => (
                    <a
                      key={`${topic.title}-${idx}`}
                      href={topic.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 bg-gray-50 hover:bg-keppel-50 rounded-lg border border-gray-200 hover:border-keppel-200 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-keppel-600 bg-keppel-100 px-2 py-1 rounded">
                          #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {topic.traffic && (
                            <span className="text-xs font-medium text-gray-600 bg-blue-50 px-2 py-1 rounded">
                              {topic.traffic}
                            </span>
                          )}
                          {topic.category && (
                            <span className="text-xs text-gray-500 capitalize">{topic.category}</span>
                          )}
                        </div>
                      </div>
                      {topic.picture && (
                        <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={topic.picture}
                            alt={topic.title}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                      <h3 className="font-medium text-gray-700 group-hover:text-keppel-700 mb-1 line-clamp-2">
                        {topic.title || topic.link || 'Untitled Topic'}
                      </h3>
                      {topic.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{topic.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {new Date(topic.pubDate).toLocaleDateString()}
                        </p>
                        {topic.pictureSource && (
                          <p className="text-xs text-gray-400">{topic.pictureSource}</p>
                        )}
                      </div>
                    </a>
                  ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No trending topics available.</p>
                  <p className="text-sm">The RSS feed may be temporarily unavailable or there may be no trending topics for Canada at this time.</p>
                  <button
                    onClick={fetchRSSTrending}
                    className="mt-4 px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Overall Search Volume Trends Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">📊 Overall Search Volume Trends</h2>
            {overallLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keppel-500"></div>
              </div>
            ) : overallTrending.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    📊 Showing overall real estate trending searches for: <strong>{location || 'your area'}</strong>
                  </p>
                </div>
                {overallTrending.map((trend) => (
                <div
                  key={trend.keyword}
                  className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-700 mb-1">{trend.keyword}</h3>
                      <p className="text-sm text-gray-500">{trend.location}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg border ${getTrendColor(trend.trendDirection)}`}>
                      <span className="text-sm font-medium">
                        {getTrendIcon(trend.trendDirection)} {trend.trendDirection?.toUpperCase() || 'STABLE'}
                      </span>
                    </div>
                  </div>

                  {trend.searchVolume && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Search Volume</p>
                      <p className="text-2xl font-bold text-gray-700">
                        {formatTrendValue(trend.searchVolume)}
                      </p>
                    </div>
                  )}

                  {trend.trendData && trend.trendData.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-3">Trend (Last 30 Days)</p>
                      <div className="h-32 flex items-end gap-1">
                        {trend.trendData.slice(-30).map((point, i) => {
                          const maxValue = Math.max(...trend.trendData!.map(p => p.value))
                          const height = (point.value / maxValue) * 100
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-keppel-400 rounded-t hover:bg-keppel-500 transition-colors"
                              style={{ height: `${height}%` }}
                              title={`${point.date}: ${point.value}`}
                            />
                          )
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{trend.trendData[0]?.date}</span>
                        <span>{trend.trendData[trend.trendData.length - 1]?.date}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(trend.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-8 text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Trending Data Yet</h3>
                <p className="text-gray-500 mb-4">Click "Refresh Trends" to fetch overall real estate trending searches</p>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
                >
                  Refresh Trends
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {activeTab === 'templates' && (
        <>
          {/* Post Templates Tab */}
          <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Instagram Post Templates</h2>
              <p className="text-gray-500">
                Create engaging Instagram posts for your business. Choose from real estate or business templates, input your idea, and AI generates professional content.
              </p>
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Choose a Template</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Filter templates - could add category filter state
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100"
                  >
                    All Templates ({INSTAGRAM_TEMPLATES.length})
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {INSTAGRAM_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      setGeneratedCaption('')
                      setGeneratedHashtags([])
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-keppel-500 bg-keppel-50'
                        : 'border-gray-200 bg-white hover:border-keppel-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <h4 className="font-semibold text-gray-700 mb-1">{template.name}</h4>
                    <p className="text-sm text-gray-500">{template.description}</p>
                    <span className="inline-block mt-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {template.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* User Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What kind of post do you want to create?
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="E.g., 'Beautiful 3-bedroom house in downtown with modern kitchen and large backyard' or 'Housing prices up 5% this quarter, great time for sellers'..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500 resize-none"
                rows={4}
              />
              <p className="mt-2 text-xs text-gray-500">
                Describe your post idea or property details. AI will generate engaging content based on the selected template.
              </p>
            </div>

            {/* Generate Button */}
            {selectedTemplate && userInput.trim() && (
              <div className="mb-6">
                <button
                  onClick={handleGeneratePost}
                  disabled={isGenerating}
                  className="w-full px-6 py-3 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating...
                    </span>
                  ) : (
                    '✨ Generate Post with AI'
                  )}
                </button>
              </div>
            )}

            {/* Generated Content Preview */}
            {generatedCaption && (
              <div className="bg-gradient-to-r from-keppel-50 to-blue-50 border border-keppel-200 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Generated Post</h3>
                  <button
                    onClick={() => {
                      setGeneratedCaption('')
                      setGeneratedHashtags([])
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
                
                {/* Caption Preview */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2 font-medium">Caption:</div>
                  <div className="whitespace-pre-wrap text-gray-700">{generatedCaption}</div>
                </div>

                {/* Hashtags */}
                {generatedHashtags.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-600 mb-2 font-medium">Hashtags:</div>
                    <div className="flex flex-wrap gap-2">
                      {generatedHashtags.map((tag, idx) => (
                        <span key={idx} className="text-sm text-keppel-600 bg-keppel-50 px-2 py-1 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    📋 Copy to Clipboard
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement save as draft
                      alert('Save as draft - Coming soon!')
                    }}
                    className="flex-1 px-4 py-2 bg-keppel-100 text-keppel-700 rounded-lg hover:bg-keppel-200 transition-colors"
                  >
                    💾 Save as Draft
                  </button>
                  <button
                    onClick={() => {
                      // TODO: Implement Instagram publish
                      alert('Publish to Instagram - Coming soon!')
                    }}
                    className="flex-1 px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
                  >
                    📱 Publish to Instagram
                  </button>
                </div>
              </div>
            )}

            {/* Trending Topics Preview (for reference) */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Available Trending Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">RSS Trending Topics:</p>
                  <p className="text-sm text-gray-500">
                    {rssTrending.length > 0 
                      ? `${rssTrending.length} topics available (e.g., "${rssTrending[0]?.title || 'N/A'}")`
                      : 'No RSS topics loaded yet. Switch to "Overall Trending Searches" tab to load.'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Custom Search Terms:</p>
                  <p className="text-sm text-gray-500">
                    {searchTerms.length > 0
                      ? `${searchTerms.length} custom terms configured`
                      : 'No custom search terms configured. Switch to "Custom Search Terms" tab to add.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> See <code className="bg-blue-100 px-1 rounded">INSTAGRAM_TEMPLATES_PROPOSAL.md</code> for the full architecture and implementation plan.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Search Terms Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {searchTerms.length > 0 ? 'Edit Search Terms' : 'Add Search Terms'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter up to 3 search terms to track trending searches. For example: "homes for sale Vernon", "Vernon real estate", "condos Vernon"
            </p>

            <div className="space-y-4 mb-6">
              {newKeywords.map((keyword, index) => (
                <div key={index}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Term {index + 1}
                  </label>
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => {
                      const updated = [...newKeywords]
                      updated[index] = e.target.value
                      setNewKeywords(updated)
                    }}
                    placeholder={`e.g., ${index === 0 ? 'homes for sale Vernon' : index === 1 ? 'Vernon real estate' : 'condos Vernon'}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
                  />
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (Optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Vernon, BC"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to auto-detect from your properties
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewKeywords(['', '', ''])
                  setLocation('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearchTerms}
                className="flex-1 px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

