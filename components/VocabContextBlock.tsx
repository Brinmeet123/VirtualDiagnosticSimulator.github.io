'use client'

import { ReactNode } from 'react'

type SourceType = 'chat' | 'exam' | 'tests' | 'diagnosis' | 'debrief' | 'scenario' | 'summary' | 'history'

type Props = {
  children: ReactNode
  source: SourceType
  scenarioId?: string
  text?: string
}

/**
 * Wraps text content to provide context for vocabulary highlighting
 * Stores context metadata in data attributes for the highlight system
 */
export default function VocabContextBlock({ children, source, scenarioId, text }: Props) {
  // If text is provided, use it; otherwise extract from children
  const blockText = text || (typeof children === 'string' ? children : '')

  return (
    <div
      data-vocab-source={source}
      data-vocab-scenario-id={scenarioId || ''}
      data-vocab-text={blockText}
      className="vocab-context-block"
    >
      {children}
    </div>
  )
}


