'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface ApiKeyResponse {
  apiKey: string | null
  name: string | null
  domain: string | null
}

export default function ChatbotDeploymentWrapper() {
  const { data: session } = useSession()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchApiKey()
  }, [])

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/realtor/api-key')
      if (response.ok) {
        const data = await response.json() as ApiKeyResponse
        setApiKey(data.apiKey)
      }
    } catch (error) {
      console.error('Error fetching API key:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/realtor/api-key', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json() as ApiKeyResponse
        setApiKey(data.apiKey)
      }
    } catch (error) {
      console.error('Error generating API key:', error)
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chatbot Deployment Guide</h1>
        <p className="text-gray-600">
          Deploy your AI-powered chatbot widget on your website to capture leads 24/7
        </p>
      </div>

      {/* API Key Section */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Get Your API Key</h2>
        <p className="text-gray-600 mb-4">
          Your API key authenticates the chatbot widget and links conversations to your account.
        </p>
        
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-keppel-500"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKey ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your API Key
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={apiKey}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(apiKey)}
                    className="px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={generateApiKey}
                    disabled={generating}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Regenerate'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Keep this key secure. Do not share it publicly.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 mb-4">You don't have an API key yet. Generate one to get started.</p>
                <button
                  onClick={generateApiKey}
                  disabled={generating}
                  className="px-6 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate API Key'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embed Code Section */}
      {apiKey && (
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Add to Your Website</h2>
          <p className="text-gray-600 mb-4">
            Copy and paste this code into your website's HTML, just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
          </p>
          
          <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
            <pre className="text-green-400 text-sm">
{`<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/chatbot-widget.js';
    script.setAttribute('data-api-key', '${apiKey}');
    script.setAttribute('data-realtor-id', '${session?.user?.id || 'YOUR_REALTOR_ID'}');
    script.setAttribute('data-realtor-name', '${session?.user?.name || 'Your Name'}');
    script.setAttribute('data-primary-color', '#5AA197');
    script.setAttribute('data-position', 'bottom-right');
    document.body.appendChild(script);
  })();
</script>`}
            </pre>
          </div>
          
          <button
            onClick={() => {
              const code = `<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/chatbot-widget.js';
    script.setAttribute('data-api-key', '${apiKey}');
    script.setAttribute('data-realtor-id', '${session?.user?.id || 'YOUR_REALTOR_ID'}');
    script.setAttribute('data-realtor-name', '${session?.user?.name || 'Your Name'}');
    script.setAttribute('data-primary-color', '#5AA197');
    script.setAttribute('data-position', 'bottom-right');
    document.body.appendChild(script);
  })();
</script>`
              copyToClipboard(code)
            }}
            className="px-6 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 transition-colors"
          >
            Copy Embed Code
          </button>
        </div>
      )}

      {/* Configuration Options */}
      {apiKey && (
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuration Options</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Widget Position</h3>
              <p className="text-sm text-gray-600 mb-2">
                Control where the chatbot appears on your website:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li><code className="bg-gray-100 px-1 rounded">data-position="bottom-right"</code> - Bottom right corner (default)</li>
                <li><code className="bg-gray-100 px-1 rounded">data-position="bottom-left"</code> - Bottom left corner</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Primary Color</h3>
              <p className="text-sm text-gray-600 mb-2">
                Customize the chatbot's color scheme:
              </p>
              <p className="text-sm text-gray-600">
                Use <code className="bg-gray-100 px-1 rounded">data-primary-color="#5AA197"</code> with any hex color code
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Realtor Name</h3>
              <p className="text-sm text-gray-600 mb-2">
                Set the name displayed in the chatbot header:
              </p>
              <p className="text-sm text-gray-600">
                Use <code className="bg-gray-100 px-1 rounded">data-realtor-name="Your Name"</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-keppel-500 text-white rounded-full flex items-center justify-center font-semibold">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Visitor starts a chat</h3>
              <p className="text-sm text-gray-600">When someone clicks the chatbot button on your website, a new conversation session begins.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-keppel-500 text-white rounded-full flex items-center justify-center font-semibold">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900">AI qualifies the lead</h3>
              <p className="text-sm text-gray-600">The chatbot asks questions to understand their needs and gather contact information.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-keppel-500 text-white rounded-full flex items-center justify-center font-semibold">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Lead appears in your dashboard</h3>
              <p className="text-sm text-gray-600">Qualified leads automatically appear in your Leads section, ready for follow-up.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Troubleshooting</h2>
        <div className="space-y-3">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Chatbot not appearing?</h3>
            <p className="text-sm text-gray-600">
              Make sure the script is placed before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag and that your API key is correct.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Getting authentication errors?</h3>
            <p className="text-sm text-gray-600">
              Verify your API key is correct and hasn't been regenerated. If you regenerated your key, update the embed code on your website.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Need help?</h3>
            <p className="text-sm text-gray-600">
              Contact support at <a href="mailto:support@example.com" className="text-keppel-500 hover:underline">support@example.com</a> for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

