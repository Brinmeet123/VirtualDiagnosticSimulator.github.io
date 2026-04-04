import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scenarios } from '@/data/scenarios'
import { z } from 'zod'

const bodySchema = z.object({
  scenarioId: z.string().trim().min(1).max(200),
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

    const { scenarioId } = parsed.data
    if (!scenarios.some((s) => s.id === scenarioId)) {
      return NextResponse.json({ error: 'Unknown scenario.' }, { status: 404 })
    }

    const userId = session.user.id

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.scenarioProgress.findUnique({
        where: { userId_scenarioId: { userId, scenarioId } },
        include: { activeAttempt: true },
      })

      // Resume current session: active attempt is still in progress (replay keeps prior completed rows intact).
      if (
        existing?.activeAttemptId &&
        existing.activeAttempt?.status === 'in_progress'
      ) {
        const a = existing.activeAttempt
        return {
          attemptId: a.id,
          resume: true as const,
          messages: (a.messages as unknown) ?? null,
          state: (a.state as unknown) ?? null,
        }
      }

      const hasEverCompleted =
        (await tx.scenarioAttempt.count({
          where: { userId, scenarioId, status: 'completed' },
        })) > 0

      const attempt = await tx.scenarioAttempt.create({
        data: {
          userId,
          scenarioId,
          status: 'in_progress',
        },
      })

      await tx.scenarioProgress.upsert({
        where: { userId_scenarioId: { userId, scenarioId } },
        create: {
          userId,
          scenarioId,
          status: hasEverCompleted ? 'completed' : 'in_progress',
          score: existing?.score ?? null,
          activeAttemptId: attempt.id,
        },
        update: {
          activeAttemptId: attempt.id,
          // Once ANY attempt has completed, keep progress row as completed (replay adds new in_progress attempts only).
          status: hasEverCompleted ? 'completed' : 'in_progress',
        },
      })

      return {
        attemptId: attempt.id,
        resume: false as const,
        messages: null,
        state: null,
      }
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error('scenario/start:', e)
    return NextResponse.json({ error: 'Failed to start scenario.' }, { status: 500 })
  }
}
