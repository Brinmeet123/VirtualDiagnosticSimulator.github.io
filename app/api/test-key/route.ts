import { NextResponse } from 'next/server'
import { callLLM, getOllamaConfig } from '@/lib/llm'

export async function GET() {
  try {
    const response = await callLLM([
      { role: 'user', content: 'Say "AI is working!" in one short sentence.' },
    ])

    const { model } = getOllamaConfig()

    return NextResponse.json({
      success: true,
      message: 'AI is working!',
      testResponse: response,
      provider: 'Ollama',
      model,
    })
  } catch (error: any) {
    const isConnection =
      error?.message?.includes('ECONNREFUSED') ||
      error?.message?.includes('fetch failed') ||
      error?.message?.includes('Ollama error')

    const { baseUrl } = getOllamaConfig()

    return NextResponse.json(
      {
        success: false,
        error: isConnection ? 'Cannot reach Ollama' : error?.message || 'Unknown error',
        details: isConnection
          ? `Check Ollama is running (ollama serve), OLLAMA_BASE_URL (${baseUrl}), and that the model exists (ollama pull). Or set DEMO_MODE=true for mocks.`
          : error?.message || 'Check your configuration',
      },
      { status: 500 }
    )
  }
}
