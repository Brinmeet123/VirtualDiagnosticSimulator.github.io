/**
 * LLM: Ollama only (OpenAI-compatible POST /v1/chat/completions).
 *
 * Env:
 * - OLLAMA_BASE_URL — default http://127.0.0.1:11434
 * - OLLAMA_MODEL — default llama3.2 (run `ollama pull <name>` first)
 * - OLLAMA_API_KEY or OLLAMA_KEY — optional Bearer token for hosted Ollama (local Ollama usually needs neither)
 * - DEMO_MODE=true — use mock responses in API routes (no Ollama calls)
 */

export type LLMMessage = { role: string; content: string }

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(
  /\/$/,
  ''
)
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const OLLAMA_API_KEY =
  process.env.OLLAMA_API_KEY?.trim() || process.env.OLLAMA_KEY?.trim()

function toChatRole(role: string): 'system' | 'user' | 'assistant' {
  if (role === 'system' || role === 'user' || role === 'assistant') return role
  return role === 'doctor' ? 'user' : 'assistant'
}

export function getOllamaConfig(): {
  baseUrl: string
  model: string
  apiKeyConfigured: boolean
} {
  return {
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL,
    apiKeyConfigured: Boolean(OLLAMA_API_KEY),
  }
}

/** True when routes should call Ollama (DEMO_MODE forces mocks instead). */
export function shouldUseOllamaLLM(): boolean {
  return process.env.DEMO_MODE !== 'true'
}

/** @deprecated Use shouldUseOllamaLLM */
export function hasConfiguredLLM(): boolean {
  return shouldUseOllamaLLM()
}

/** @deprecated Ollama-only app; same as shouldUseOllamaLLM */
export function hasConfiguredCloudLLM(): boolean {
  return shouldUseOllamaLLM()
}

/** @deprecated Ollama-only app */
export function isCloudLLMConfigured(): boolean {
  return shouldUseOllamaLLM()
}

export async function callLLM(messages: LLMMessage[]): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/v1/chat/completions`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (OLLAMA_API_KEY) {
    headers.Authorization = `Bearer ${OLLAMA_API_KEY}`
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: messages.map((m) => ({ role: toChatRole(m.role), content: m.content })),
      stream: false,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Ollama error (${res.status}) at ${OLLAMA_BASE_URL}: ${text.slice(0, 500)}`
    )
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (content == null) throw new Error('Ollama returned no content')
  return content
}
