/**
 * Deterministic debrief types — no AI required for the main flow.
 */

export type DebriefScoreBreakdown = {
  history: number
  exam: number
  testing: number
  reasoning: number
  diagnosis: number
  efficiency: number
}

export type DebriefInput = {
  scenarioId: string
  finalDiagnosis?: string
  finalDxId?: string | null
  differential?: string[]
  askedHistoryQuestions: string[]
  completedExamItems: string[]
  orderedTests: string[]
  keyFindingsDiscovered: string[]
  missedCriticalFindings: string[]
  unnecessaryTests: string[]
  correctDiagnosis: string
  expectedDifferentials: string[]
  redFlagsIdentified: string[]
  redFlagsMissed: string[]
  scoreBreakdown: DebriefScoreBreakdown
  /** Raw doctor chat text (lowercased) for keyword rules */
  doctorChatBlob: string
  /** Must-not-miss dx ids missing from DDx */
  missingMustNotMissDxIds: string[]
  differentialLength: number
}

export type DebriefOutput = {
  summary: string
  strengths: string[]
  missedOpportunities: string[]
  diagnosticReasoning: string[]
  nextStepAdvice: string[]
  clinicalPearls: string[]
  vocabToReview: string[]
}

/** Per-scenario configuration for rule-based debrief (see data/debriefConfigs.ts). */
export type ScenarioDebriefConfig = {
  keyHistoryQuestions: string[]
  keyExamItems: string[]
  criticalTests: string[]
  unnecessaryTests: string[]
  mustRecognizeFindings: string[]
  commonMisses: string[]
  correctDiagnosisExplanation: string[]
  differentialComparison: { diagnosis: string; whyLessLikely: string }[]
  clinicalPearls: string[]
  vocabTerms: string[]
}

/** API + UI shape: deterministic debrief plus legacy assessment fields. */
export type DeterministicAssessment = {
  overallRating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
  summary: string
  strengths: string[]
  areasForImprovement: string[]
  diagnosisFeedback: string
  missedKeyHistoryPoints: string[]
  testSelectionFeedback: string
  sectionRatings: {
    history: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
    exam: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
    tests: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
    diagnosis: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
    communication: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
  }
  totalScore: number
  totalScorePercentage: number
  maxScore: number
  scoreBreakdown: {
    history: number
    exam: number
    tests: number
    diagnosis: number
    communication: number
  }
  /** Structured debrief sections */
  debriefStructured: DebriefOutput
  /** Source marker for clients */
  source: 'deterministic' | 'deterministic-polished'
}
