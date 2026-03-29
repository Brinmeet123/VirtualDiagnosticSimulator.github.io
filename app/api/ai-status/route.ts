import { NextResponse } from 'next/server'
import { getOllamaConfig, shouldUseOllamaLLM } from '@/lib/llm'

export async function GET() {
  const demoMode = process.env.DEMO_MODE === 'true'
  const { baseUrl, model, apiKeyConfigured } = getOllamaConfig()
  const useOllama = shouldUseOllamaLLM()

  const aiWillUse = demoMode
    ? 'Mock responses only (DEMO_MODE=true)'
    : `Ollama (${model} @ ${baseUrl})`

  const hint = demoMode
    ? 'Unset DEMO_MODE or set to false to use Ollama for real AI (requires ollama serve and a pulled model).'
    : 'Requires `ollama serve` and `ollama pull ' +
        model +
        '`. On Vercel, set OLLAMA_BASE_URL to a reachable host. If your host requires auth, set OLLAMA_API_KEY (Bearer). Or set DEMO_MODE=true for mocks only.'

  return NextResponse.json({
    ok: true,
    provider: 'ollama',
    model,
    ollamaBaseUrl: baseUrl,
    ollamaApiKeyConfigured: apiKeyConfigured,
    demoModeEnv: demoMode,
    ollamaEnabled: useOllama,
    aiWillUse,
    hint,
    openAIConfigured: false,
  })
}
