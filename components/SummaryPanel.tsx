'use client'

import Link from 'next/link'
import { Scenario } from '@/data/scenarios'
import type { RubricBreakdown } from '@/lib/scoring'
import type { DebriefRubric100 } from '@/types/debrief'
import VocabText from './VocabText'
import VocabContextBlock from './VocabContextBlock'
import { vocab, getVocabTerm } from '@/data/vocab'

type DebriefStructured = {
  summary: string
  strengths: string[]
  missedOpportunities: string[]
  correctApproach?: string[]
  improvementTip?: string
  diagnosticReasoning: string[]
  nextStepAdvice: string[]
  clinicalPearls: string[]
  vocabToReview: string[]
}

type AssessmentResult = {
  overallRating: string
  summary: string
  strengths: string[]
  areasForImprovement: string[]
  diagnosisFeedback: string
  missedKeyHistoryPoints: string[]
  testSelectionFeedback: string
  sectionRatings?: {
    history?: string
    exam?: string
    tests?: string
    diagnosis?: string
    communication?: string
  }
  totalScore?: number
  totalScorePercentage?: number
  maxScore?: number
  rubric100?: DebriefRubric100
  scoreBreakdown?: {
    history?: number
    exam?: number
    tests?: number
    diagnosis?: number
    communication?: number
  }
  debriefStructured?: DebriefStructured
  source?: string
}

type Props = {
  scenario: Scenario
  assessment: AssessmentResult
  clickedTerms?: string[]
  savedTerms?: string[]
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
  scenarioScore?: {
    score: number
    level: string
    feedback: string
    rubric: RubricBreakdown
  }
}

const ratingColors: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-800 border-green-300',
  Good: 'bg-blue-100 text-blue-800 border-blue-300',
  'Needs Improvement': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Poor: 'bg-red-100 text-red-800 border-red-300',
}

const RUBRIC_ROWS: { key: keyof DebriefRubric100; label: string }[] = [
  { key: 'historyTaking', label: 'History Taking' },
  { key: 'clinicalReasoning', label: 'Clinical Reasoning' },
  { key: 'diagnosticAccuracy', label: 'Diagnostic Accuracy' },
  { key: 'efficiencyAndQuestionSelection', label: 'Efficiency / Question Selection' },
]

function Rubric100Block({
  rubric,
  total,
  levelLabel,
}: {
  rubric: DebriefRubric100
  total: number
  levelLabel: string
}) {
  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-slate-50 p-5 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-teal-900">Score</h3>
      <p className="text-4xl font-bold tabular-nums text-slate-900">
        {total}
        <span className="text-2xl font-semibold text-slate-600">/100</span>
      </p>
      <p className="mt-1 text-sm font-medium text-teal-900">{levelLabel}</p>
      <p className="mb-3 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Rubric</p>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {RUBRIC_ROWS.map(({ key, label }) => (
          <li key={key} className="flex justify-between gap-4 tabular-nums">
            <span>{label}</span>
            <span>
              {rubric[key]}/25
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function LegacyScenarioRubricBlock({
  rubric,
  score,
  level,
  feedback,
}: {
  rubric: RubricBreakdown
  score: number
  level: string
  feedback: string
}) {
  const rows: { label: string; value: number; max: number }[] = [
    { label: 'History Taking', value: rubric.historyTaking, max: 25 },
    { label: 'Clinical Reasoning', value: rubric.clinicalReasoning, max: 25 },
    { label: 'Diagnostic Accuracy', value: rubric.diagnosticAccuracy, max: 25 },
    { label: 'Efficiency / Question Selection', value: rubric.efficiencyAndQuestionSelection, max: 25 },
  ]
  return (
    <div className="mb-6 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-slate-50 p-5 shadow-sm">
      <h3 className="mb-2 text-lg font-semibold text-teal-900">Score</h3>
      <p className="text-4xl font-bold tabular-nums text-slate-900">
        {score}
        <span className="text-2xl font-semibold text-slate-600">/100</span>
      </p>
      <p className="mt-1 text-sm font-medium text-teal-900">{level}</p>
      {feedback ? <p className="mt-2 text-sm leading-relaxed text-slate-700">{feedback}</p> : null}
      <p className="mb-3 mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Rubric</p>
      <ul className="space-y-1.5 text-sm text-slate-700">
        {rows.map((r) => (
          <li key={r.label} className="flex justify-between gap-4 tabular-nums">
            <span>{r.label}</span>
            <span>
              {r.value}/{r.max}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function dedupeMissed(
  areas: string[],
  missedPoints: string[],
  max: number
): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of [...areas, ...missedPoints]) {
    const t = s.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
    if (out.length >= max) break
  }
  return out
}

export default function SummaryPanel({
  scenario,
  assessment,
  clickedTerms = [],
  savedTerms = [],
  onTermClick,
  onTermSave,
  scenarioScore,
}: Props) {
  const badges: string[] = []
  if (
    assessment.strengths.some(
      (s) => s.toLowerCase().includes('history') || s.toLowerCase().includes('interview')
    )
  ) {
    badges.push('History Builder')
  }
  if (
    assessment.strengths.some(
      (s) => s.toLowerCase().includes('red flag') || s.toLowerCase().includes('urgent')
    )
  ) {
    badges.push('Red Flag Spotter')
  }
  if (
    assessment.strengths.some(
      (s) => s.toLowerCase().includes('test') || s.toLowerCase().includes('diagnostic')
    )
  ) {
    badges.push('Smart Test Picker')
  }
  if (
    assessment.strengths.some(
      (s) => s.toLowerCase().includes('differential') || s.toLowerCase().includes('diagnosis')
    )
  ) {
    badges.push('Differential Thinker')
  }
  if (
    assessment.strengths.some(
      (s) => s.toLowerCase().includes('communication') || s.toLowerCase().includes('rapport')
    )
  ) {
    badges.push('Clear Communicator')
  }

  const newTermsCount = clickedTerms.length

  const recommendedTerms = vocab
    .filter((term) => {
      const relatedToMissed = assessment.missedKeyHistoryPoints.some(
        (point) =>
          point.toLowerCase().includes(term.term.toLowerCase()) ||
          term.tags.some((tag) => point.toLowerCase().includes(tag))
      )
      const isImportant = term.tags.includes('red-flag') || term.tags.includes('cardiac')
      return (relatedToMissed || isImportant) && !savedTerms.includes(term.term)
    })
    .slice(0, 5)
    .map((term) => term.term)

  const ds = assessment.debriefStructured
  const debriefContext = [
    assessment.summary,
    assessment.strengths.join('\n'),
    assessment.areasForImprovement.join('\n'),
    ds?.correctApproach?.join('\n'),
    ds?.improvementTip,
  ]
    .filter(Boolean)
    .join('\n')

  const rubricFromAssessment = assessment.rubric100
  const rubricFromScenario = scenarioScore?.rubric
  const showDeterministicRubric = rubricFromAssessment && rubricFromAssessment.total >= 0
  const missedCombined = dedupeMissed(
    assessment.areasForImprovement,
    assessment.missedKeyHistoryPoints,
    4
  )
  const correctApproachLines =
    ds?.correctApproach && ds.correctApproach.length > 0
      ? ds.correctApproach.slice(0, 4)
      : (ds?.diagnosticReasoning ?? []).slice(0, 4)

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
      <VocabContextBlock source="debrief" scenarioId={scenario.id} text={debriefContext}>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Diagnosis report</h2>
        <p className="mb-6 text-sm leading-relaxed text-slate-600">
          Structured feedback for this run. Each section is limited to a few high-yield points.
        </p>

        {showDeterministicRubric && rubricFromAssessment ? (
          <Rubric100Block
            rubric={rubricFromAssessment}
            total={rubricFromAssessment.total}
            levelLabel={assessment.overallRating}
          />
        ) : scenarioScore && rubricFromScenario ? (
          <LegacyScenarioRubricBlock
            rubric={rubricFromScenario}
            score={scenarioScore.score}
            level={scenarioScore.level}
            feedback={scenarioScore.feedback}
          />
        ) : assessment.totalScore != null ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-1 text-lg font-semibold text-slate-900">Score</h3>
            <p className="text-3xl font-bold tabular-nums text-slate-900">
              {assessment.totalScore}
              <span className="text-xl font-semibold text-slate-600">/{assessment.maxScore ?? 100}</span>
            </p>
            {assessment.totalScorePercentage != null ? (
              <p className="mt-1 text-sm text-slate-600">{assessment.totalScorePercentage}% overall</p>
            ) : null}
          </div>
        ) : null}

        <div className="mb-6 rounded-lg border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50 p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Badges</h3>
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">None this run.</p>
          )}
        </div>

        <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Vocabulary</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Clicked:</strong> {newTermsCount} {newTermsCount === 1 ? 'term' : 'terms'}
            </p>
            {savedTerms.length > 0 ? (
              <p className="text-sm text-gray-700">
                <strong>Saved:</strong> {savedTerms.length} {savedTerms.length === 1 ? 'term' : 'terms'}
              </p>
            ) : null}
            {recommendedTerms.length > 0 ? (
              <div className="mt-3">
                <p className="mb-2 text-sm font-medium text-gray-900">Worth another look:</p>
                <div className="flex flex-wrap gap-2">
                  {recommendedTerms.map((term) => {
                    const termData = getVocabTerm(term)
                    return termData ? (
                      <button
                        key={term}
                        type="button"
                        onClick={() => onTermClick?.(term)}
                        className="rounded-md border border-purple-300 bg-white px-3 py-1 text-sm text-purple-700 transition hover:bg-purple-100"
                      >
                        {termData.display}
                      </button>
                    ) : null
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={`mb-4 rounded-lg border-2 p-3 ${ratingColors[assessment.overallRating] || ratingColors.Good}`}
        >
          <p className="text-sm font-semibold">Overall: {assessment.overallRating}</p>
        </div>

        <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</h3>
          <p className="text-sm text-slate-800">
            <VocabText text={assessment.summary} onTermClick={onTermClick} onTermSave={onTermSave} />
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <h3 className="mb-2 text-base font-semibold text-emerald-900">What You Did Well</h3>
            {assessment.strengths.length === 0 ? (
              <p className="text-sm text-slate-600">No items listed.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                {assessment.strengths.slice(0, 4).map((strength, idx) => (
                  <li key={idx}>
                    <VocabText
                      text={strength}
                      onTermClick={onTermClick}
                      onTermSave={onTermSave}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <h3 className="mb-2 text-base font-semibold text-amber-900">What You Missed</h3>
            {missedCombined.length === 0 ? (
              <p className="text-sm text-slate-600">No major gaps flagged.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                {missedCombined.map((area, idx) => (
                  <li key={idx}>
                    <VocabText text={area} onTermClick={onTermClick} onTermSave={onTermSave} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="mb-2 text-base font-semibold text-slate-900">Correct Approach</h3>
            {correctApproachLines.length === 0 ? (
              <p className="text-sm text-slate-600">No extra teaching lines for this case.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                {correctApproachLines.map((line, idx) => (
                  <li key={idx}>
                    <VocabText text={line} onTermClick={onTermClick} onTermSave={onTermSave} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {ds?.improvementTip ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Next step
            </h3>
            <p>
              <VocabText text={ds.improvementTip} onTermClick={onTermClick} onTermSave={onTermSave} />
            </p>
          </div>
        ) : null}

        {ds?.vocabToReview && ds.vocabToReview.length > 0 ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-1 text-sm font-semibold text-gray-900">Vocabulary to review</h3>
            <p className="text-sm text-gray-700">{ds.vocabToReview.join(', ')}</p>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-5">
            <p className="font-semibold text-slate-900">What do you want to do next?</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/scenarios/${scenario.id}`
                }}
                className="btn-press flex-1 rounded-lg border border-primary-300 bg-white px-4 py-3 text-center text-sm font-semibold text-primary-800 shadow-sm transition hover:bg-primary-50"
              >
                Try again to improve score
              </button>
              <Link
                href="/scenarios"
                className="btn-press flex-1 rounded-lg bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
              >
                Pick another case
              </Link>
            </div>
          </div>
        </div>
      </VocabContextBlock>
    </div>
  )
}
