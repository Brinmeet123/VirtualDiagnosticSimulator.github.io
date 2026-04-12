import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-sm font-semibold text-primary-700 mb-2">What this is</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-3">About the simulator</h1>
      <p className="text-lg text-slate-700 mb-6">A safe place to practice clinical thinking — no real patients, no grades that follow you.</p>

      <div className="prose prose-lg max-w-none mb-8">
        <p className="text-gray-700 mb-4">
          The <strong>Virtual Diagnostic Simulator</strong> is a fictional case trainer: interview, exam, tests,
          diagnosis, then structured feedback. For learning only.
        </p>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Who it&apos;s for</h2>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li>Students exploring medicine</li>
          <li>Pre-med learners stacking clinical reps</li>
          <li>Anyone curious how workups are sequenced</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">What you do</h2>
        <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
          <li>History with a scripted patient</li>
          <li>Exam by system</li>
          <li>Tests from a catalog</li>
          <li>Differential and one final diagnosis</li>
          <li>Debrief tied to the rubric</li>
        </ul>

        <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Note</h2>
        <p className="text-gray-700 mb-4">
          Inspired by tools like Full Code and Body Interact; scenarios here are original and simplified for
          teaching.
        </p>

        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mt-8 mb-8">
          <h2 className="text-2xl font-bold text-red-900 mb-4">Disclaimer</h2>
          <div className="text-red-900 space-y-3">
            <p className="font-semibold">Educational use only. All cases and patients are fictional.</p>
            <p>
              Not medical advice. Not a substitute for licensed care. Don&apos;t use this to decide real
              treatment.
            </p>
            <p>For real symptoms or emergencies, see a qualified clinician.</p>
          </div>
        </div>

        <div className="mt-8 not-prose">
          <Link
            href="/scenarios"
            className="btn-press inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            Choose a case →
          </Link>
        </div>
      </div>
    </div>
  )
}
