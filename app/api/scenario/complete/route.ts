import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scenarios } from '@/data/scenarios'
import { evaluatePerformance } from '@/lib/scoring'
import { z } from 'zod'

const bodySchema = z.object({
  scenarioId: z.string().trim().min(1).max(200),
  attemptId: z.string().trim().min(1),
  messages: z.array(z.object({ role: z.string(), content: z.string() })),
  finalDxId: z.string().nullable().optional(),
  viewedExamSections: z.array(z.string()).optional(),
  orderedTests: z.array(z.string()).optional(),
  differential: z
    .array(
      z.object({
        dxId: z.string(),
        rank: z.number().optional(),
        confidence: z.string().optional(),
        note: z.string().optional(),
      })
    )
    .optional(),
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

    const {
      scenarioId,
      attemptId,
      messages,
      finalDxId,
      viewedExamSections,
      orderedTests,
      differential,
    } = parsed.data

    const scenario = scenarios.find((s) => s.id === scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Unknown scenario.' }, { status: 404 })
    }

    const userId = session.user.id

    const evalResult = evaluatePerformance(messages, scenario, {
      finalDxId: finalDxId ?? null,
      viewedExamSections,
      orderedTestIds: orderedTests,
      differentialIds: differential?.map((d) => d.dxId) ?? [],
    })

    const outcome = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const attempt = await tx.scenarioAttempt.findFirst({
        where: { id: attemptId, userId, scenarioId, status: 'in_progress' },
      })
      if (!attempt) {
        return { error: 'attempt_not_found' as const }
      }

      const priorCompletedCount = await tx.scenarioAttempt.count({
        where: { userId, scenarioId, status: 'completed' },
      })

      await tx.scenarioAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'completed',
          score: evalResult.score,
          feedback: evalResult.feedback,
          rubric: evalResult.rubric as unknown as Prisma.InputJsonValue,
          messages: messages as Prisma.InputJsonValue,
        },
      })

      const progress = await tx.scenarioProgress.findUnique({
        where: { userId_scenarioId: { userId, scenarioId } },
      })

      const prevBest = progress?.score ?? 0
      const nextBest = Math.max(prevBest, evalResult.score)

      await tx.scenarioProgress.upsert({
        where: { userId_scenarioId: { userId, scenarioId } },
        create: {
          userId,
          scenarioId,
          status: 'completed',
          score: nextBest,
          activeAttemptId: null,
        },
        update: {
          status: 'completed',
          score: nextBest,
          activeAttemptId: null,
        },
      })

      const userUpdate: Prisma.UserUpdateInput = {
        totalScore: { increment: evalResult.score },
      }
      if (priorCompletedCount === 0) {
        userUpdate.streak = { increment: 1 }
      }

      await tx.user.update({
        where: { id: userId },
        data: userUpdate,
      })

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { totalScore: true, streak: true },
      })

      return {
        score: evalResult.score,
        feedback: evalResult.feedback,
        rubric: evalResult.rubric,
        level: evalResult.level,
        totalScore: user?.totalScore ?? 0,
        streak: user?.streak ?? 0,
        scenarioBest: nextBest,
      }
    })

    if ('error' in outcome && outcome.error === 'attempt_not_found') {
      return NextResponse.json(
        { error: 'Attempt not found or already completed.' },
        { status: 409 }
      )
    }

    return NextResponse.json(outcome)
  } catch (e) {
    console.error('scenario/complete:', e)
    return NextResponse.json({ error: 'Failed to complete scenario.' }, { status: 500 })
  }
}
