'use client'

import { useState, useMemo } from 'react'
import { vocab, VocabTerm } from '@/data/vocab'
import { lookupMedicalTerm } from '@/src/lib/medicalTerms'
import { useVocabStore } from '@/lib/useVocabStore'

type Props = {
  text: string
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
}

type VocabMatch = {
  term: VocabTerm
  startIndex: number
  endIndex: number
}

export default function VocabText({ text, onTermClick, onTermSave }: Props) {
  const [selectedTerm, setSelectedTerm] = useState<VocabTerm | null>(null)
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const { saveMedicalTerm } = useVocabStore()

  // Find all vocab terms in the text (prefer longer multi-word matches first)
  const matches = useMemo(() => {
    const found: VocabMatch[] = []
    const lowerText = text.toLowerCase()
    const ordered = [...vocab].sort((a, b) => b.term.length - a.term.length)

    ordered.forEach(term => {
      const termLower = term.term.toLowerCase()
      const escaped = termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${escaped})(?=[^\\p{L}\\p{N}]|$)`, 'giu')
      let match

      while ((match = regex.exec(lowerText)) !== null) {
        const g1 = match[1]
        if (!g1) continue
        const start = match.index + match[0].indexOf(g1)
        const end = start + g1.length
        const overlaps = found.some(
          (m) =>
            (start >= m.startIndex && start < m.endIndex) ||
            (end > m.startIndex && end <= m.endIndex) ||
            (start <= m.startIndex && end >= m.endIndex)
        )

        if (!overlaps) {
          found.push({
            term,
            startIndex: start,
            endIndex: end,
          })
        }
      }
    })

    // Sort by start index
    return found.sort((a, b) => a.startIndex - b.startIndex)
  }, [text])

  const handleTermClick = (e: React.MouseEvent, term: VocabTerm) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })
    setSelectedTerm(term)
    
    if (onTermClick) {
      onTermClick(term.term)
    }
  }

  const handleSaveTerm = () => {
    if (selectedTerm && onTermSave) {
      onTermSave(selectedTerm.term)
    }
    if (selectedTerm) {
      const m = lookupMedicalTerm(selectedTerm.term)
      if (m) saveMedicalTerm(m)
    }
    setSelectedTerm(null)
    setPopoverPosition(null)
  }

  const handleClosePopover = () => {
    setSelectedTerm(null)
    setPopoverPosition(null)
  }

  // Build the text with highlighted terms
  const renderText = () => {
    if (matches.length === 0) {
      return <span>{text}</span>
    }

    const elements: React.ReactNode[] = []
    let lastIndex = 0

    matches.forEach((match, idx) => {
      // Add text before the match
      if (match.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {text.substring(lastIndex, match.startIndex)}
          </span>
        )
      }

      // Add the highlighted term
      const originalTerm = text.substring(match.startIndex, match.endIndex)
      elements.push(
        <button
          key={`term-${idx}`}
          onClick={(e) => handleTermClick(e, match.term)}
          className="underline decoration-2 decoration-primary-500 text-primary-700 hover:text-primary-900 hover:bg-primary-50 px-1 rounded transition cursor-pointer"
          title={`Click to learn about ${match.term.display}`}
        >
          {originalTerm}
        </button>
      )

      lastIndex = match.endIndex
    })

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-end">{text.substring(lastIndex)}</span>
      )
    }

    return <>{elements}</>
  }

  return (
    <>
      <span className="vocab-text">{renderText()}</span>
      
      {selectedTerm && popoverPosition && (
        <>
          {/* Backdrop to close popover */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleClosePopover}
          />
          
          {/* Popover */}
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border-2 border-primary-200 p-4 max-w-sm"
            style={{
              left: `${popoverPosition.x}px`,
              top: `${popoverPosition.y}px`,
              transform: 'translate(-50%, calc(-100% - 10px))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-lg text-primary-900">{selectedTerm.display}</h4>
              <button
                onClick={handleClosePopover}
                className="text-gray-400 hover:text-gray-600 ml-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Definition:</strong> {selectedTerm.definitionSimple}
              </p>
              
              <p className="text-sm text-gray-700 mb-2">
                <strong>Why it matters:</strong> {selectedTerm.whyItMatters}
              </p>
              
              <p className="text-xs text-gray-600 italic">
                Example: {selectedTerm.exampleSimple}
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSaveTerm}
                className="flex-1 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition text-sm font-medium flex items-center justify-center gap-1"
              >
                ⭐ Save to My Vocab
              </button>
            </div>
            
            {selectedTerm.tags.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex flex-wrap gap-1">
                  {selectedTerm.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}


