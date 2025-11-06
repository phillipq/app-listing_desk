'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Question {
  id: string
  question: string
  type: 'radio' | 'checkbox'
  options: { value: string; label: string }[]
}

interface QuestionnaireData {
  questionnaire: {
    id: string
    realtorName: string
    realtorDomain: string
    status: string
    initialInterests: unknown
    questions: Question[]
  }
}

export default function QuestionnairePage() {
  const params = useParams()
  const token = params.token as string
  
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    fetchQuestionnaire()
  }, [token])

  const fetchQuestionnaire = async () => {
    try {
      const response = await fetch(`/api/questionnaire/${token}`)
      const data = await response.json() as { 
        completed?: boolean
        error?: string
        questionnaire?: QuestionnaireData['questionnaire']
      }
      
      if (!response.ok) {
        if (data.completed) {
          setCompleted(true)
        } else {
          setError(data.error || 'Failed to load questionnaire')
        }
        return
      }
      
      if (data.questionnaire) {
        setQuestionnaire({ questionnaire: data.questionnaire })
      }
    } catch {
      setError('Failed to load questionnaire')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestion < (questionnaire?.questionnaire.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    
    try {
      const response = await fetch(`/api/questionnaire/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses })
      })
      
      const data = await response.json() as { error?: string }
      
      if (!response.ok) {
        setError(data.error || 'Failed to submit questionnaire')
        return
      }
      
      setCompleted(true)
    } catch {
      setError('Failed to submit questionnaire')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Error</h1>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Thank You!</h1>
          <p className="text-gray-700 mb-4">
            Your questionnaire has been completed successfully. 
            {questionnaire?.questionnaire.realtorName} will be in touch with personalized property recommendations.
          </p>
          <p className="text-sm text-gray-500">
            You can close this window now.
          </p>
        </div>
      </div>
    )
  }

  if (!questionnaire) return null

  const questions = questionnaire.questionnaire.questions
  const currentQ = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (!currentQ) return null

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-700 mb-2">
              Help {questionnaire.questionnaire.realtorName} find your perfect neighborhood!
            </h1>
            <p className="text-gray-700">
              This quick questionnaire will help us personalize property recommendations based on your lifestyle needs.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {currentQ.question}
            </h2>
            
            <div className="space-y-3">
              {currentQ.options.map((option, index) => (
                <label key={index} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type={currentQ.type}
                    name={currentQ.id}
                    value={option.value}
                    checked={
                      currentQ.type === 'radio' 
                        ? responses[currentQ.id] === option.value
                        : responses[currentQ.id]?.includes(option.value)
                    }
                    onChange={(e) => {
                      if (currentQ.type === 'radio') {
                        handleAnswer(currentQ.id, option.value)
                      } else {
                        const currentValues = Array.isArray(responses[currentQ.id]) 
                          ? responses[currentQ.id] as string[]
                          : []
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v: string) => v !== option.value)
                        handleAnswer(currentQ.id, newValues)
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <button
              onClick={handleNext}
              disabled={!responses[currentQ.id]}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === questions.length - 1 ? 'Submit' : 'Next'}
            </button>
          </div>

          {submitting && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-keppel-500 mx-auto mb-2"></div>
              <p className="text-gray-700">Submitting your responses...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
