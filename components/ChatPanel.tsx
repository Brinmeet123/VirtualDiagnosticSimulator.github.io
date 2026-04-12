'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Scenario } from '@/data/scenarios'
import { getMockPatientResponse } from '@/lib/mockResponses'
import VocabText from './VocabText'
import VocabContextBlock from './VocabContextBlock'

type Message = {
  role: 'doctor' | 'patient'
  content: string
}

type Props = {
  scenario: Scenario
  messages?: Message[]
  /** Count of doctor messages — used for early-interview encouragement only */
  doctorMessageCount?: number
  onChatUpdate: (messages: Message[]) => void
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
}

/** Only GitHub Pages / static demo: hide API failures behind keyword mocks. Vercel shows real errors. */
function shouldFallbackToPatientMocks(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NEXT_PUBLIC_STATIC_DEMO === 'true') return true
  return window.location.hostname.endsWith('.github.io')
}

function messagesShallowEqual(a: Message[], b: Message[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].role !== b[i].role || a[i].content !== b[i].content) return false
  }
  return true
}

export default function ChatPanel({
  scenario,
  messages: initialMessages,
  doctorMessageCount = 0,
  onChatUpdate,
  onTermClick,
  onTermSave,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(() => initialMessages ?? [])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [questionHint, setQuestionHint] = useState<string | null>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onChatUpdateRef = useRef(onChatUpdate)
  const isLoadingRef = useRef(false)
  onChatUpdateRef.current = onChatUpdate
  isLoadingRef.current = isLoading

  // Sync with parent when messages change (stable ref avoids re-running when parent omits useCallback).
  useEffect(() => {
    onChatUpdateRef.current(messages)
  }, [messages])

  // Apply parent-driven updates (e.g. resume) without resetting when the array reference changes but content is identical.
  useEffect(() => {
    if (!initialMessages || initialMessages.length === 0) return
    setMessages((prev) => (messagesShallowEqual(initialMessages, prev) ? prev : initialMessages))
  }, [initialMessages])

  useEffect(() => {
    const el = messagesScrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [messages, isLoading])

  // Light-touch feedback after each doctor message (wording only — no scoring change)
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'doctor') {
      setQuestionHint(null)
      return
    }
    const len = last.content.trim().length
    if (len > 0 && len < 10) {
      setQuestionHint('Try being more specific — add timing, location, or what makes it better or worse.')
    } else if (len >= 48) {
      setQuestionHint('Nice thinking 👏')
    } else {
      setQuestionHint(null)
    }
  }, [messages])

  const runPatientTurn = useCallback(
    async (newMessages: Message[]) => {
      isLoadingRef.current = true

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

        if (!response.ok) {
          if (shouldFallbackToPatientMocks()) {
            const mockMessage = getMockPatientResponse(scenario.id, newMessages)
            setMessages([...newMessages, { role: 'patient', content: mockMessage }])
            return
          }
          let detail = `${response.status} ${response.statusText}`
          let hint = 'Check **/api/ai-status** for env config.'
          try {
            const err = await response.json()
            const parts = [err.error, err.details].filter(
              (p: string | undefined) => p && String(p).trim().length > 0
            ) as string[]
            const deduped =
              parts.length === 2 && parts[0] === parts[1] ? [parts[0]] : parts
            if (deduped.length) detail = deduped.join(' — ')
            if (err.demoModeAvailable) hint = err.demoModeAvailable
          } catch {
            /* ignore */
          }
          if (/Ollama error|ECONNREFUSED|Cannot reach Ollama|fetch failed/i.test(detail)) {
            hint =
              'Run **ollama serve**, **ollama pull** your model, and set **OLLAMA_BASE_URL** / **OLLAMA_MODEL** if needed. Or **DEMO_MODE=true** for mocks. See **/api/ai-status**.'
          }
          setMessages([
            ...newMessages,
            {
              role: 'patient',
              content: `Chat service unavailable.\n\n${detail}\n\n${hint}`,
            },
          ])
          return
        }

        const data = await response.json()

        if (data.error) {
          let errorMsg = data.error
          if (data.demoModeAvailable) {
            errorMsg += `\n\n${data.demoModeAvailable}`
          }
          throw new Error(errorMsg)
        }

        if (!data.message) {
          throw new Error('No message received from API')
        }

        const patientMessage: Message = { role: 'patient', content: data.message }
        setMessages([...newMessages, patientMessage])
      } catch (error: any) {
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Load failed')) {
          if (shouldFallbackToPatientMocks()) {
            const mockMessage = getMockPatientResponse(scenario.id, newMessages)
            setMessages([...newMessages, { role: 'patient', content: mockMessage }])
            return
          }
          setMessages([
            ...newMessages,
            {
              role: 'patient',
              content:
                'Could not reach the server. If you are on Vercel, wait for the deploy to finish and try again.',
            },
          ])
          return
        }
        console.error('Error in ChatPanel:', error)

        let errorContent = "Can't respond right now. Try again."

        if (error?.message) {
          const errorMsg = error.message.toLowerCase()
          if (errorMsg.includes('ollama') || errorMsg.includes('econnrefused')) {
            errorContent =
              '**Ollama** not reachable. Run `ollama serve`, pull a model, set **OLLAMA_BASE_URL** in `.env.local`. See **/api/test-key**.'
          } else if (errorMsg.includes('rate limit')) {
            errorContent = 'Rate limited or overloaded. Retry shortly or use a smaller model.'
          } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
            errorContent =
              'Network error. Confirm Ollama is up and **OLLAMA_BASE_URL** is reachable.'
          } else if (errorMsg.includes('demo_mode') || errorMsg.includes('no llm')) {
            errorContent =
              'Set **DEMO_MODE=true** for mocks, or run Ollama.'
          } else {
            errorContent = `Error: ${error.message}`
          }
        }

        const errorMessage: Message = {
          role: 'patient',
          content: errorContent,
        }
        setMessages([...newMessages, errorMessage])
      } finally {
        isLoadingRef.current = false
        setIsLoading(false)
      }
    },
    [scenario.id]
  )

  const appendAndRespond = useCallback(
    (text: string) => {
      if (isLoadingRef.current) return
      const trimmed = text.trim()
      if (!trimmed) return
      const doctorMessage: Message = { role: 'doctor', content: trimmed }
      setMessages((prev) => {
        const newMessages = [...prev, doctorMessage]
        void runPatientTurn(newMessages)
        return newMessages
      })
    },
    [runPatientTurn]
  )

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ question?: string }>
      const q = ce.detail?.question?.trim()
      if (!q) return
      appendAndRespond(q)
    }
    window.addEventListener('send-preset-question', handler as EventListener)
    return () => window.removeEventListener('send-preset-question', handler as EventListener)
  }, [appendAndRespond])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setInput('')
    appendAndRespond(text)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full min-h-0 max-h-[min(85vh,720px)]">
      <h2 className="sr-only">Patient interview</h2>
      <VocabContextBlock
        source="chat"
        scenarioId={scenario.id}
        text={messages.map((m) => m.content).join('\n')}
        className="flex-1 min-h-0 flex flex-col"
      >
      <div
        ref={messagesScrollRef}
        className="flex-1 min-h-0 overflow-y-auto mb-4 space-y-4 pr-2 overscroll-contain"
      >
        {messages.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6 px-2">
            Start the interview — type an opening question below. The patient will reply after you send a message.
          </p>
        )}
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
              <p className="text-sm text-gray-500">Typing…</p>
            </div>
          </div>
        )}
      </div>
      </VocabContextBlock>

      {doctorMessageCount >= 1 && doctorMessageCount <= 3 && (
        <p className="mb-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200/90 rounded-lg px-3 py-2 leading-snug">
          Good start. Keep narrowing it down.
        </p>
      )}

      {questionHint && (
        <p className="mb-2 text-xs text-slate-600 transition-opacity duration-300">{questionHint}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What would you ask next?"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn-press px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Send
        </button>
      </form>
    </div>
  )
}

