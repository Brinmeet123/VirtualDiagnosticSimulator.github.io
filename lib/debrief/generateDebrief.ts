import { scenarios, type Scenario } from '@/data/scenarios'
import { diagnosisCatalog } from '@/data/diagnosisCatalog'
import { getDebriefConfigForScenario } from '@/data/debriefConfigs'
import { resolveTest, calculateTestScore } from '@/lib/testEngine'
import {
  resolveDx,
  calculateDxScore,
  calculateFinalDxScore,
  calculateEfficiencyPenalty,
  checkMissingMustNotMiss,
} from '@/lib/dxEngine'
import type { DebriefInput, DeterministicAssessment, ScenarioDebriefConfig } from '@/types/debrief'
import type { DebriefOutput } from '@/types/debrief'
import {
  buildDebriefInput,
  missedKeyHistoryTopics,
  missedPersonaHistoryPoints,
} from './debriefRules'
import {
  buildSummary,
  buildStrengths,
  buildMissedOpportunities,
  buildDiagnosticReasoning,
  buildNextStepAdvice,
  ratingLabel,
  sectionRatingFromScore,
} from './debriefTemplates'

export type AssessRequestBody = {
  scenarioId: string
  chat?: Array<{ role: string; content: string }>
  viewedExamSections?: string[]
  orderedTests?: string[]
  differentialDetailed?: Array<{ dxId: string; rank: number; confidence: string; note?: string }>
  finalDxId?: string | null
  redFlagsFound?: string[]
}

function mergeConfig(scenario: Scenario): ScenarioDebriefConfig {
  if (scenario.debriefConfig) return scenario.debriefConfig
  const base = getDebriefConfigForScenario(scenario.id)
  if (base) return base
  return fallbackConfigFromScenario(scenario)
}

function fallbackConfigFromScenario(scenario: Scenario): ScenarioDebriefConfig {
  const criticalTests =
    scenario.testOverrides?.filter((t) => t.yield === 'high').map((t) => t.testId) || []
  return {
    keyHistoryQuestions: scenario.patientPersona.keyHistoryPoints.map((p) => p.slice(0, 80)),
    keyExamItems: scenario.physicalExam.map((s) => s.id),
    criticalTests: criticalTests.length ? criticalTests : ['cbc'],
    unnecessaryTests: [],
    mustRecognizeFindings: scenario.patientPersona.keyHistoryPoints.slice(0, 3),
    commonMisses: scenario.teachingPoints.slice(0, 2),
    correctDiagnosisExplanation: scenario.teachingPoints.slice(0, 2),
    differentialComparison: [],
    clinicalPearls: scenario.teachingPoints,
    vocabTerms: [],
  }
}

export function generateDebriefOutput(params: {
  scenario: Scenario
  config: ScenarioDebriefConfig
  input: DebriefInput
  missedPersonaHistory: string[]
  finalMatchesCorrect: boolean
  scorePercent: number
}): DebriefOutput {
  const { scenario, config, input, missedPersonaHistory, finalMatchesCorrect, scorePercent } = params

  const askedRatio =
    config.keyHistoryQuestions.length > 0
      ? input.askedHistoryQuestions.length / config.keyHistoryQuestions.length
      : 0

  const summary = buildSummary({
    scenarioTitle: scenario.title,
    correctDx: input.correctDiagnosis,
    finalDxId: input.finalDxId,
    correctDxId: scenario.finalDxId,
    percent: scorePercent,
    askedRatio,
  })

  const strengths = buildStrengths(input, config, finalMatchesCorrect)
  const missedOpportunities = buildMissedOpportunities(
    input,
    config,
    missedPersonaHistory
  )
  const diagnosticReasoning = buildDiagnosticReasoning(input, config, finalMatchesCorrect)
  const nextStepAdvice = buildNextStepAdvice(input, missedPersonaHistory)
  const clinicalPearls = config.clinicalPearls.slice(0, 6)
  const vocabToReview = config.vocabTerms.filter(Boolean)

  return {
    summary,
    strengths,
    missedOpportunities,
    diagnosticReasoning,
    nextStepAdvice,
    clinicalPearls,
    vocabToReview,
  }
}

function computeRouteTotals(
  scenario: Scenario,
  orderedTests: string[] | undefined,
  differentialDetailed: Array<{ dxId: string }> | undefined,
  finalDxId: string | null | undefined
): { totalScore: number; maxScore: number; scorePercentage: number; rawBreakdown: Record<string, number> } {
  let totalScore = 0
  const rawBreakdown: Record<string, number> = {}

  if (orderedTests && orderedTests.length > 0) {
    const testScore = orderedTests.reduce((sum: number, testId: string) => {
      try {
        const resolved = resolveTest(scenario, testId)
        return sum + calculateTestScore(resolved.yield)
      } catch {
        return sum
      }
    }, 0)
    rawBreakdown.tests = testScore
    totalScore += testScore
  }

  if (differentialDetailed && differentialDetailed.length > 0) {
    const dxScore = differentialDetailed.reduce((sum: number, item) => {
      try {
        const resolved = resolveDx(scenario, item.dxId)
        return sum + calculateDxScore(resolved.yield)
      } catch {
        return sum
      }
    }, 0)
    const finalScore = calculateFinalDxScore(finalDxId ?? null, scenario.finalDxId)
    const efficiencyPenalty = calculateEfficiencyPenalty(differentialDetailed.length)
    const missing = checkMissingMustNotMiss(
      differentialDetailed.map((d) => d.dxId),
      scenario.requiredMustNotMiss
    )
    const missingPenalty = missing.length * -3
    rawBreakdown.diagnosis = dxScore + finalScore + efficiencyPenalty + missingPenalty
    totalScore += rawBreakdown.diagnosis
  }

  let maxScore = 0
  if (scenario.testOverrides) {
    const highYieldTests = scenario.testOverrides.filter((t) => t.yield === 'high')
    maxScore += highYieldTests.length * 2
  }
  if (scenario.dxOverrides) {
    const correctDiagnoses = scenario.dxOverrides.filter((d) => d.yield === 'correct')
    const optimalDxCount = Math.min(correctDiagnoses.length, 6)
    maxScore += optimalDxCount * 3
    maxScore += 5
  }
  if (maxScore === 0) maxScore = 45

  const scorePercentage = Math.max(0, Math.min(100, Math.round((totalScore / maxScore) * 100)))

  return { totalScore, maxScore, scorePercentage, rawBreakdown }
}

/** Build full deterministic assessment for API + SummaryPanel. */
export function buildDeterministicAssessment(body: AssessRequestBody): DeterministicAssessment {
  const scenario = scenarios.find((s) => s.id === body.scenarioId)
  if (!scenario) {
    throw new Error(`Scenario ${body.scenarioId} not found`)
  }

  const config = mergeConfig(scenario)

  const input = buildDebriefInput({
    scenario,
    config,
    chat: body.chat,
    viewedExamSections: body.viewedExamSections,
    orderedTests: body.orderedTests,
    finalDxId: body.finalDxId,
    differentialDetailed: body.differentialDetailed,
    redFlagsFound: body.redFlagsFound,
  })

  const missedTopicLabels = missedKeyHistoryTopics(
    input.doctorChatBlob,
    config.keyHistoryQuestions
  )
  const missedPersonaHistory = missedPersonaHistoryPoints(
    input.doctorChatBlob,
    scenario.patientPersona.keyHistoryPoints
  )

  const finalMatchesCorrect = Boolean(
    body.finalDxId && scenario.finalDxId && body.finalDxId === scenario.finalDxId
  )

  const { totalScore, maxScore, scorePercentage, rawBreakdown } = computeRouteTotals(
    scenario,
    body.orderedTests,
    body.differentialDetailed,
    body.finalDxId
  )

  const debriefStructured = generateDebriefOutput({
    scenario,
    config,
    input,
    missedPersonaHistory,
    finalMatchesCorrect,
    scorePercent: scorePercentage,
  })

  const diagnosisFeedback = [
    finalMatchesCorrect
      ? 'Your final diagnosis matched the teaching diagnosis for this case. See the diagnostic reasoning section for how the findings fit.'
      : `Teaching diagnosis: ${input.correctDiagnosis}. Review the diagnostic reasoning section for how the case data support that conclusion.`,
    debriefStructured.missedOpportunities.length
      ? `Priority improvements: ${debriefStructured.missedOpportunities.slice(0, 2).join(' ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const testSelectionFeedback = [
    input.unnecessaryTests.length
      ? `Low-yield tests ordered: ${input.unnecessaryTests.join(', ')}.`
      : '',
    config.criticalTests.some((t) => body.orderedTests?.includes(t))
      ? 'You included at least one critical confirmatory test.'
      : `Consider ordering: ${config.criticalTests.join(', ')}.`,
  ]
    .filter(Boolean)
    .join(' ')

  const overallRating = ratingLabel(scorePercentage)
  const sb = input.scoreBreakdown

  const assessment: DeterministicAssessment = {
    overallRating,
    summary: debriefStructured.summary,
    strengths: debriefStructured.strengths,
    areasForImprovement: debriefStructured.missedOpportunities,
    diagnosisFeedback,
    missedKeyHistoryPoints: [...new Set([...missedPersonaHistory, ...missedTopicLabels])].slice(0, 12),
    testSelectionFeedback,
    sectionRatings: {
      history: sectionRatingFromScore(sb.history),
      exam: sectionRatingFromScore(sb.exam),
      tests: sectionRatingFromScore(sb.testing),
      diagnosis: sectionRatingFromScore(sb.diagnosis),
      communication: sectionRatingFromScore(sb.reasoning),
    },
    totalScore,
    totalScorePercentage: scorePercentage,
    maxScore,
    scoreBreakdown: {
      history: sb.history,
      exam: sb.exam,
      tests: rawBreakdown.tests ?? sb.testing,
      diagnosis: rawBreakdown.diagnosis ?? sb.diagnosis,
      communication: sb.reasoning,
    },
    debriefStructured,
    source: 'deterministic',
  }

  return assessment
}

export function getCorrectDiagnosisName(scenario: Scenario): string {
  if (scenario.finalDxId) {
    const dx = diagnosisCatalog.find((d) => d.id === scenario.finalDxId)
    return dx?.name || scenario.finalDxId
  }
  const leg = scenario.diagnosisOptions?.find((d) => d.isCorrect)
  return leg?.name || 'Unknown'
}
