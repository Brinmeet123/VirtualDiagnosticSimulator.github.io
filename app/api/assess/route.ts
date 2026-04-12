import { NextRequest, NextResponse } from 'next/server'
import { scenarios } from '@/data/scenarios'
import { getMockAssessment } from '@/lib/mockResponses'
import { buildDeterministicAssessment } from '@/lib/debrief/generateDebrief'
import { maybePolishDeterministicAssessment } from '@/lib/debrief/polishDebrief'

const USE_DEMO_MOCKS = process.env.DEMO_MODE === 'true'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      scenarioId,
      stability,
      redFlagsFound,
      chiefComplaint,
      chat,
      hpi,
      background,
      problemRep,
      viewedExamSections,
      differentials,
      orderedTests,
      reasoningUpdates,
      finalDiagnosis,
      patientExplanation,
      plan,
      differentialDetailed,
      finalDxId,
      missingMustNotMiss,
      selectedDifferentialIds,
      finalDiagnosisId,
    } = body

    const scenario = scenarios.find((s) => s.id === scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    if (USE_DEMO_MOCKS) {
      const deterministic = buildDeterministicAssessment({
        scenarioId,
        chat,
        viewedExamSections,
        orderedTests,
        differentialDetailed,
        finalDxId,
        redFlagsFound,
      })
      const out = await maybePolishDeterministicAssessment(deterministic)
      return NextResponse.json({ ...out, source: 'demo-mock' })
    }

    void stability
    void chiefComplaint
    void hpi
    void background
    void problemRep
    void differentials
    void reasoningUpdates
    void finalDiagnosis
    void patientExplanation
    void plan
    void missingMustNotMiss
    void selectedDifferentialIds
    void finalDiagnosisId

    const deterministic = buildDeterministicAssessment({
      scenarioId,
      chat,
      viewedExamSections,
      orderedTests,
      differentialDetailed,
      finalDxId,
      redFlagsFound,
    })

    const out = await maybePolishDeterministicAssessment(deterministic)

    return NextResponse.json(out)
  } catch (error: any) {
    console.error('Error in assess:', error)

    const shouldUseDemo = USE_DEMO_MOCKS || process.env.FALLBACK_TO_DEMO === 'true'

    if (
      shouldUseDemo &&
      (error?.message?.includes('fetch failed') ||
        error?.message?.includes('Ollama') ||
        error?.message?.includes('ECONNREFUSED'))
    ) {
      return NextResponse.json({ ...getMockAssessment(), source: 'demo-mock' })
    }

    const errorMessage = error?.message || 'Failed to generate assessment'
    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.message || 'Unknown error',
        demoModeAvailable:
          'Set DEMO_MODE=true for mocks, or report this error if the deterministic debrief failed.',
      },
      { status: 500 }
    )
  }
}
