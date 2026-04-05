'use client'

import { Scenario } from '@/data/scenarios'
import FocusPrompts from './FocusPrompts'
import SimpleQuestionBank from './SimpleQuestionBank'
import HintMeter from './HintMeter'

type Message = {
  role: 'doctor' | 'patient'
  content: string
}

type Props = {
  scenario: Scenario
  onInsertQuestion: (question: string) => void
  messages?: Message[]
}

export default function HistoryHelperPanel({ scenario, onInsertQuestion, messages = [] }: Props) {
  return (
    <div className="h-full flex flex-col overflow-y-auto pr-2">
      <FocusPrompts onInsertQuestion={onInsertQuestion} />

      {messages.length > 0 && <HintMeter scenario={scenario} messages={messages} />}

      <SimpleQuestionBank onInsertQuestion={onInsertQuestion} />
    </div>
  )
}
