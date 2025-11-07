'use client'

export default function ExistingNumberGuidePage() {
  const steps = [
    {
      title: "Connect Your Existing Number",
      description: "Use your current business number - no disruption to customers",
      image: "📞",
      details: [
        "Click 'Connect Communication Channels' in your dashboard",
        "Select 'Use Existing Number' option",
        "Enter your current business phone number",
        "Choose SMS + Voicemail or full WhatsApp suite",
        "We verify your number and create a secure subclient"
      ]
    },
    {
      title: "Update Your Voicemail",
      description: "Set up professional voicemail with our platform",
      image: "🎙️",
      details: [
        "We provide a professional voicemail greeting script",
        "Update your phone's voicemail message with our text",
        "Voicemails will be automatically transcribed",
        "AI analyzes voicemails for lead qualification",
        "You'll receive SMS notifications for important voicemails"
      ]
    },
    {
      title: "Start Tracking Messages",
      description: "Never miss a message or voicemail again",
      image: "📊",
      details: [
        "All SMS messages appear in your unified inbox",
        "Voicemails are transcribed and stored automatically",
        "AI responds to common inquiries via SMS",
        "Lead qualification happens in the background",
        "Complete conversation history maintained"
      ]
    }
  ]

  const benefits = [
    {
      icon: "📞",
      title: "Keep Your Number",
      description: "No need to change business cards or notify customers - use your existing number."
    },
    {
      icon: "🎙️",
      title: "Voicemail Transcription",
      description: "Never miss a voicemail again - all messages are transcribed and stored."
    },
    {
      icon: "📱",
      title: "SMS Tracking",
      description: "Complete history of all text messages with AI-powered responses."
    },
    {
      icon: "🤖",
      title: "AI Responses",
      description: "Smart chatbot handles common inquiries automatically via SMS."
    },
    {
      icon: "📈",
      title: "Lead Qualification",
      description: "Every interaction is analyzed and scored for lead potential."
    },
    {
      icon: "🔒",
      title: "Secure & Private",
      description: "Your own Twilio subclient ensures complete data isolation."
    }
  ]

  const voicemailGreeting = `Thank you for calling [Your Business Name]. 
Please leave your name, phone number, and a brief message, 
and we'll get back to you as soon as possible.`

  const sampleVoicemail = {
    transcription: "Hi, this is Sarah Johnson. I saw your ad about the new listings and I'm interested in a 3-bedroom house under $400k. My number is 555-123-4567. Please call me back when you get a chance. Thanks!",
    analysis: "Qualified Lead - Budget: $400k, Property: 3-bedroom house, Contact: 555-123-4567, Timeline: Immediate interest",
    aiResponse: "Thank you for your voicemail, Sarah! I'll send you details of our 3-bedroom listings under $400k within the hour. I'll also have our agent contact you to schedule viewings."
  }

  const useCases = [
    {
      title: "Real Estate Agents",
      description: "Track all client communications from your cell phone",
      icon: "🏠"
    },
    {
      title: "Small Business Owners",
      description: "Never miss a customer inquiry or voicemail",
      icon: "💼"
    },
    {
      title: "Service Providers",
      description: "Organize all customer messages and appointments",
      icon: "🔧"
    },
    {
      title: "Consultants",
      description: "Capture and qualify leads from all communication channels",
      icon: "💡"
    }
  ]

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Existing Number Integration Guide</h1>
        <p className="text-gray-500">Enhance your current business number with SMS tracking and voicemail transcription - no disruption to customers!</p>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-8">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">📞</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Perfect for Your Current Setup</h2>
            <p className="text-gray-600 mb-4">
              If you already have a business number that customers use, this is the ideal solution for you!
            </p>
            <a
              href="/communication/setup"
              className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Connect Your Number Now
            </a>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">How It Works - 3 Simple Steps</h2>
        
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-blue-500 text-white">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-3">{step.description}</p>
                <ul className="space-y-1">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voicemail Example */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Voicemail Transcription Example</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Your New Voicemail Greeting:</h3>
            <div className="bg-white border border-gray-200 rounded p-3 text-sm italic">
              "{voicemailGreeting}"
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Sample Voicemail Received:</h3>
            <div className="bg-white border border-gray-200 rounded p-3 text-sm">
              <div className="font-medium text-gray-700 mb-2">Transcription:</div>
              <div className="mb-3">{sampleVoicemail.transcription}</div>
              
              <div className="font-medium text-gray-700 mb-2">AI Analysis:</div>
              <div className="mb-3 text-green-600">{sampleVoicemail.analysis}</div>
              
              <div className="font-medium text-gray-700 mb-2">AI Response (via SMS):</div>
              <div className="text-blue-600">{sampleVoicemail.aiResponse}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Perfect For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((useCase, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="text-3xl">{useCase.icon}</div>
              <div>
                <h3 className="font-semibold text-gray-700">{useCase.title}</h3>
                <p className="text-sm text-gray-600">{useCase.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Why Choose Existing Number Integration?</h2>
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

      {/* FAQ */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: Will my customers notice any difference?</h3>
            <p className="text-sm text-gray-600">A: No! Your customers will continue to call and text your existing number exactly as before. The only difference is that you'll now have better tracking and AI assistance.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: What if my voicemail box gets full?</h3>
            <p className="text-sm text-gray-600">A: Our system transcribes voicemails immediately, so you'll never miss a message. The transcription is stored in your dashboard even if your voicemail box fills up.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: Can I still use my phone normally?</h3>
            <p className="text-sm text-gray-600">A: Yes! You can still make and receive calls, send texts, and use your phone exactly as you do now. Our platform works in the background.</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Q: What if I want to disconnect later?</h3>
            <p className="text-sm text-gray-600">A: You can disconnect at any time from your dashboard. Your phone will return to normal operation, and you'll keep all your conversation history.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href="/communication/setup"
          className="inline-block bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          Connect Your Number Now
        </a>
        <p className="mt-4 text-gray-500">
          Ready to enhance your existing number? Click above to start the integration!
        </p>
      </div>
    </div>
  )
}
