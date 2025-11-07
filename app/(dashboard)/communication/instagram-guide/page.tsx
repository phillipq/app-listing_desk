'use client'

export default function InstagramGuidePage() {
  const steps = [
    {
      title: "One-Click Instagram Connect",
      description: "Connect your Instagram Business account in seconds - no technical setup required!",
      image: "🚀",
      details: [
        "Click 'Connect Instagram' in your dashboard",
        "You'll be redirected to Facebook's secure OAuth page",
        "Log in with your Facebook account (linked to Instagram Business)",
        "Grant permissions for Instagram messaging access",
        "Automatically redirected back to our platform - you're connected!"
      ]
    },
    {
      title: "Instagram Business Requirements",
      description: "Ensure your Instagram account is set up for business messaging",
      image: "📱",
      details: [
        "Your Instagram must be a Business account (not personal)",
        "Must be connected to a Facebook Page",
        "Business profile should be complete with contact info",
        "Account should be in good standing with Instagram",
        "No additional apps or developer accounts needed!"
      ]
    },
    {
      title: "Automatic AI Integration",
      description: "Your Instagram DMs are now powered by our AI chatbot",
      image: "🤖",
      details: [
        "All incoming DMs are automatically processed",
        "AI responds to common inquiries instantly",
        "Complex questions are flagged for your attention",
        "Lead qualification happens automatically",
        "All conversations appear in your unified inbox"
      ]
    },
    {
      title: "Customer Experience",
      description: "Your customers see a seamless Instagram experience",
      image: "💬",
      details: [
        "Messages appear in normal Instagram DM interface",
        "Your business name and profile are shown",
        "AI responses feel natural and helpful",
        "Customers can't tell it's automated",
        "You can take over conversations anytime"
      ]
    }
  ]

  const benefits = [
    {
      icon: "⚡",
      title: "Instant Setup",
      description: "No developer accounts, no complex configuration - just click and connect."
    },
    {
      icon: "🔒",
      title: "Secure OAuth",
      description: "Uses Facebook's official OAuth system for maximum security and reliability."
    },
    {
      icon: "📊",
      title: "Unified Inbox",
      description: "All Instagram DMs appear alongside WhatsApp, SMS, and voicemail in one place."
    },
    {
      icon: "🎯",
      title: "Lead Generation",
      description: "AI automatically qualifies leads from Instagram conversations."
    },
    {
      icon: "📱",
      title: "Native Experience",
      description: "Customers interact through normal Instagram - no learning curve."
    },
    {
      icon: "🔄",
      title: "Real-time Sync",
      description: "Messages sync instantly between Instagram and your dashboard."
    }
  ]

  const sampleConversation = [
    {
      sender: "Customer",
      message: "Hi! I saw your post about the new listings. Do you have any 3-bedroom houses under $400k?",
      timestamp: "2:30 PM",
      isAI: false
    },
    {
      sender: "AI Assistant",
      message: "Hello! I'd be happy to help you find a 3-bedroom home under $400k. I have several great options in that range. What area are you most interested in?",
      timestamp: "2:30 PM",
      isAI: true
    },
    {
      sender: "Customer",
      message: "I'm looking in the downtown area, close to the university if possible.",
      timestamp: "2:32 PM",
      isAI: false
    },
    {
      sender: "AI Assistant",
      message: "Perfect! I have 3 excellent properties near the university that fit your criteria. Could you share your email and phone number so I can send you the details and schedule a viewing?",
      timestamp: "2:32 PM",
      isAI: true
    },
    {
      sender: "Customer",
      message: "Sure! My email is sarah.johnson@email.com and my phone is (555) 123-4567",
      timestamp: "2:33 PM",
      isAI: false
    },
    {
      sender: "AI Assistant",
      message: "Thank you, Sarah! I'll send you the property details within the next hour. I'll also have our agent contact you to schedule viewings. Is there a preferred time that works best for you?",
      timestamp: "2:33 PM",
      isAI: true
    }
  ]

  const requirements = [
    {
      title: "Instagram Business Account",
      description: "Your Instagram must be converted to a Business account (free to do)",
      status: "Required"
    },
    {
      title: "Facebook Page Connection",
      description: "Your Instagram Business account must be connected to a Facebook Page",
      status: "Required"
    },
    {
      title: "Complete Business Profile",
      description: "Fill out your Instagram business profile with contact information",
      status: "Recommended"
    },
    {
      title: "Active Instagram Account",
      description: "Your account should be active and in good standing",
      status: "Required"
    },
    {
      title: "No Developer Account",
      description: "You don't need a Facebook Developer account - we handle everything",
      status: "Not Required"
    }
  ]

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Instagram Business Integration Guide</h1>
        <p className="text-gray-500">Connect your Instagram Business account in seconds and start capturing leads through DMs!</p>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">📸</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Ready to Connect?</h2>
            <p className="text-gray-600 mb-4">
              If you have an Instagram Business account, you can connect right now in under 30 seconds!
            </p>
            <a
              href="/communication/setup"
              className="inline-block bg-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              Connect Instagram Now
            </a>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">How It Works - 4 Simple Steps</h2>
        
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-purple-500 text-white">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-3">{step.description}</p>
                <ul className="space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-purple-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Conversation */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Sample Conversation</h2>
        <p className="text-gray-600 mb-4">Here's how a typical lead generation conversation looks:</p>
        
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {sampleConversation.map((msg, index) => (
            <div key={index} className={`flex ${msg.isAI ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                msg.isAI 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}>
                <div className="font-medium text-xs mb-1">
                  {msg.sender} • {msg.timestamp}
                </div>
                <div>{msg.message}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Result:</strong> Qualified lead created with contact information, property preferences, and viewing availability - all captured automatically!
          </p>
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Requirements Checklist</h2>
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-700">{req.title}</h3>
                <p className="text-sm text-gray-500">{req.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                req.status === 'Required' 
                  ? 'bg-red-100 text-red-700'
                  : req.status === 'Recommended'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Why Instagram Integration?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl mb-3">{benefit.icon}</div>
              <h3 className="font-semibold text-gray-700 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Common Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: Do I need a Facebook Developer account?</h3>
            <p className="text-sm text-gray-600">A: No! We handle all the technical integration. You just need a regular Facebook account connected to your Instagram Business account.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: Can customers tell it's an AI responding?</h3>
            <p className="text-sm text-gray-600">A: No, responses are designed to feel natural. You can also take over any conversation manually at any time.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: What if I don't have a Facebook Page?</h3>
            <p className="text-sm text-gray-600">A: You'll need to create one (it's free) and connect it to your Instagram Business account. This is required by Instagram for API access.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: Can I disconnect Instagram later?</h3>
            <p className="text-sm text-gray-600">A: Yes, you can disconnect Instagram at any time from your dashboard. Your Instagram account will return to normal operation.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href="/communication/setup"
          className="inline-block bg-purple-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-600 transition-colors"
        >
          Connect Instagram Now
        </a>
        <p className="mt-4 text-gray-500">
          Ready to start capturing leads through Instagram DMs? Click above to begin!
        </p>
      </div>
    </div>
  )
}