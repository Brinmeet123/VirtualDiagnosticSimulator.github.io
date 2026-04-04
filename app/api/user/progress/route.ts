import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scenarios } from '@/data/scenarios'
import { getScenarioSummariesForUser } from '@/lib/scenarioMastery'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const scenarioIds = scenarios.map((s) => s.id)

    const [user, summaries] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { totalScore: true },
      }),
      getScenarioSummariesForUser(userId, scenarioIds),
    ])

    const scenarioProgress = scenarioIds.map((id) => {
      const sum = summaries.get(id)!
      return {
        scenarioId: id,
        status: sum.displayStatus,
        bestScore: sum.bestScore,
      }
    })

    return NextResponse.json({
      totalScore: user?.totalScore ?? 0,
      scenarios: scenarioProgress,
    })
  } catch (e) {
    console.error('user/progress:', e)
    return NextResponse.json({ error: 'Failed to load progress.' }, { status: 500 })
  }
}
