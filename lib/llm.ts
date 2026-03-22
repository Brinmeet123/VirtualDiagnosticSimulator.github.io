/**
 * LLM: OpenAI only. Set OPENAI_API_KEY for real AI; otherwise use DEMO_MODE mocks.
 */

export type LLMMessage = { role: string; content: string }

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim()
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

function toOpenAIRole(role: string): 'system' | 'user' | 'assistant' {
  if (role === 'system' || role === 'user' || role === 'assistant') return role as 'system' | 'user' | 'assistant'
  return role === 'doctor' ? 'user' : 'assistant'
}

export function hasConfiguredCloudLLM(): boolean {
  return Boolean(OPENAI_API_KEY)
}

export async function callLLM(messages: LLMMessage[]): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is not set. Add your OpenAI API key (sk-...) in Vercel env vars or .env.local, or set DEMO_MODE=true for mock responses.'
    )
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: messages.map((m) => ({ role: toOpenAIRole(m.role), content: m.content })),
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (content == null) throw new Error('OpenAI returned no content')
  return content
}

export function isCloudLLMConfigured(): boolean {
  return Boolean(OPENAI_API_KEY)
}
