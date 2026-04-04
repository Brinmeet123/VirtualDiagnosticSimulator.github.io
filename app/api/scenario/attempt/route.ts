import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bodySchema = z.object({
  attemptId: z.string().trim().min(1),
  scenarioId: z.string().trim().min(1).max(200),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  state: z.unknown().optional(),
})

export async function PATCH(req: Request) {
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

    const { attemptId, scenarioId, messages, state } = parsed.data
    const userId = session.user.id

    const attempt = await prisma.scenarioAttempt.findFirst({
      where: { id: attemptId, userId, scenarioId, status: 'in_progress' },
    })
    if (!attempt) {
      return NextResponse.json({ error: 'No active attempt.' }, { status: 404 })
    }

    await prisma.scenarioAttempt.update({
      where: { id: attemptId },
      data: {
        messages: messages !== undefined ? (messages as Prisma.InputJsonValue) : undefined,
        state: state !== undefined ? (state as Prisma.InputJsonValue) : undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('scenario/attempt:', e)
    return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 })
  }
}
