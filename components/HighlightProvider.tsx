'use client'

import SelectionVocabHandler from '@/components/vocab/SelectionVocabHandler'

type ViewMode = 'simple' | 'clinical'

type Props = {
  children: React.ReactNode
  viewMode?: ViewMode
}

let globalViewMode: ViewMode = 'simple'

export function setGlobalViewMode(mode: ViewMode) {
  globalViewMode = mode
}

export default function HighlightProvider({ children, viewMode }: Props) {
  const effectiveViewMode = viewMode ?? globalViewMode

  return (
    <>
      {children}
      <SelectionVocabHandler viewMode={effectiveViewMode} />
    </>
  )
}
