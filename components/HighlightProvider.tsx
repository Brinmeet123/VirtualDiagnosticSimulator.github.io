'use client'

import SelectionVocabHandler from '@/components/vocab/SelectionVocabHandler'

type Props = {
  children: React.ReactNode
}

export default function HighlightProvider({ children }: Props) {
  return (
    <>
      {children}
      <SelectionVocabHandler />
    </>
  )
}
