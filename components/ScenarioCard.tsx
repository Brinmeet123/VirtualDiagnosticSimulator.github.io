import Link from 'next/link'
import { Scenario, ScenarioDifficulty } from '@/data/scenarios'
import type { ScenarioProgressInfo } from './ScenarioList'
import { difficultyUiLabel } from '@/lib/scenarioUi'

type Props = {
  scenario: Scenario
  progress?: ScenarioProgressInfo
}

const difficultyColors: Record<ScenarioDifficulty, string> = {
  Beginner: 'bg-emerald-100 text-emerald-900',
  Intermediate: 'bg-amber-100 text-amber-900',
  Advanced: 'bg-rose-100 text-rose-900',
}

function statusBadge(progress?: ScenarioProgressInfo) {
  if (!progress) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        Not started
      </span>
    )
  }
  if (progress.status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200">
        In progress
      </span>
    )
  }
  if (progress.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-200">
        Done
        {progress.bestScore != null ? (
          <span className="tabular-nums">· {progress.bestScore}</span>
        ) : null}
      </span>
    )
  }
  return null
}

export default function ScenarioCard({ scenario, progress }: Props) {
  return (
    <Link href={`/scenarios/${scenario.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 h-full flex flex-col cursor-pointer border border-gray-200">
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="text-xl font-semibold text-gray-900">{scenario.title}</h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${difficultyColors[scenario.difficulty]}`}
              title={scenario.difficulty}
            >
              {difficultyUiLabel(scenario.difficulty)}
            </span>
            {statusBadge(progress)}
          </div>
        </div>
        <div className="mb-3">
          <span className="text-sm text-primary-600 font-medium">{scenario.specialty}</span>
          <span className="text-sm text-gray-500 mx-2">•</span>
          <span className="text-sm text-gray-500">{scenario.estimatedMinutes} min</span>
        </div>
        <p className="text-gray-600 text-sm flex-grow mb-2">{scenario.description}</p>
        <p className="text-sm text-slate-500 italic mb-3 leading-snug">{scenario.cardTeaser}</p>
        {progress &&
          (progress.bestScore != null || progress.lastAttemptScore != null) &&
          (progress.status === 'completed' || progress.status === 'in_progress') && (
            <p className="text-xs text-slate-600 tabular-nums mb-4">
              {progress.bestScore != null && <span>Best {progress.bestScore}</span>}
              {progress.lastAttemptScore != null && (
                <span>
                  {progress.bestScore != null ? ' · ' : ''}Last {progress.lastAttemptScore}
                </span>
              )}
            </p>
          )}
        <div className="btn-press mt-auto inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-2 text-primary-800 text-sm font-semibold ring-1 ring-primary-200/80 w-fit">
          Start Case →
        </div>
      </div>
    </Link>
  )
}

