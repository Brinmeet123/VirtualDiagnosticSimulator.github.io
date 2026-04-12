'use client'

/** In-case flow: Interview → Exam → Tests → Diagnosis → Result */
export type SimulatorStep = 1 | 2 | 3 | 4 | 5

const STEPS: { step: SimulatorStep; label: string }[] = [
  { step: 1, label: 'Interview' },
  { step: 2, label: 'Exam' },
  { step: 3, label: 'Tests' },
  { step: 4, label: 'Diagnosis' },
  { step: 5, label: 'Result' },
]

type Props = {
  currentStep: SimulatorStep
  className?: string
}

export default function SimulatorProgressBar({ currentStep, className = '' }: Props) {
  return (
    <nav
      className={`w-full ${className}`}
      aria-label="Case progress"
    >
      <ol className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-xs sm:text-sm">
        {STEPS.map(({ step, label }, idx) => {
          const isCurrent = step === currentStep
          const isPast = step < currentStep
          return (
            <li key={step} className="flex items-center gap-x-1">
              {idx > 0 && (
                <span className="mx-0.5 text-slate-300 select-none" aria-hidden>
                  →
                </span>
              )}
              <span
                className={[
                  'rounded-md px-2 py-1 font-medium transition-colors',
                  isCurrent
                    ? 'bg-primary-100 text-primary-800 ring-1 ring-primary-200/80'
                    : isPast
                      ? 'text-slate-600'
                      : 'text-slate-400',
                ].join(' ')}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
