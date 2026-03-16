'use client'

import { useState, useRef, useEffect } from 'react'
import { Scenario } from '@/data/scenarios'
import { getMockPatientResponse } from '@/lib/mockResponses'
import VocabText from './VocabText'

type Message = {
  role: 'doctor' | 'patient'
  content: string
}

type ViewMode = 'simple' | 'clinical'

type Props = {
  scenario: Scenario
  messages?: Message[]
  onChatUpdate: (messages: Message[]) => void
  viewMode?: ViewMode
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
}

export default function ChatPanel({ scenario, messages: initialMessages, onChatUpdate, viewMode = 'simple', onTermClick, onTermSave }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages || [
      {
        role: 'patient',
        content: `Hello, doctor. ${scenario.patientPersona.chiefComplaint}.`
      }
    ]
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for question insertion from QuestionBank
  useEffect(() => {
    const handleQuestionInsert = (e: CustomEvent) => {
      if (inputRef.current) {
        setInput(e.detail.question)
        inputRef.current.focus()
      }
    }

    window.addEventListener('insert-question' as any, handleQuestionInsert as EventListener)
    return () => {
      window.removeEventListener('insert-question' as any, handleQuestionInsert as EventListener)
    }
  }, [])

  // Sync with parent when messages change
  useEffect(() => {
    onChatUpdate(messages)
  }, [messages, onChatUpdate])

  // Update local state when parent provides new messages
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    }
  }, [initialMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const doctorMessage: Message = { role: 'doctor', content: input.trim() }
    const newMessages = [...messages, doctorMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/patient-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          messages: newMessages,
        }),
      })

      // Static hosting (e.g. GitHub Pages): no API — use client-side mock
      if (!response.ok) {
        const mockMessage = getMockPatientResponse(scenario.id, newMessages)
        setMessages([...newMessages, { role: 'patient', content: mockMessage }])
        return
      }

      const data = await response.json()

      if (data.error) {
        // Show user-friendly error with demo mode suggestion
        let errorMsg = data.error
        if (data.details && data.details.includes('Ollama')) {
          errorMsg += '\n\n💡 Tip: Set DEMO_MODE=true to use mock responses without Ollama.'
        }
        throw new Error(errorMsg)
      }

      if (!data.message) {
        throw new Error('No message received from API')
      }

      const patientMessage: Message = { role: 'patient', content: data.message }
      setMessages([...newMessages, patientMessage])
    } catch (error: any) {
      // Network or other error: fallback to mock on static sites (e.g. GitHub Pages)
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Load failed')) {
        const mockMessage = getMockPatientResponse(scenario.id, newMessages)
        setMessages([...newMessages, { role: 'patient', content: mockMessage }])
        return
      }
      console.error('Error in ChatPanel:', error)
      
      // Show more helpful error messages
      let errorContent = "I'm sorry, I'm having trouble responding right now. Could you try again?"
      
      if (error?.message) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('api key') || errorMsg.includes('openai')) {
          errorContent = "⚠️ Error: OpenAI API key is not configured or invalid. Please check your .env.local file and restart the server. Test your key at /api/test-key"
        } else if (errorMsg.includes('rate limit')) {
          errorContent = "⚠️ Error: API rate limit exceeded. Please try again later."
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorContent = "⚠️ Error: Network error. Please check your connection and that the server is running."
        } else if (errorMsg.includes('ollama') || errorMsg.includes('econnrefused')) {
          errorContent = "⚠️ Error: Cannot connect to Ollama. Make sure Ollama is running (ollama serve) or set DEMO_MODE=true to use mock responses."
        } else {
          errorContent = `⚠️ Error: ${error.message}`
        }
      }
      
      const errorMessage: Message = {
        role: 'patient',
        content: errorContent
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">History & Interview</h2>
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'doctor' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'doctor'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {msg.role === 'doctor' ? 'You' : scenario.patientPersona.name}
              </p>
              <div className="text-sm whitespace-pre-wrap">
                {msg.role === 'patient' ? (
                  <VocabText 
                    text={msg.content} 
                    viewMode={viewMode}
                    onTermClick={onTermClick}
                    onTermSave={onTermSave}
                  />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-500">Patient is typing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the patient a question..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </form>
    </div>
  )
}

