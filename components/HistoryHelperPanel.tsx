'use client'

import FocusPrompts from './FocusPrompts'
import HintMeter from './HintMeter'

type Message = {
  role: 'doctor' | 'patient'
  content: string
}

type Props = {
  onInsertQuestion: (question: string) => void
  messages?: Message[]
}

export default function HistoryHelperPanel({ onInsertQuestion, messages = [] }: Props) {
  return (
    <div className="h-full flex flex-col overflow-y-auto pr-2">
      <FocusPrompts onInsertQuestion={onInsertQuestion} />

      {messages.length > 0 && <HintMeter messages={messages} />}

      <div className="mt-auto pt-4 md:hidden">
        <div className="rounded-xl border border-sky-200 bg-sky-50/90 px-3 py-2.5 text-xs text-slate-700 leading-snug shadow-sm">
          💡 <span className="font-medium text-slate-900">Tip:</span> Start with symptoms, duration, and medical
          history.
        </div>
      </div>
    </div>
  )
}
