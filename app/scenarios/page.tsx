import { scenarios } from '@/data/scenarios'
import ScenarioList from '@/components/ScenarioList'
import { auth } from '@/lib/auth'
import { getScenarioSummariesForUser } from '@/lib/scenarioMastery'

export default async function ScenariosPage() {
  const session = await auth()
  let progressByScenario: Record<
    string,
    { status: string; bestScore: number | null; lastAttemptScore: number | null }
  > = {}
  if (session?.user?.id) {
    try {
      const summaries = await getScenarioSummariesForUser(
        session.user.id,
        scenarios.map((s) => s.id)
      )
      progressByScenario = Object.fromEntries(
        scenarios.map((s) => {
          const sum = summaries.get(s.id)!
          return [
            s.id,
            {
              status: sum.displayStatus,
              bestScore: sum.bestScore,
              lastAttemptScore: sum.lastAttemptScore,
            },
          ]
        })
      )
    } catch (e) {
      console.error('[scenarios] progress load failed (cases still listed):', e)
    }
  }

  return <ScenarioList scenarios={scenarios} progressByScenario={progressByScenario} />
}

