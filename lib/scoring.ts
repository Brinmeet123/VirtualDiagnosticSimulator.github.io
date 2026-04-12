import type { Scenario } from '@/data/scenarios'

/** Aligned with post-scenario debrief: four categories out of 25 each (total 100). */
export type RubricBreakdown = {
  historyTaking: number
  clinicalReasoning: number
  diagnosticAccuracy: number
  efficiencyAndQuestionSelection: number
}

export type PerformanceEvaluation = {
  score: number
  feedback: string
  rubric: RubricBreakdown
  level: string
}

type Message = { role: string; content: string }

export type ScoringContext = {
  finalDxId?: string | null
  viewedExamSections?: string[]
  orderedTestIds?: string[]
  differentialIds?: string[]
}

const WEIGHTS = {
  diagnosis: 40,
  questioning: 25,
  reasoning: 25,
  efficiency: 10,
} as const

function mapToRubric100(parts: {
  diagnosisPts: number
  questioningPts: number
  reasoningPts: number
  efficiencyPts: number
}): RubricBreakdown {
  return {
    historyTaking: Math.round(parts.questioningPts),
    clinicalReasoning: Math.round(parts.reasoningPts),
    diagnosticAccuracy: Math.round(parts.diagnosisPts * (25 / WEIGHTS.diagnosis)),
    efficiencyAndQuestionSelection: Math.round(parts.efficiencyPts * (25 / WEIGHTS.efficiency)),
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function getCorrectDxId(scenario: Scenario): string | undefined {
  if (scenario.finalDxId) return scenario.finalDxId
  const correct = scenario.dxOverrides?.find((d) => d.yield === 'correct')
  return correct?.dxId
}

/** Map 0–100 scenario score to performance label */
export function scoreToLevel(score: number): string {
  if (score >= 90) return 'Expert'
  if (score >= 75) return 'Strong'
  if (score >= 50) return 'Developing'
  return 'Building foundation'
}

export function evaluatePerformance(
  messages: Message[],
  scenario: Scenario,
  context: ScoringContext = {}
): PerformanceEvaluation {
  const doctorMsgs = messages.filter((m) => m.role === 'doctor' || m.role === 'user')
  const doctorText = doctorMsgs.map((m) => m.content.toLowerCase()).join(' ')
  const wordCount = doctorText.split(/\s+/).filter(Boolean).length

  const correctDxId = getCorrectDxId(scenario)
  const finalId = context.finalDxId ?? null
  const diffIds = context.differentialIds ?? []

  let diagnosisPts = 0
  if (correctDxId && finalId === correctDxId) {
    diagnosisPts = WEIGHTS.diagnosis
  } else if (correctDxId && diffIds.includes(correctDxId)) {
    diagnosisPts = Math.round(WEIGHTS.diagnosis * 0.55)
  } else if (correctDxId) {
    diagnosisPts = Math.round(WEIGHTS.diagnosis * 0.2)
  } else {
    diagnosisPts = Math.round(WEIGHTS.diagnosis * 0.35)
  }

  const questionHints = [
    'onset',
    'duration',
    'quality',
    'radiat',
    'worse',
    'better',
    'associated',
    'history',
    'medication',
    'allerg',
    'family',
    'smok',
    'fever',
    'pain',
    'when',
    'where',
    'how long',
  ]
  const hitCount = questionHints.filter((h) => doctorText.includes(h)).length
  const breadth = clamp(hitCount / 8, 0, 1)
  const depth = clamp(wordCount / 120, 0, 1)
  const questioningPts = Math.round(WEIGHTS.questioning * (0.35 + 0.45 * breadth + 0.2 * depth))

  const mustNotMiss = scenario.requiredMustNotMiss ?? []
  const mustHits = mustNotMiss.filter((id) => diffIds.includes(id)).length
  const mustRatio = mustNotMiss.length ? mustHits / mustNotMiss.length : 1
  const diffDepth = clamp(diffIds.length / 4, 0, 1)
  const reasoningPts = Math.round(
    WEIGHTS.reasoning * (0.4 * mustRatio + 0.35 * diffDepth + 0.25 * (finalId ? 1 : 0.4))
  )

  const highYield = new Set(
    (scenario.testOverrides ?? []).filter((t) => t.yield === 'high' || t.yield === 'helpful').map((t) => t.testId)
  )
  const ordered = context.orderedTestIds ?? []
  const examSeen = (context.viewedExamSections ?? []).length
  let efficiencyRatio = 0.5
  if (ordered.length > 0 && highYield.size > 0) {
    const good = ordered.filter((id) => highYield.has(id)).length
    efficiencyRatio = 0.5 * (good / ordered.length) + 0.3 * clamp(1 - (ordered.length - good) / 6, 0, 1)
  } else if (ordered.length > 0) {
    efficiencyRatio = 0.55 + 0.15 * clamp(1 - ordered.length / 8, 0, 1)
  }
  efficiencyRatio = efficiencyRatio * 0.7 + 0.3 * clamp(examSeen / 3, 0, 1)
  const efficiencyPts = Math.round(WEIGHTS.efficiency * efficiencyRatio)

  const rubric = mapToRubric100({
    diagnosisPts,
    questioningPts,
    reasoningPts,
    efficiencyPts,
  })

  const score = Math.min(
    100,
    rubric.historyTaking +
      rubric.clinicalReasoning +
      rubric.diagnosticAccuracy +
      rubric.efficiencyAndQuestionSelection
  )
  const level = scoreToLevel(score)

  const feedbackParts: string[] = []
  if (finalId === correctDxId) {
    feedbackParts.push('You identified the correct working diagnosis.')
  } else if (correctDxId && diffIds.includes(correctDxId)) {
    feedbackParts.push('You considered the correct diagnosis in your differential; narrowing to the final diagnosis could be stronger.')
  } else {
    feedbackParts.push('Review the key features of this presentation and compare them with your leading differentials.')
  }
  if (doctorMsgs.length < 4) {
    feedbackParts.push('Try asking more targeted follow-up questions in the history.')
  } else if (hitCount >= 6) {
    feedbackParts.push('Your history-taking covered several important domains.')
  }
  if (mustNotMiss.length && mustRatio < 1) {
    feedbackParts.push('Ensure must-not-miss diagnoses appear on your differential when red flags are present.')
  }
  if (ordered.length > 6) {
    feedbackParts.push('Consider prioritizing high-yield tests to improve efficiency.')
  }

  return {
    score,
    feedback: feedbackParts.join(' '),
    rubric,
    level,
  }
}
