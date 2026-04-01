import type { Scenario } from '@/data/scenarios'
import { diagnosisCatalog } from '@/data/diagnosisCatalog'
import type { DebriefInput, DebriefScoreBreakdown, ScenarioDebriefConfig } from '@/types/debrief'
import { resolveTest, calculateTestScore } from '@/lib/testEngine'
import { calculateFinalDxScore, checkMissingMustNotMiss } from '@/lib/dxEngine'

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'your',
  'are',
  'was',
  'has',
  'have',
  'not',
  'but',
  'what',
  'when',
  'how',
])

export function normalizeBlob(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function doctorBlobFromChat(
  chat: Array<{ role: string; content: string }> | undefined
): string {
  if (!chat?.length) return ''
  return normalizeBlob(
    chat.filter((m) => m.role === 'doctor' || m.role === 'user').map((m) => m.content).join(' ')
  )
}

/** Heuristic: enough keywords from the topic hint appear in the doctor transcript. */
export function topicLikelyAsked(doctorBlob: string, topicHint: string): boolean {
  const words = normalizeBlob(topicHint)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  if (words.length === 0) return false
  const hits = words.filter((w) => doctorBlob.includes(w)).length
  const need = Math.max(1, Math.ceil(words.length * 0.35))
  return hits >= need
}

export function filterAskedTopics(
  doctorBlob: string,
  keyHistoryQuestions: string[]
): string[] {
  return keyHistoryQuestions.filter((q) => topicLikelyAsked(doctorBlob, q))
}

export function missedKeyHistoryTopics(
  doctorBlob: string,
  keyHistoryQuestions: string[]
): string[] {
  return keyHistoryQuestions.filter((q) => !topicLikelyAsked(doctorBlob, q))
}

/** Map persona key history bullets to likely missed lines when chat lacks overlap. */
export function missedPersonaHistoryPoints(
  doctorBlob: string,
  keyHistoryPointLines: string[]
): string[] {
  return keyHistoryPointLines.filter((line) => !topicLikelyAsked(doctorBlob, line))
}

export function examCoverage(
  viewedSections: string[] | undefined,
  keyExamItems: string[]
): { completed: string[]; missed: string[] } {
  const viewed = new Set(viewedSections || [])
  const completed = keyExamItems.filter((id) => viewed.has(id))
  const missed = keyExamItems.filter((id) => !viewed.has(id))
  return { completed, missed }
}

export function testsUnnecessaryOrdered(
  ordered: string[] | undefined,
  unnecessaryTests: string[]
): string[] {
  const u = new Set(unnecessaryTests)
  return (ordered || []).filter((t) => u.has(t))
}

export function testsCriticalHit(
  ordered: string[] | undefined,
  criticalTests: string[]
): string[] {
  const o = new Set(ordered || [])
  return criticalTests.filter((t) => o.has(t))
}

export function testsCriticalMissed(
  ordered: string[] | undefined,
  criticalTests: string[]
): string[] {
  const o = new Set(ordered || [])
  return criticalTests.filter((t) => !o.has(t))
}

export function buildDebriefInput(params: {
  scenario: Scenario
  config: ScenarioDebriefConfig
  chat?: Array<{ role: string; content: string }>
  viewedExamSections?: string[]
  orderedTests?: string[]
  finalDxId?: string | null
  differentialDetailed?: Array<{ dxId: string; rank: number; confidence: string; note?: string }>
  redFlagsFound?: string[]
}): DebriefInput {
  const { scenario, config } = params
  const doctorBlob = doctorBlobFromChat(params.chat)
  const askedHistoryQuestions = filterAskedTopics(doctorBlob, config.keyHistoryQuestions)
  const ordered = params.orderedTests || []
  const viewed = params.viewedExamSections || []

  const { completed: completedExamItems } = examCoverage(viewed, config.keyExamItems)

  const criticalHit = testsCriticalHit(ordered, config.criticalTests)
  const unnecessary = testsUnnecessaryOrdered(ordered, config.unnecessaryTests)

  const anyCriticalOrdered = criticalHit.length > 0
  const keyFindingsDiscovered = config.mustRecognizeFindings.filter(
    (f) => anyCriticalOrdered || topicLikelyAsked(doctorBlob, f)
  )
  const missedCriticalFindings = config.mustRecognizeFindings.filter(
    (f) => !keyFindingsDiscovered.includes(f)
  )

  let correctName = 'Unknown'
  if (scenario.finalDxId) {
    const dx = diagnosisCatalog.find((d) => d.id === scenario.finalDxId)
    correctName = dx?.name || scenario.finalDxId
  }

  const expectedDifferentials =
    scenario.dxOverrides
      ?.filter((d) => d.yield === 'correct' || d.yield === 'reasonable' || d.yield === 'dangerous-miss')
      .map((d) => d.dxId) || []

  const redFlagsIdentified = params.redFlagsFound || []
  const personaRed = scenario.patientPersona.redFlags
  const redFlagsMissed = personaRed.filter(
    (rf) => !topicLikelyAsked(doctorBlob, rf) && !redFlagsIdentified.some((r) => normalizeBlob(r).includes(normalizeBlob(rf).slice(0, 8)))
  )

  const missingMustNotMiss = checkMissingMustNotMiss(
    (params.differentialDetailed || []).map((d) => d.dxId),
    scenario.requiredMustNotMiss
  )

  const scoreBreakdown = computeScoreBreakdown({
    scenario,
    askedCount: askedHistoryQuestions.length,
    totalTopics: config.keyHistoryQuestions.length,
    examCompleted: completedExamItems.length,
    examTotal: config.keyExamItems.length,
    orderedTests: ordered,
    differentialDetailed: params.differentialDetailed,
    finalDxId: params.finalDxId ?? null,
    missingMustNotMiss,
  })

  return {
    scenarioId: scenario.id,
    finalDxId: params.finalDxId,
    differential: (params.differentialDetailed || []).map((d) => d.dxId),
    askedHistoryQuestions,
    completedExamItems,
    orderedTests: ordered,
    keyFindingsDiscovered,
    missedCriticalFindings,
    unnecessaryTests: unnecessary,
    correctDiagnosis: correctName,
    expectedDifferentials,
    redFlagsIdentified,
    redFlagsMissed,
    scoreBreakdown,
    doctorChatBlob: doctorBlob,
    missingMustNotMissDxIds: missingMustNotMiss,
    differentialLength: params.differentialDetailed?.length ?? 0,
  }
}

function computeScoreBreakdown(args: {
  scenario: Scenario
  askedCount: number
  totalTopics: number
  examCompleted: number
  examTotal: number
  orderedTests: string[]
  differentialDetailed?: Array<{ dxId: string; note?: string }>
  finalDxId: string | null
  missingMustNotMiss: string[]
}): DebriefScoreBreakdown {
  const { scenario, askedCount, totalTopics, examCompleted, examTotal, orderedTests } = args

  const histRatio = totalTopics > 0 ? askedCount / totalTopics : 0
  const history = Math.round(Math.min(5, histRatio * 5))

  const examRatio = examTotal > 0 ? examCompleted / examTotal : 0
  const exam = Math.round(Math.min(5, examRatio * 5))

  let testingRaw = 0
  for (const testId of orderedTests) {
    try {
      const r = resolveTest(scenario, testId)
      testingRaw += calculateTestScore(r.yield)
    } catch {
      /* skip */
    }
  }
  const testing = Math.max(0, Math.min(5, Math.round(testingRaw)))

  let reasoning = 2
  if (args.differentialDetailed && args.differentialDetailed.length > 0) {
    const withNotes = args.differentialDetailed.filter(
      (d: { note?: string }) => d.note && String(d.note).trim().length > 8
    ).length
    reasoning = Math.min(5, 2 + withNotes + (args.differentialDetailed.length >= 3 ? 1 : 0))
  }

  let diagnosis = 2
  if (args.differentialDetailed?.length) {
    const finalPart = calculateFinalDxScore(args.finalDxId, scenario.finalDxId)
    const miss = args.missingMustNotMiss.length
    diagnosis = Math.max(
      0,
      Math.min(5, Math.round(2 + finalPart * 0.4 + (miss === 0 ? 2 : 0) - miss * 1.5))
    )
  }

  let efficiency = 5
  const ddxLen = args.differentialDetailed?.length ?? 0
  if (ddxLen > 6) efficiency -= Math.min(3, ddxLen - 6)
  let lowYield = 0
  for (const testId of orderedTests) {
    try {
      const r = resolveTest(scenario, testId)
      if (r.yield === 'inappropriate' || r.yield === 'low') lowYield += 1
    } catch {
      /* */
    }
  }
  efficiency = Math.max(0, efficiency - Math.min(2, Math.floor(lowYield / 2)))

  return { history, exam, testing, reasoning, diagnosis, efficiency }
}
