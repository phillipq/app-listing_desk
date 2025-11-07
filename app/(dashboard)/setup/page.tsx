'use client'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

// Dynamically import the components to avoid SSR issues
const QuickSetup = dynamic(() => import('../../../components/setup/QuickSetupWrapper'), { ssr: false })
const Channels = dynamic(() => import('../../../components/setup/ChannelsWrapper'), { ssr: false })
const InstagramGuide = dynamic(() => import('../../../components/setup/InstagramGuideWrapper'), { ssr: false })
const WhatsAppGuide = dynamic(() => import('../../../components/setup/WhatsAppGuideWrapper'), { ssr: false })
const ExistingNumberGuide = dynamic(() => import('../../../components/setup/ExistingNumberGuideWrapper'), { ssr: false })
const ChatbotDeployment = dynamic(() => import('../../../components/setup/ChatbotDeploymentWrapper'), { ssr: false })
const Settings = dynamic(() => import('../../dashboard/settings/page'), { ssr: false })

const tabs = [
  { id: 'quick-setup', label: 'Quick Setup' },
  { id: 'channels', label: 'Channels' },
  { id: 'instagram-guide', label: 'Instagram Guide' },
  { id: 'whatsapp-guide', label: 'WhatsApp Guide' },
  { id: 'existing-number-guide', label: 'Existing Number Guide' },
  { id: 'chatbot-deployment', label: 'Chatbot Deployment' },
  { id: 'settings', label: 'Settings' }
]

export default function SetupPage() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('quick-setup')

  // Handle URL parameters to set initial tab
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'quick-setup':
        return <QuickSetup />
      case 'channels':
        return <Channels />
      case 'instagram-guide':
        return <InstagramGuide />
      case 'whatsapp-guide':
        return <WhatsAppGuide />
      case 'existing-number-guide':
        return <ExistingNumberGuide />
      case 'chatbot-deployment':
        return <ChatbotDeployment />
      case 'settings':
        return <Settings />
      default:
        return <QuickSetup />
    }
  }

  return (
    <div className="w-full">
      {/* Tab Navigation - Always visible at top */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-keppel-500 text-keppel-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area - Loads the actual page content */}
      <div className="w-full">
        {renderTabContent()}
      </div>
    </div>
  )
}
