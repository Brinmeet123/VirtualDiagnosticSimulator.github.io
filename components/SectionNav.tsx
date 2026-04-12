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
  if (isLocked) {
    return 'border-transparent text-slate-400 opacity-[0.55] cursor-not-allowed font-medium'
  }
  if (isActive) {
    return 'border-primary-600 text-primary-700 font-bold cursor-pointer'
  }
  if (isCompleted) {
    return 'border-emerald-500 text-emerald-800 font-semibold cursor-pointer hover:text-emerald-900'
  }
  if (isUnlockedAhead) {
    return 'border-transparent text-slate-600 font-medium cursor-pointer hover:text-slate-900 hover:border-slate-300'
  }
  return 'border-transparent text-slate-600 font-medium cursor-pointer hover:text-slate-900 hover:border-slate-300'
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
  const progressMilestone = canAccessDebrief ? SECTION_STEP_COUNT : clampedMax
  const progressPercent = ((progressMilestone - 1) / (SECTION_STEP_COUNT - 1)) * 100

  const renderTab = (isDesktop: boolean) =>
    SECTION_ORDER.map((section, index) => {
      const step = index + 1
      const isActive = active === section.id
      const hardLockDiagnosis = section.id === 'diagnosis' && !canAccessDiagnosis
      const hardLockDebrief = section.id === 'debrief' && !canAccessDebrief
      const stepLock = step > clampedMax && !(section.id === 'debrief' && canAccessDebrief)
      const isLocked = hardLockDiagnosis || hardLockDebrief || stepLock
      const isCompleted = step < activeStep
      const isUnlockedAhead = !isLocked && !isActive && step > activeStep

      const padding = isDesktop ? 'px-6 py-4' : 'px-4 py-3 flex-shrink-0'

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
          className={[
            'relative text-sm transition-colors duration-300 ease-out border-b-[3px]',
            padding,
            tabButtonClasses({ isActive, isCompleted, isLocked, isUnlockedAhead }),
          ].join(' ')}
          title={lockTitle}
        >
          <span className="inline-flex items-center gap-1.5">
            {isCompleted && <CheckIcon className="shrink-0 text-emerald-600" />}
            {section.label}
          </span>
        </button>
      )
    })

  return (
    <div className="sticky top-0 z-10 mb-6 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="hidden md:flex">{renderTab(true)}</div>

        <div className="md:hidden">
          <div className="-mx-4 flex overflow-x-auto px-4 scrollbar-hide">{renderTab(false)}</div>
        </div>

        <div className="h-1 w-full bg-slate-200/90" aria-hidden>
          <div
            className="h-full bg-primary-600 transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
