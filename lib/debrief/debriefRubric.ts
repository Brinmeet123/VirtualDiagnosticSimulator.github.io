import type { DebriefRubric100, DebriefScoreBreakdown } from '@/types/debrief'

export type { DebriefRubric100 }

/**
 * Maps internal 0–5 subscores to four 25-point bands.
 * History + exam inform history-taking; testing + efficiency inform efficiency / question selection.
 */
export function computeRubric100(sb: DebriefScoreBreakdown): DebriefRubric100 {
  const historyTaking = Math.round(((sb.history + sb.exam) / 10) * 25)
  const clinicalReasoning = Math.round(sb.reasoning * 5)
  const diagnosticAccuracy = Math.round(sb.diagnosis * 5)
  const efficiencyAndQuestionSelection = Math.round(((sb.testing + sb.efficiency) / 10) * 25)
  const total = Math.min(
    100,
    historyTaking + clinicalReasoning + diagnosticAccuracy + efficiencyAndQuestionSelection
  )
  return {
    historyTaking,
    clinicalReasoning,
    diagnosticAccuracy,
    efficiencyAndQuestionSelection,
    total,
  }
}
