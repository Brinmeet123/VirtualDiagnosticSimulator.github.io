import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scenarios } from '@/data/scenarios'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id

    const [user, progressRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { totalScore: true },
      }),
      prisma.scenarioProgress.findMany({
        where: { userId },
        select: { scenarioId: true, status: true, score: true },
      }),
    ])

    const byId = new Map(progressRows.map((p) => [p.scenarioId, p]))

    const scenarioProgress = scenarios.map((s) => {
      const p = byId.get(s.id)
      if (!p) {
        return { scenarioId: s.id, status: 'not_started' as const, bestScore: null as number | null }
      }
      return {
        scenarioId: s.id,
        status: p.status as 'in_progress' | 'completed',
        bestScore: p.score,
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
