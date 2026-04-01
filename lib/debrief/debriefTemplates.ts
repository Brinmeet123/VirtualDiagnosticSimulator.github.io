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
  percent: number
  askedRatio: number
}): string {
  const { scenarioTitle, correctDx, finalDxId, correctDxId, percent, askedRatio } = params
  const correct = finalDxId && correctDxId && finalDxId === correctDxId
  const dxLine = correct
    ? `You selected the expected diagnosis (${correctDx}).`
    : `Your final diagnosis differed from the teaching diagnosis (${correctDx}). Focus on the key data that supported that diagnosis.`
  return `Case: ${scenarioTitle}. Overall performance was ${ratingLabel(percent).toLowerCase()} (${percent}% of the reference scale). You explored roughly ${Math.round(askedRatio * 100)}% of the suggested history topics. ${dxLine}`
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
  return out
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
  return uniq.slice(0, 8)
}

export function buildDiagnosticReasoning(
  input: DebriefInput,
  config: ScenarioDebriefConfig,
  finalMatchesCorrect: boolean
): string[] {
  const lines: string[] = []
  for (const line of config.correctDiagnosisExplanation) {
    lines.push(line)
  }
  if (finalMatchesCorrect) {
    lines.push('Your final diagnosis matches the teaching case diagnosis.')
  } else {
    lines.push(
      `The teaching diagnosis was ${input.correctDiagnosis}. Revisit the history, exam, and test pattern that best supports that entity.`
    )
  }
  for (const row of config.differentialComparison) {
    lines.push(`${row.diagnosis}: ${row.whyLessLikely}`)
  }
  return lines
}

export function buildNextStepAdvice(
  input: DebriefInput,
  missedHistoryPoints: string[]
): string[] {
  const tips: string[] = []
  if (missedHistoryPoints.length > 0) {
    tips.push(`Review these history elements: ${missedHistoryPoints.slice(0, 4).join('; ')}.`)
  }
  if (input.missingMustNotMissDxIds.length > 0) {
    tips.push(
      'Practice adding life-threatening diagnoses to the differential early, then narrow with data.'
    )
  }
  if (input.differentialLength > 8) {
    tips.push('Tighten the differential: prioritize by pre-test probability and danger.')
  }
  tips.push('Re-run the case with a focused checklist for history → exam → testing → synthesis.')
  return tips
}
