'use client'

import { useState, useRef, useEffect } from 'react'
import type { ClinicalSection } from '@/components/SectionNav'

const COPY: Record<ClinicalSection, { line: string; tips: string[] }> = {
  history: {
    line: 'Ask questions to understand the patient.',
    tips: ['Focus on symptoms first.', 'Use prompts or type your own questions.'],
  },
  exam: {
    line: 'Review findings and decide what matters.',
    tips: ['Open each system like at the bedside.', 'Note what changes your thinking.'],
  },
  tests: {
    line: 'Choose tests to confirm your thinking.',
    tips: ["Don't order every test.", 'You need at least one test before diagnosis.'],
  },
  diagnosis: {
    line: 'Enter your diagnosis.',
    tips: ['Rank your differential.', 'Pick one final answer you can defend.'],
  },
  debrief: {
    line: 'Review your report.',
    tips: ['Note strengths and gaps.', 'Try another case to practice more.'],
  },
}

export function getScenarioSectionGuidanceLine(section: ClinicalSection): string {
  return COPY[section].line
}

type Props = {
  section: ClinicalSection
  className?: string
}

export default function ScenarioSectionHeader({ section, className = '' }: Props) {
  const { line, tips } = COPY[section]
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    setOpen(false)
  }, [section])

  const showHints = tips.length > 0

  return (
    <div className={`mb-8 ${className}`} ref={wrapRef}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <div
          className="inline-flex max-w-3xl items-center justify-center rounded-2xl border border-primary-200/80 bg-gradient-to-br from-primary-50/90 to-slate-50 px-5 py-3 text-center shadow-sm ring-1 ring-primary-100/60"
          role="status"
        >
          <p className="text-sm font-semibold tracking-tight text-slate-800 sm:text-[0.9375rem] leading-snug">
            {line}
          </p>
        </div>
        {showHints && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-expanded={open}
              aria-label={open ? 'Hide hints' : 'Show hints'}
            >
              ?
            </button>
            {open && (
              <div
                role="tooltip"
                className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-xs text-slate-600 shadow-lg sm:left-auto sm:right-0 sm:translate-x-0 sm:w-60"
              >
                <ul className="space-y-1.5">
                  {tips.map((t, i) => (
                    <li key={i} className="leading-snug">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
