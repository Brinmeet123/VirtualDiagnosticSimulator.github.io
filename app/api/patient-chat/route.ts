import { NextRequest, NextResponse } from 'next/server'
import { scenarios } from '@/data/scenarios'
import { getMockPatientResponse } from '@/lib/mockResponses'
import { callLLM, hasConfiguredCloudLLM } from '@/lib/llm'

const USE_DEMO_MOCKS =
  process.env.DEMO_MODE === 'true' && !hasConfiguredCloudLLM()

export async function POST(request: NextRequest) {
  // Store body data outside try block for fallback use
  let bodyData: { scenarioId?: string; messages?: Array<{ role: string; content: string }> } = {}
  
  try {
    const body = await request.json()
    const { scenarioId, messages } = body
    bodyData = { scenarioId, messages }
    
    if (!scenarioId || !messages) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'scenarioId and messages are required' },
        { status: 400 }
      )
    }

    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    if (USE_DEMO_MOCKS) {
      const mockResponse = getMockPatientResponse(scenarioId, messages)
      return NextResponse.json({ message: mockResponse })
    }

    const { patientPersona, aiInstructions } = scenario

    // Create system prompt
    const systemPrompt = `You are a fictional patient in a medical training simulator.
Your name is ${patientPersona.name}, age ${patientPersona.age}, gender ${patientPersona.gender}.
Chief complaint: ${patientPersona.chiefComplaint}.
Background: ${patientPersona.background}.
Vital signs: HR ${patientPersona.vitals.heartRate} bpm, BP ${patientPersona.vitals.bloodPressure}, RR ${patientPersona.vitals.respiratoryRate}/min, O2 Sat ${patientPersona.vitals.oxygenSat}, Temp ${patientPersona.vitals.temperature}.

${aiInstructions.patientStyle}

CRITICAL RULES:
${aiInstructions.behaviorRules.map(rule => `- ${rule}`).join('\n')}

DO NOT reveal directly:
${aiInstructions.doNotRevealDirectly.map(item => `- ${item}`).join('\n')}

Key history points you know (reveal only if asked specifically):
${patientPersona.keyHistoryPoints.map(point => `- ${point}`).join('\n')}

Answer ONLY as the patient in first person. Keep responses short and conversational, like a real patient would speak. Do NOT give medical advice or diagnoses.`

    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'doctor' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ]

    const patientResponse = await callLLM(llmMessages)
    return NextResponse.json({ message: patientResponse })
  } catch (error: any) {
    console.error('Error in patient-chat:', error)
    
    const shouldUseDemo =
      USE_DEMO_MOCKS || process.env.FALLBACK_TO_DEMO === 'true'

    if (shouldUseDemo && (error?.message?.includes('fetch failed') || error?.message?.includes('OpenAI'))) {
      console.log('OpenAI unavailable, falling back to demo mode')
      const mockResponse = getMockPatientResponse(
        bodyData.scenarioId || '',
        bodyData.messages || []
      )
      return NextResponse.json({ message: mockResponse })
    }

    const errorMessage = error?.message || 'Failed to get patient response'
    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.message || 'Unknown error',
        type: error?.name || 'Error',
        demoModeAvailable: 'Set DEMO_MODE=true for mock responses, or add OPENAI_API_KEY (sk-...).',
      },
      { status: 500 }
    )
  }
}
