'use client'

export type ClinicalSection = 'history' | 'exam' | 'tests' | 'diagnosis' | 'debrief'

export const SECTION_ORDER: { id: ClinicalSection; label: string }[] = [
  { id: 'history', label: 'Interview' },
  { id: 'exam', label: 'Exam' },
  { id: 'tests', label: 'Tests' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'debrief', label: 'Results' },
]

export const SECTION_STEP_COUNT = SECTION_ORDER.length

export function clinicalSectionToStep(section: ClinicalSection): number {
  const i = SECTION_ORDER.findIndex((s) => s.id === section)
  return i < 0 ? 1 : i + 1
}

type Props = {
  active: ClinicalSection
  /** 1 = Interview … 5 = Results. Tabs with step > maxUnlockedStep are locked (with exceptions below). */
  maxUnlockedStep: number
  onChange: (section: ClinicalSection) => void
  canAccessDiagnosis: boolean
  canAccessDebrief: boolean
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M11.2 3.5L5.25 9.45L2.8 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function tabButtonClasses(opts: {
  isActive: boolean
  isCompleted: boolean
  isLocked: boolean
  isUnlockedAhead: boolean
}) {
  const { isActive, isCompleted, isLocked, isUnlockedAhead } = opts
  const base =
    'flex flex-1 min-w-0 min-h-[4rem] sm:min-h-[4.25rem] items-center justify-center border-r border-slate-200/90 last:border-r-0 transition-colors duration-300 ease-out'
  if (isLocked) {
    return `${base} bg-slate-100/95 text-slate-400 opacity-[0.72] cursor-not-allowed font-medium`
  }
  if (isActive) {
    return `${base} bg-primary-100 text-primary-900 font-bold cursor-pointer shadow-[inset_0_-4px_0_0] shadow-primary-600`
  }
  if (isCompleted) {
    return `${base} bg-emerald-50 text-emerald-900 font-semibold cursor-pointer hover:bg-emerald-100/90`
  }
  if (isUnlockedAhead) {
    return `${base} bg-slate-50 text-slate-600 font-medium cursor-pointer hover:bg-slate-100/90`
  }
  return `${base} bg-slate-50 text-slate-600 font-medium cursor-pointer hover:bg-slate-100/90`
}

export default function SectionNav({
  active,
  maxUnlockedStep,
  onChange,
  canAccessDiagnosis,
  canAccessDebrief,
}: Props) {
  const activeStep = clinicalSectionToStep(active)
  const clampedMax = Math.max(1, Math.min(SECTION_STEP_COUNT, maxUnlockedStep))

  const tabs = SECTION_ORDER.map((section, index) => {
      const step = index + 1
      const isActive = active === section.id
      const hardLockDiagnosis = section.id === 'diagnosis' && !canAccessDiagnosis
      const hardLockDebrief = section.id === 'debrief' && !canAccessDebrief
      const stepLock = step > clampedMax && !(section.id === 'debrief' && canAccessDebrief)
      const isLocked = hardLockDiagnosis || hardLockDebrief || stepLock
      const isCompleted = step < activeStep
      const isUnlockedAhead = !isLocked && !isActive && step > activeStep

      let lockTitle: string | undefined
      if (isLocked) {
        if (hardLockDiagnosis) lockTitle = 'Open the exam and order at least one test first.'
        else if (hardLockDebrief) lockTitle = 'Choose a final diagnosis to view results.'
        else lockTitle = 'Complete the previous step to unlock.'
      }

      return (
        <button
          key={section.id}
          type="button"
          onClick={() => !isLocked && onChange(section.id)}
          disabled={isLocked}
          className={['relative text-sm px-2 sm:px-4', tabButtonClasses({ isActive, isCompleted, isLocked, isUnlockedAhead })].join(
            ' '
          )}
          title={lockTitle}
        >
          <span className="inline-flex max-w-full items-center justify-center gap-1.5 truncate">
            {isCompleted && <CheckIcon className="shrink-0 text-emerald-600" />}
            <span className="truncate">{section.label}</span>
          </span>
        </button>
      )
    })

  return (
    <div
      className="sticky top-0 z-10 mb-6 w-screen max-w-[100vw] ml-[calc(50%-50vw)] border-b border-slate-200/90 bg-white shadow-sm"
      role="navigation"
      aria-label="Case steps"
    >
      <div className="flex w-full min-w-0 overflow-x-auto scrollbar-hide md:overflow-visible">
        {tabs}
      </div>
    </div>
  )
}
