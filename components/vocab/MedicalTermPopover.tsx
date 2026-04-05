'use client'

import { useState, useEffect, useRef } from 'react'
import type { MedicalTerm } from '@/src/types/medicalTerm'

type Props = {
  medicalTerm: MedicalTerm | null
  selectedText: string
  position: { x: number; y: number } | null
  onClose: () => void
  onSave: () => void
  isSaved: boolean
  isSaving: boolean
  canSave: boolean
  isLoading?: boolean
  isAIGenerated?: boolean
  errorMessage?: string | null
  /** Shown when save is disabled because the user is not signed in */
  authHint?: string | null
}

export default function MedicalTermPopover({
  medicalTerm,
  selectedText,
  position,
  onClose,
  onSave,
  isSaved,
  isSaving,
  canSave,
  isLoading = false,
  isAIGenerated = false,
  errorMessage = null,
  authHint = null,
}: Props) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [moreDetails, setMoreDetails] = useState(false)

  useEffect(() => {
    setMoreDetails(false)
  }, [medicalTerm?.id, selectedText])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 80)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  if (!position) return null

  const heading = medicalTerm?.term ?? selectedText
  const shortDef = medicalTerm ? medicalTerm.shortDefinition : null
  const longDef = medicalTerm?.definition

  const getPosition = () => {
    const padding = 10
    let x = position.x
    let y = position.y - 10
    if (typeof window !== 'undefined') {
      const maxWidth = 340
      const maxHeight = 420
      if (x + maxWidth / 2 > window.innerWidth - padding) {
        x = window.innerWidth - maxWidth / 2 - padding
      }
      if (x - maxWidth / 2 < padding) {
        x = maxWidth / 2 + padding
      }
      if (y - maxHeight < padding) {
        y = position.y + 28
      }
    }
    return { x, y }
  }

  const pos = getPosition()

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border-2 border-primary-200 p-3 max-w-sm w-[min(100vw-24px,340px)]"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="min-w-0">
          <h4 className="font-bold text-base text-primary-900 leading-snug break-words">{heading}</h4>
          {medicalTerm && (
            <p className="text-[11px] uppercase tracking-wide text-primary-600 mt-0.5">{medicalTerm.category}</p>
          )}
          {isAIGenerated && !isLoading && (
            <p className="text-[11px] italic text-amber-800/90 mt-1">AI-generated definition</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {errorMessage && (
        <p className="text-sm text-red-700 mb-3" role="alert">
          {errorMessage}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 py-2">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
            aria-hidden
          />
          Looking up definition…
        </div>
      )}

      {!isLoading && !medicalTerm && !errorMessage && (
        <p className="text-sm text-gray-600 mb-3">No definition available for this selection.</p>
      )}

      {medicalTerm && shortDef && !isLoading && (
        <div className="mb-2 space-y-2">
          <p className="text-sm text-gray-900">{shortDef}</p>
          {longDef && longDef !== shortDef && (
            <div>
              <button
                type="button"
                onClick={() => setMoreDetails(!moreDetails)}
                className="text-xs font-medium text-primary-700 hover:text-primary-900"
              >
                {moreDetails ? '▼ Hide details' : '▶ More details'}
              </button>
              {moreDetails && (
                <p className="text-xs text-gray-700 mt-1 leading-relaxed border-t border-gray-100 pt-2">{longDef}</p>
              )}
            </div>
          )}
          {medicalTerm.relatedTerms.length > 0 && (
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-700">Related: </span>
              {medicalTerm.relatedTerms.join(', ')}
            </p>
          )}
          {medicalTerm.synonyms.length > 0 && (
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-600">Also called: </span>
              {medicalTerm.synonyms.join(', ')}
            </p>
          )}
        </div>
      )}

      {authHint && !isSaved && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mb-2">
          {authHint}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || isSaving || isSaved || isLoading}
          className={`flex-1 px-3 py-2 rounded transition text-sm font-medium flex items-center justify-center gap-1 ${
            isSaved
              ? 'bg-green-600 text-white cursor-default'
              : !canSave || isSaving || isLoading
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isSaving ? 'Saving…' : isSaved ? '✓ In My Vocab' : '⭐ Save to Vocab'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm"
        >
          Close
        </button>
      </div>
    </div>
  )
}
