import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bodySchema = z.object({
  scenarioId: z.string().trim().min(1).max(200),
  score: z.number().int().min(0),
  status: z.string().trim().min(1).max(120),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }

    const { scenarioId, score, status } = parsed.data
    const userId = session.user.id

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const prev = await tx.scenarioProgress.findUnique({
        where: {
          userId_scenarioId: { userId, scenarioId },
        },
      })

      const prevScore = prev?.score ?? 0
      const nextScore = Math.max(prevScore, score)
      const delta = nextScore - prevScore
      const firstCompletion = !prev

      await tx.scenarioProgress.upsert({
        where: {
          userId_scenarioId: { userId, scenarioId },
        },
        create: {
          userId,
          scenarioId,
          score: nextScore,
          status,
          activeAttemptId: null,
        },
        update: {
          score: nextScore,
          // Never downgrade after a completion (replay uses scenario_attempts + mastery helpers).
          status: prev?.status === 'completed' ? 'completed' : status,
        },
      })

      const userUpdate: { totalScore?: { increment: number }; streak?: { increment: number } } = {}
      if (delta > 0) userUpdate.totalScore = { increment: delta }
      if (firstCompletion) userUpdate.streak = { increment: 1 }

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({
          where: { id: userId },
          data: userUpdate,
        })
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { totalScore: true, streak: true },
      })

      return { totalScore: user?.totalScore ?? 0, streak: user?.streak ?? 0, scenarioBest: nextScore }
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error('scenario-progress:', e)
    return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 })
  }
}
