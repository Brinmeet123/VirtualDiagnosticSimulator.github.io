import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { scoreToLevel } from '@/lib/scoring'
import { scenarios } from '@/data/scenarios'

function performanceLevelFromCompleted(avgScore: number, completedCount: number): string {
  if (completedCount === 0) return 'Building foundation'
  return scoreToLevel(avgScore)
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/dashboard')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: { select: { vocab: true } },
    },
  })

  const allProgress = await prisma.scenarioProgress.findMany({
    where: { userId: session.user.id },
    select: { scenarioId: true, status: true, score: true },
  })
  const progressById = new Map(allProgress.map((p) => [p.scenarioId, p]))
  const completedRows = allProgress.filter((p) => p.status === 'completed' && p.score != null)
  const scenariosCompleted = completedRows.length
  const avgScore =
    scenariosCompleted > 0
      ? completedRows.reduce((acc, r) => acc + (r.score ?? 0), 0) / scenariosCompleted
      : 0

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-slate-600">User profile not found.</p>
        <Link href="/login" className="text-teal-700 hover:underline mt-4 inline-block">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Your dashboard</h1>
      <p className="text-slate-600 mb-8">Overview of your progress in the Virtual Diagnostic Simulator.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-teal-800 uppercase tracking-wide mb-4">Profile</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="text-slate-900 font-medium">{user.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Username</dt>
              <dd className="text-slate-900 font-medium">@{user.username}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="text-slate-900 font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email updates</dt>
              <dd className="text-slate-900 font-medium">{user.subscribed ? 'Subscribed' : 'Opted out'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-teal-800 uppercase tracking-wide mb-4">Performance</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Total score</dt>
              <dd className="text-3xl font-bold text-slate-900">{user.totalScore}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Performance level</dt>
              <dd className="text-slate-900 font-medium">
                {performanceLevelFromCompleted(avgScore, scenariosCompleted)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Scenarios completed</dt>
              <dd className="text-slate-900 font-medium">{scenariosCompleted}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Saved vocabulary</dt>
              <dd className="text-slate-900 font-medium">{user._count.vocab} terms</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-teal-800 uppercase tracking-wide mb-4">Scenario progress</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {scenarios.map((s) => {
            const p = progressById.get(s.id)
            let label = '⚪ Not started'
            let detail = ''
            if (p?.status === 'in_progress') {
              label = '🟡 In progress'
              detail = p.score != null ? `Best score ${p.score}` : ''
            } else if (p?.status === 'completed') {
              label = '✅ Completed'
              detail = p.score != null ? `Best ${p.score}` : ''
            }
            return (
              <Link
                key={s.id}
                href={`/scenarios/${s.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 transition text-sm"
              >
                <span className="font-medium text-slate-900">{s.title}</span>
                <span className="shrink-0 text-slate-600 tabular-nums">
                  <span className="mr-2">{label}</span>
                  {detail ? <span className="text-slate-500">{detail}</span> : null}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/scenarios"
          className="inline-flex items-center rounded-lg bg-teal-700 text-white px-5 py-2.5 text-sm font-semibold hover:bg-teal-800 transition"
        >
          Practice scenarios
        </Link>
        <Link href="/vocab" className="inline-flex items-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition">
          My vocabulary
        </Link>
      </div>
    </div>
  )
}
