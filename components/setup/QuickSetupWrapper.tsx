'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'


interface SetupStep {
  id: string
  title: string
  description: string
  icon: string
  status: 'pending' | 'completed'
  action: () => void
}

interface SetupProgress {
  connectedChannels: {
    whatsapp: boolean
    instagram: boolean
    sms: boolean
    voicemail: boolean
  }
  progress: {
    connected: number
    total: number
    percentage: number
  }
}

export default function QuickSetupWrapper() {
  const { data: session } = useSession()
  const [progress, setProgress] = useState<SetupProgress | null>(null)
  const [loading, setLoading] = useState(true)

  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'whatsapp',
      title: 'Connect WhatsApp',
      description: 'Set up WhatsApp Business API for lead generation',
      icon: '📱',
      status: 'pending',
      action: () => {
        window.location.href = '/setup?tab=channels'
      }
    },
    {
      id: 'instagram',
      title: 'Connect Instagram',
      description: 'Link your Instagram Business account',
      icon: '📸',
      status: 'pending',
      action: () => {
        window.location.href = '/api/integrations/instagram/connect'
      }
    },
    {
      id: 'sms',
      title: 'Enable SMS',
      description: 'Configure SMS messaging via Twilio',
      icon: '💬',
      status: 'pending',
      action: () => {
        window.location.href = '/setup?tab=channels'
      }
    },
    {
      id: 'voicemail',
      title: 'Setup Voicemail',
      description: 'Configure voicemail handling',
      icon: '🎙️',
      status: 'pending',
      action: () => {
        window.location.href = '/setup?tab=channels'
      }
    }
  ])

  // Fetch setup progress on component mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/setup/progress')
        if (response.ok) {
          const data = await response.json() as SetupProgress
          setProgress(data)
          
          // Update step statuses based on connected channels
          setSteps(prevSteps => 
            prevSteps.map(step => ({
              ...step,
              status: data.connectedChannels[step.id as keyof SetupProgress['connectedChannels']] ? 'completed' : 'pending'
            }))
          )
        }
      } catch (error) {
        console.error('Error fetching setup progress:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchProgress()
    }
  }, [session?.user?.id])

  const handleStepClick = (step: SetupStep) => {
    step.action()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Quick Setup</h1>
        <p className="text-gray-500">Get your communication channels up and running in minutes</p>
      </div>

      {/* Status Overview */}
      {progress && (
        <div className="mb-8 bg-gradient-to-r from-keppel-50 to-cyan-50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Setup Status</h2>
              <p className="text-gray-600">
                {progress.progress.connected} of {progress.progress.total} communication channels connected
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-keppel-600">
                {progress.progress.percentage}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </div>
      )}

      {/* Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, _index) => (
          <div
            key={step.id}
            className={`bg-white rounded-xl shadow-soft-lg border p-6 hover:shadow-lg transition-all cursor-pointer ${
              step.status === 'completed' 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-100 hover:border-keppel-200'
            }`}
            onClick={() => handleStepClick(step)}
          >
            <div className="flex items-start space-x-4">
              <div className={`text-3xl ${step.status === 'completed' ? 'opacity-80' : ''}`}>
                {step.status === 'completed' ? '✅' : step.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-lg font-semibold ${
                    step.status === 'completed' ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    {step.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                    {step.status === 'completed' ? 'Connected' : 'Setup Required'}
                  </span>
                </div>
                <p className={`mb-4 ${
                  step.status === 'completed' ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.description}
                </p>
                <div className="flex items-center text-sm font-medium">
                  <span className={step.status === 'completed' ? 'text-green-600' : 'text-keppel-600'}>
                    {step.status === 'completed' ? 'View Settings' : 'Start Setup'} →
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Webhook URLs */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">🔗 Webhook URLs</h3>
        <p className="text-blue-700 mb-4">Use these URLs when configuring your communication channels:</p>
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3">
            <label className="text-sm font-medium text-gray-700">WhatsApp Webhook:</label>
            <code className="block text-sm text-gray-600 mt-1">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/whatsapp` : 'Loading...'}
            </code>
          </div>
          <div className="bg-white rounded-lg p-3">
            <label className="text-sm font-medium text-gray-700">Instagram Webhook:</label>
            <code className="block text-sm text-gray-600 mt-1">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/instagram` : 'Loading...'}
            </code>
          </div>
          <div className="bg-white rounded-lg p-3">
            <label className="text-sm font-medium text-gray-700">SMS Webhook:</label>
            <code className="block text-sm text-gray-600 mt-1">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/sms` : 'Loading...'}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
