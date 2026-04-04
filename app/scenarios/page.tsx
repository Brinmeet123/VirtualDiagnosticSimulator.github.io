import { scenarios } from '@/data/scenarios'
import ScenarioList from '@/components/ScenarioList'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ScenariosPage() {
  const session = await auth()
  let progressByScenario: Record<string, { status: string; bestScore: number | null }> = {}
  if (session?.user?.id) {
    const rows = await prisma.scenarioProgress.findMany({
      where: { userId: session.user.id },
      select: { scenarioId: true, status: true, score: true },
    })
    progressByScenario = Object.fromEntries(
      rows.map((r) => [r.scenarioId, { status: r.status, bestScore: r.score }])
    )
  }

  return <ScenarioList scenarios={scenarios} progressByScenario={progressByScenario} />
}

