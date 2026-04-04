import { prisma } from '@/lib/prisma'

/** UI status: any completed attempt wins over in_progress (replay). */
export type ScenarioDisplayStatus = 'not_started' | 'in_progress' | 'completed'

export type ScenarioSummary = {
  scenarioId: string
  displayStatus: ScenarioDisplayStatus
  bestScore: number | null
}

type Agg = {
  hasCompleted: boolean
  hasInProgress: boolean
  bestScore: number | null
}

function deriveDisplayStatus(a: Agg): ScenarioDisplayStatus {
  if (a.hasCompleted) return 'completed'
  if (a.hasInProgress) return 'in_progress'
  return 'not_started'
}

/** Aggregate attempts per scenario for one user (in memory; fine for modest attempt volume). */
function aggregateAttempts(
  rows: { scenarioId: string; status: string; score: number | null }[]
): Map<string, Agg> {
  const map = new Map<string, Agg>()
  for (const r of rows) {
    let cur = map.get(r.scenarioId)
    if (!cur) {
      cur = { hasCompleted: false, hasInProgress: false, bestScore: null }
      map.set(r.scenarioId, cur)
    }
    if (r.status === 'completed') {
      cur.hasCompleted = true
      const s = r.score ?? 0
      cur.bestScore = cur.bestScore == null ? s : Math.max(cur.bestScore, s)
    }
    if (r.status === 'in_progress') {
      cur.hasInProgress = true
    }
  }
  return map
}

/**
 * DISTINCT scenario_ids with at least one completed attempt (mastery count).
 * Equivalent: SELECT COUNT(DISTINCT scenario_id) FROM scenario_attempts WHERE user_id = $1 AND status = 'completed'
 */
export async function countDistinctCompletedScenarios(userId: string): Promise<number> {
  const grouped = await prisma.scenarioAttempt.groupBy({
    by: ['scenarioId'],
    where: { userId, status: 'completed' },
    _count: { _all: true },
  })
  return grouped.length
}

/** Per-scenario display status + best score from attempts (MAX(score) for completed rows). */
export async function getScenarioSummariesForUser(
  userId: string,
  scenarioIds: string[]
): Promise<Map<string, ScenarioSummary>> {
  if (scenarioIds.length === 0) return new Map()

  const attempts = await prisma.scenarioAttempt.findMany({
    where: { userId, scenarioId: { in: scenarioIds } },
    select: { scenarioId: true, status: true, score: true },
  })

  const agg = aggregateAttempts(attempts)
  const out = new Map<string, ScenarioSummary>()

  for (const id of scenarioIds) {
    const a = agg.get(id) ?? { hasCompleted: false, hasInProgress: false, bestScore: null }
    out.set(id, {
      scenarioId: id,
      displayStatus: deriveDisplayStatus(a),
      bestScore: a.bestScore,
    })
  }
  return out
}
