import Link from 'next/link'
import { Scenario, ScenarioDifficulty } from '@/data/scenarios'
import type { ScenarioProgressInfo } from './ScenarioList'

type Props = {
  scenario: Scenario
  progress?: ScenarioProgressInfo
}

const difficultyColors: Record<ScenarioDifficulty, string> = {
  Beginner: 'bg-green-100 text-green-800',
  Intermediate: 'bg-yellow-100 text-yellow-800',
  Advanced: 'bg-red-100 text-red-800',
}

function statusBadge(progress?: ScenarioProgressInfo) {
  if (!progress) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        ⚪ Not started
      </span>
    )
  }
  if (progress.status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200">
        🟡 In progress
      </span>
    )
  }
  if (progress.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-200">
        ✅ Completed
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
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[scenario.difficulty]}`}>
              {scenario.difficulty}
            </span>
            {statusBadge(progress)}
          </div>
        </div>
        <div className="mb-3">
          <span className="text-sm text-primary-600 font-medium">{scenario.specialty}</span>
          <span className="text-sm text-gray-500 mx-2">•</span>
          <span className="text-sm text-gray-500">{scenario.estimatedMinutes} min</span>
        </div>
        <p className="text-gray-600 text-sm flex-grow mb-4">{scenario.description}</p>
        <div className="flex items-center text-primary-600 text-sm font-medium">
          Start Scenario →
        </div>
      </div>
    </Link>
  )
}

