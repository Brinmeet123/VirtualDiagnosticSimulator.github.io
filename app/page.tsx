import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-primary-50 via-white to-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-700 mb-3">Clinical simulation</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-5 text-balance">
            Virtual Diagnostic Simulator
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-3 max-w-2xl mx-auto leading-relaxed">
            Step into real-feel scenarios. Ask questions, analyze symptoms, and make the diagnosis.
          </p>
          <p className="text-sm text-slate-600 mb-10 max-w-xl mx-auto">
            You&apos;ll interview a patient, review the exam, order tests, commit to a diagnosis, then see structured
            feedback — same rhythm as the wards, none of the risk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <Link
              href="/scenarios"
              className="btn-press inline-flex items-center justify-center px-8 py-3.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-semibold text-lg shadow-md shadow-primary-600/20"
            >
              Start First Case →
            </Link>
            <Link
              href="/dashboard"
              className="btn-press inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 border-2 border-primary-200 rounded-xl hover:bg-primary-50 transition font-semibold text-lg"
            >
              View Progress
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Why use this</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: '🧠',
                title: 'Realistic Patient Cases',
                desc: 'Work through presentations that feel like the clinic — history, exam, data, then your call.',
              },
              {
                emoji: '📊',
                title: 'Instant Feedback & Scoring',
                desc: 'Get a debrief tied to what you asked, ordered, and concluded — not a generic quiz score.',
              },
              {
                emoji: '📈',
                title: 'Track Your Progress',
                desc: 'See completed runs and scores on your dashboard so you know where to drill next.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-center shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-3" aria-hidden>
                  {item.emoji}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How a case flows</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: '1', title: 'Interview', desc: 'Ask about symptoms and context.' },
              { step: '2', title: 'Exam', desc: 'Open each system and read findings.' },
              { step: '3', title: 'Tests', desc: 'Order what you need to narrow the list.' },
              { step: '4', title: 'Diagnosis', desc: 'Build a differential and pick one.' },
              { step: '5', title: 'Debrief', desc: 'See strengths, gaps, and teaching points.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Who it&apos;s for</h2>
          <p className="text-lg text-gray-700 mb-8">
            Built for <strong>high school</strong> and <strong>pre-med</strong> learners who want reps without the
            clinic — and anyone curious how workups are sequenced.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Orientation</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                See how an encounter is structured before you shadow or rotate.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reps</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Drill questions, data interpretation, and committing to a diagnosis under a little time pressure.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/about"
              className="btn-press text-primary-700 font-semibold hover:underline"
            >
              Learn more about the simulator
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
