import { NextResponse } from 'next/server'
import { callLLM, isCloudLLMConfigured } from '@/lib/llm'

export async function GET() {
  try {
    const response = await callLLM([
      { role: 'user', content: 'Say "AI is working!" in one short sentence.' },
    ])

    return NextResponse.json({
      success: true,
      message: 'AI is working!',
      testResponse: response,
      provider: 'OpenAI',
    })
  } catch (error: any) {
    const isConnection =
      error?.message?.includes('ECONNREFUSED') || error?.message?.includes('fetch failed')

    return NextResponse.json(
      {
        success: false,
        error: isConnection ? 'Cannot connect to AI' : error?.message || 'Unknown error',
        details: isConnection
          ? 'Set OPENAI_API_KEY (sk-...) in env, or DEMO_MODE=true for mocks.'
          : error?.message || 'Check your configuration',
      },
      { status: 500 }
    )
  }
}
