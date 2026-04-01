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
      const mockAssessment = getMockAssessment()
      let totalScore = 0
      const scoreBreakdown: Record<string, number> = {}

      if (orderedTests && orderedTests.length > 0) {
        const { resolveTest, calculateTestScore } = await import('@/lib/testEngine')
        const testScore = orderedTests.reduce((sum: number, testId: string) => {
          try {
            const resolved = resolveTest(scenario, testId)
            return sum + calculateTestScore(resolved.yield)
          } catch {
            return sum
          }
        }, 0)
        scoreBreakdown.tests = testScore
        totalScore += testScore
      }

      if (differentialDetailed && differentialDetailed.length > 0) {
        const { resolveDx, calculateDxScore, calculateFinalDxScore, calculateEfficiencyPenalty, checkMissingMustNotMiss } =
          await import('@/lib/dxEngine')
        const dxScore = differentialDetailed.reduce((sum: number, item: { dxId: string }) => {
          try {
            const resolved = resolveDx(scenario, item.dxId)
            return sum + calculateDxScore(resolved.yield)
          } catch {
            return sum
          }
        }, 0)
        const finalScore = calculateFinalDxScore(finalDxId, scenario.finalDxId)
        const efficiencyPenalty = calculateEfficiencyPenalty(differentialDetailed.length)
        const missing = checkMissingMustNotMiss(
          differentialDetailed.map((d: { dxId: string }) => d.dxId),
          scenario.requiredMustNotMiss
        )
        const missingPenalty = missing.length * -3
        scoreBreakdown.diagnosis = dxScore + finalScore + efficiencyPenalty + missingPenalty
        totalScore += scoreBreakdown.diagnosis
      }

      const maxScore = 45
      const scorePercentage = Math.max(0, Math.min(100, Math.round((totalScore / maxScore) * 100)))

      return NextResponse.json({
        ...mockAssessment,
        totalScore,
        totalScorePercentage: scorePercentage,
        maxScore,
        scoreBreakdown,
        source: 'demo-mock',
      })
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
