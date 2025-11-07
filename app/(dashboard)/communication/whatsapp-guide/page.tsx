'use client'

import { useState } from 'react'

export default function WhatsAppGuidePage() {
  const [integrationType, setIntegrationType] = useState<'new' | 'existing'>('new')

  const newNumberSteps = [
    {
      title: "One-Click Setup",
      description: "We handle everything for you - no Twilio account needed!",
      image: "🚀",
      details: [
        "Click 'Connect Communication Channels' in your dashboard",
        "Enter your business name",
        "Select 'New Phone Number' option",
        "We automatically create a Twilio subclient for you",
        "Get a dedicated phone number for WhatsApp, SMS, and Voicemail"
      ]
    },
    {
      title: "We Handle All Twilio Setup",
      description: "Our platform manages your Twilio subclient automatically",
      image: "⚙️",
      details: [
        "We create and manage your Twilio subclient account",
        "WhatsApp Business API configured automatically",
        "SMS capabilities enabled on your number",
        "Voicemail transcription set up",
        "Webhooks configured for message routing",
        "AI chatbot responses enabled"
      ]
    },
    {
      title: "Start Receiving Messages",
      description: "Your communication channels are ready to use",
      image: "📱",
      details: [
        "Share your new number with customers",
        "Messages automatically appear in your unified inbox",
        "AI responds to common inquiries",
        "Complex messages are flagged for your attention",
        "All conversations are tracked and qualified"
      ]
    }
  ]

  const existingNumberSteps = [
    {
      title: "Connect Your Existing Number",
      description: "Use your current business number - no disruption to customers",
      image: "📞",
      details: [
        "Click 'Connect Communication Channels' in your dashboard",
        "Enter your business name and existing phone number",
        "Select 'SMS + Voicemail' or 'WhatsApp + SMS + Voicemail'",
        "We verify your number and create a Twilio subclient",
        "Your existing number gets enhanced with our platform"
      ]
    },
    {
      title: "Update Voicemail Greeting",
      description: "Set up professional voicemail with our platform",
      image: "🎙️",
      details: [
        "We provide a professional voicemail greeting script",
        "Update your phone's voicemail message",
        "Voicemails will be automatically transcribed",
        "AI analyzes voicemails for lead qualification",
        "You'll receive SMS notifications for important voicemails"
      ]
    },
    {
      title: "Track All Communications",
      description: "Never miss a message or voicemail again",
      image: "📊",
      details: [
        "All SMS messages appear in your unified inbox",
        "Voicemails are transcribed and stored",
        "AI responds to common inquiries via SMS",
        "Lead qualification happens automatically",
        "Complete conversation history maintained"
      ]
    }
  ]

  const benefits = [
    {
      icon: "🤖",
      title: "AI-Powered Responses",
      description: "Smart chatbot handles common inquiries automatically, freeing you to focus on qualified leads."
    },
    {
      icon: "📈",
      title: "Lead Qualification",
      description: "Every message is analyzed and scored, helping you prioritize the most promising prospects."
    },
    {
      icon: "📱",
      title: "Unified Inbox",
      description: "All WhatsApp, SMS, and voicemail conversations in one organized dashboard."
    },
    {
      icon: "⚡",
      title: "Zero Technical Setup",
      description: "We handle all Twilio subclient creation, API configuration, and webhook setup automatically."
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your own Twilio subclient ensures complete data isolation and security - managed by us."
    },
    {
      icon: "💰",
      title: "Transparent Pricing",
      description: "Pay only for what you use with transparent, per-message pricing - no markup."
    }
  ]

  const currentSteps = integrationType === 'new' ? newNumberSteps : existingNumberSteps

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">WhatsApp Business Integration Guide</h1>
        <p className="text-gray-500">Get WhatsApp, SMS, and Voicemail working in minutes - no technical setup required!</p>
      </div>

      {/* Integration Type Selection */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Choose Your Integration Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setIntegrationType('new')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              integrationType === 'new'
                ? 'border-keppel-500 bg-keppel-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">🆕</div>
            <h3 className="font-semibold text-gray-700 mb-2">New Phone Number</h3>
            <p className="text-sm text-gray-500">
              We'll provision a dedicated number for your business with WhatsApp, SMS, and Voicemail capabilities.
            </p>
          </button>
          <button
            onClick={() => setIntegrationType('existing')}
            className={`p-4 rounded-lg border-2 transition-colors ${
              integrationType === 'existing'
                ? 'border-keppel-500 bg-keppel-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-2xl mb-2">📞</div>
            <h3 className="font-semibold text-gray-700 mb-2">Use Existing Number</h3>
            <p className="text-sm text-gray-500">
              Enhance your current business number with SMS tracking and voicemail transcription.
            </p>
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          {integrationType === 'new' ? 'New Number Setup' : 'Existing Number Integration'} - 3 Simple Steps
        </h2>
        
        <div className="space-y-6">
          {currentSteps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-keppel-500 text-white">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-3">{step.description}</p>
                <ul className="space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-keppel-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-keppel-50 rounded-lg">
          <h3 className="font-semibold text-keppel-700 mb-2">🎉 That's It!</h3>
          <p className="text-keppel-600 text-sm">
            {integrationType === 'new' 
              ? 'Your new communication channels will be ready in under 5 minutes!'
              : 'Your existing number will be enhanced with our platform features in minutes!'
            }
          </p>
        </div>
      </div>

      {/* How We Handle Twilio */}
      <div className="bg-gradient-to-r from-keppel-50 to-cyan-50 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">How We Handle All the Technical Complexity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">What We Do For You:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Create and manage your Twilio subclient account</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Configure WhatsApp Business API access</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Set up SMS and voicemail capabilities</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Configure webhooks for message routing</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Enable AI chatbot responses</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">What You Do:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Enter your business name</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Choose new number or existing number</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Start receiving messages in your inbox</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-keppel-500 mt-1">✓</span>
                <span>Respond to customers when needed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Why Choose Our Platform?</h2>
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

      {/* Pricing */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Transparent Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-semibold text-gray-700 mb-2">WhatsApp Messages</h3>
            <p className="text-2xl font-bold text-keppel-600 mb-1">$0.005</p>
            <p className="text-sm text-gray-500">per message</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold text-gray-700 mb-2">SMS Messages</h3>
            <p className="text-2xl font-bold text-keppel-600 mb-1">$0.0075</p>
            <p className="text-sm text-gray-500">per message</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="text-2xl mb-2">🎙️</div>
            <h3 className="font-semibold text-gray-700 mb-2">Voicemail</h3>
            <p className="text-2xl font-bold text-keppel-600 mb-1">$0.05</p>
            <p className="text-sm text-gray-500">per minute + transcription</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            * Pricing based on Twilio rates. We handle all Twilio setup and management - you just pay for usage.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href="/communication/setup"
          className="inline-block bg-keppel-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-keppel-600 transition-colors"
        >
          Start Your Integration Now
        </a>
        <p className="mt-4 text-gray-500">
          Ready to get started? Click above to begin the setup process.
        </p>
      </div>
    </div>
  )
}