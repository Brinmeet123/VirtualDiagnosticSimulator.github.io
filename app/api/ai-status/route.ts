import { NextResponse } from 'next/server'

export async function GET() {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim())
  const demoMode = process.env.DEMO_MODE === 'true'
  return NextResponse.json({
    ok: true,
    openAIConfigured: hasOpenAI,
    demoModeEnv: demoMode,
    aiWillUse: hasOpenAI
      ? 'OpenAI (ChatGPT API)'
      : demoMode
        ? 'Mock responses only'
        : 'No API key — set OPENAI_API_KEY or DEMO_MODE=true',
    hint: hasOpenAI
      ? 'Key from https://platform.openai.com/api-keys (sk-). Redeploy after changes.'
      : 'Set OPENAI_API_KEY (sk-...) on Vercel or in .env.local.',
  })
}
