import type { DebriefInput, ScenarioDebriefConfig } from '@/types/debrief'

export function ratingLabel(pct: number): 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor' {
  if (pct >= 80) return 'Excellent'
  if (pct >= 60) return 'Good'
  if (pct >= 40) return 'Needs Improvement'
  return 'Poor'
}

export function sectionRatingFromScore(score: number): 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor' {
  if (score >= 4) return 'Excellent'
  if (score >= 3) return 'Good'
  if (score >= 2) return 'Needs Improvement'
  return 'Poor'
}

export function buildSummary(params: {
  scenarioTitle: string
  correctDx: string
  finalDxId: string | null | undefined
  correctDxId: string | undefined
  totalOutOf100: number
  askedRatio: number
}): string {
  const { scenarioTitle, correctDx, finalDxId, correctDxId, totalOutOf100, askedRatio } = params
  const correct = finalDxId && correctDxId && finalDxId === correctDxId
  const dxLine = correct
    ? `Expected diagnosis: ${correctDx}.`
    : `Teaching diagnosis: ${correctDx}.`
  return `${scenarioTitle}. Score ${totalOutOf100}/100 (${ratingLabel(totalOutOf100).toLowerCase()}). About ${Math.round(askedRatio * 100)}% of suggested history topics covered. ${dxLine}`
}

export function buildStrengths(
  input: DebriefInput,
  config: ScenarioDebriefConfig,
  finalMatchesCorrect: boolean
): string[] {
  const out: string[] = []
  const ratio = config.keyHistoryQuestions.length
    ? input.askedHistoryQuestions.length / config.keyHistoryQuestions.length
    : 0
  if (ratio >= 0.6) {
    out.push(
      `You covered many important history topics (${input.askedHistoryQuestions.length}/${config.keyHistoryQuestions.length}).`
    )
  }
  if (input.completedExamItems.length >= config.keyExamItems.length) {
    out.push('You reviewed the key physical exam sections for this scenario.')
  } else if (input.completedExamItems.length > 0) {
    out.push(
      `You examined relevant areas (${input.completedExamItems.join(', ') || 'selected sections'}).`
    )
  }
  const crit = config.criticalTests.filter((t) => input.orderedTests.includes(t))
  if (crit.length > 0) {
    out.push(`You ordered high-yield tests: ${crit.join(', ')}.`)
  }
  if (finalMatchesCorrect) {
    out.push('Your final diagnosis matched the teaching diagnosis for this case.')
  }
  if (input.redFlagsIdentified.length > 0) {
    out.push(`You documented safety concerns: ${input.redFlagsIdentified.join('; ')}.`)
  }
  if (out.length === 0) {
    out.push('You completed the encounter and submitted a differential and final diagnosis for review.')
  }
  return out.slice(0, 4)
}

export function buildMissedOpportunities(
  input: DebriefInput,
  config: ScenarioDebriefConfig,
  missedHistoryPoints: string[]
): string[] {
  const missed: string[] = []
  const ratio = config.keyHistoryQuestions.length
    ? input.askedHistoryQuestions.length / config.keyHistoryQuestions.length
    : 0
  if (ratio < 0.5) {
    missed.push(
      'Consider a more systematic history: several suggested topic areas were not clearly explored.'
    )
  }
  const missedExam = config.keyExamItems.filter(
    (id) => !input.completedExamItems.includes(id)
  )
  if (missedExam.length > 0) {
    missed.push(
      `Key exam sections not reviewed: ${missedExam.join(', ')}. These findings often change the differential.`
    )
  }
  const missedCritTests = config.criticalTests.filter((t) => !input.orderedTests.includes(t))
  if (missedCritTests.length > 0) {
    missed.push(
      `Critical tests not ordered: ${missedCritTests.join(', ')} — these are central to confirming or ruling out urgent diagnoses.`
    )
  }
  if (input.unnecessaryTests.length > 0) {
    missed.push(
      `Low-yield or low-priority tests ordered: ${input.unnecessaryTests.join(', ')}. Consider test burden and efficiency.`
    )
  }
  if (input.missingMustNotMissDxIds.length > 0) {
    missed.push(
      `Must-not-miss diagnoses absent from your differential: ${input.missingMustNotMissDxIds.join(', ')}.`
    )
  }
  if (input.missedCriticalFindings.length > 0) {
    missed.push(
      `Key findings to anchor in this case: ${input.missedCriticalFindings.join('; ')}.`
    )
  }
  for (const m of config.commonMisses.slice(0, 2)) {
    if (!missed.some((x) => x.includes(m.slice(0, 20)))) {
      missed.push(m)
    }
  }
  const uniq = [...new Set(missed)]
  return uniq.slice(0, 4)
}

/** 2–4 concise bullets: how the case should be framed (no long paragraphs). */
export function buildCorrectApproach(
  input: DebriefInput,
  config: ScenarioDebriefConfig,
  finalMatchesCorrect: boolean
): string[] {
  const lines: string[] = []
  for (const line of config.correctDiagnosisExplanation.slice(0, 3)) {
    const t = line.trim()
    if (t) lines.push(t)
  }
  if (lines.length < 3 && config.differentialComparison.length > 0) {
    const row = config.differentialComparison[0]
    lines.push(`${row.diagnosis}: ${row.whyLessLikely}`)
  }
  if (!finalMatchesCorrect) {
    lines.push(
      `Weigh the pattern of history, exam, and tests against ${input.correctDiagnosis} as the teaching diagnosis.`
    )
  } else if (lines.length < 2) {
    lines.push('The teaching diagnosis matches your final choice; use the bullets above to reinforce the clinical story.')
  }
  const uniq = [...new Set(lines)]
  return uniq.slice(0, 4)
}

/** Optional polish pipeline only — keep parallel to correctApproach when non-empty. */
export function buildDiagnosticReasoning(
  input: DebriefInput,
  config: ScenarioDebriefConfig,
  finalMatchesCorrect: boolean
): string[] {
  return buildCorrectApproach(input, config, finalMatchesCorrect)
}

export function buildImprovementTip(input: DebriefInput, missedHistoryPoints: string[]): string {
  if (missedHistoryPoints.length > 0) {
    const hint = missedHistoryPoints[0].trim()
    const short = hint.length > 90 ? `${hint.slice(0, 87)}…` : hint
    return `Next time, focus on asking about ${short} earlier to narrow the diagnosis faster.`
  }
  if (input.missingMustNotMissDxIds.length > 0) {
    return 'Next time, add must-not-miss diagnoses to the differential early, then let results narrow the list.'
  }
  if (input.unnecessaryTests.length > 0) {
    return 'Next time, favor high-yield tests and skip orders that are unlikely to change your next step.'
  }
  if (input.differentialLength > 8) {
    return 'Next time, keep the differential short and rank by pretest probability and risk.'
  }
  return 'Next time, move in sequence: targeted history, focused exam, then tests that change management.'
}

/** Legacy array for polish compatibility — single tip as one element. */
export function buildNextStepAdvice(input: DebriefInput, missedHistoryPoints: string[]): string[] {
  return [buildImprovementTip(input, missedHistoryPoints)]
}
