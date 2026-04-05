'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { MedicalTerm } from '@/src/types/medicalTerm'
import { lookupMedicalTerm, normalizeLookupKey } from '@/src/lib/medicalTerms'
import { getAIDefinition } from '@/src/lib/getAIDefinition'
import { medicalTermLikeToMedicalTerm } from '@/src/lib/aiTermToMedicalTerm'
import { getScrollableAncestors } from '@/src/lib/scrollAnchor'
import MedicalTermPopover from '@/components/vocab/MedicalTermPopover'
import { useVocabStore } from '@/lib/useVocabStore'

function isFormFieldFocused(): boolean {
  const el = document.activeElement
  if (!el || !(el instanceof HTMLElement)) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if (el.isContentEditable) return true
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'))
}

function isInsideInput(node: Node | null): boolean {
  if (!node) return false
  if (node.nodeType === Node.TEXT_NODE) {
    return isInsideInput(node.parentElement)
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as HTMLElement
    const tag = element.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
    if (element.isContentEditable) return true
    if (element.closest('input, textarea, select, [contenteditable="true"]')) return true
  }
  return false
}

function isSelectionTrivial(raw: string): boolean {
  const t = raw.trim()
  if (t.length < 2) return true
  if (t.length > 72) return true
  if (!/[\p{L}\p{N}]/u.test(t)) return true
  const letters = t.replace(/[\s\p{P}]/gu, '')
  if (letters.length < 2) return true
  return false
}

function isAIGeneratedTerm(term: MedicalTerm | null): boolean {
  if (!term) return false
  return term.id.startsWith('ai:')
}

export default function SelectionVocabHandler() {
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null)
  const [medicalTerm, setMedicalTerm] = useState<MedicalTerm | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rangeRef = useRef<Range | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const { saveMedicalTerm, hasTermId, isLoaded, canSave: sessionCanSave } = useVocabStore()
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleClose = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setSelectedText(null)
    setSelectionPosition(null)
    setMedicalTerm(null)
    setIsLoadingAI(false)
    setAiError(null)
    setSaveError(null)
    setIsSaving(false)
    rangeRef.current = null
    window.getSelection()?.removeAllRanges()
  }, [])

  const updatePositionFromRange = useCallback(() => {
    const r = rangeRef.current
    if (!r) return
    try {
      const rect = r.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        handleClose()
        return
      }
      const vh = window.innerHeight
      if (rect.bottom < -100 || rect.top > vh + 100) {
        handleClose()
        return
      }
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
    } catch {
      handleClose()
    }
  }, [handleClose])

  const handleSelection = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      if (isFormFieldFocused()) {
        return
      }

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        handleClose()
        return
      }

      const range = selection.getRangeAt(0)
      if (isInsideInput(range.commonAncestorContainer)) {
        handleClose()
        return
      }

      const raw = selection.toString()
      if (isSelectionTrivial(raw)) {
        handleClose()
        return
      }

      const trimmed = normalizeLookupKey(raw)
      abortRef.current?.abort()
      abortRef.current = null

      try {
        rangeRef.current = range.cloneRange()
      } catch {
        handleClose()
        return
      }

      const rect = range.getBoundingClientRect()
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top,
      })
      setSelectedText(trimmed)
      setAiError(null)

      const local = lookupMedicalTerm(trimmed)
      if (local) {
        setMedicalTerm(local)
        setIsLoadingAI(false)
        return
      }

      setMedicalTerm(null)
      setIsLoadingAI(true)
      const ac = new AbortController()
      abortRef.current = ac

      getAIDefinition(trimmed, { signal: ac.signal })
        .then((like) => {
          if (ac.signal.aborted) return
          const nk = trimmed.trim().toLowerCase().replace(/\s+/g, ' ')
          setMedicalTerm(medicalTermLikeToMedicalTerm(like, nk))
          setIsLoadingAI(false)
          setAiError(null)
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === 'AbortError') return
          setIsLoadingAI(false)
          setAiError(e instanceof Error ? e.message : 'Could not load definition.')
        })
    }, 280)
  }, [handleClose])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelection)
    return () => {
      document.removeEventListener('selectionchange', handleSelection)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [handleSelection])

  useEffect(() => {
    if (!selectedText || !rangeRef.current) return

    let raf = 0
    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => updatePositionFromRange())
    }

    const onScrollOrResize = () => schedule()

    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    window.visualViewport?.addEventListener('resize', onScrollOrResize)
    window.visualViewport?.addEventListener('scroll', onScrollOrResize)

    const scrollEls = getScrollableAncestors(rangeRef.current.commonAncestorContainer)
    scrollEls.forEach((el) => el.addEventListener('scroll', onScrollOrResize, { passive: true }))

    schedule()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      window.visualViewport?.removeEventListener('resize', onScrollOrResize)
      window.visualViewport?.removeEventListener('scroll', onScrollOrResize)
      scrollEls.forEach((el) => el.removeEventListener('scroll', onScrollOrResize))
    }
  }, [selectedText, updatePositionFromRange])

  const handleSave = async () => {
    if (!medicalTerm || !isLoaded || isLoadingAI) return
    setSaveError(null)
    setIsSaving(true)
    try {
      const ok = await saveMedicalTerm(medicalTerm)
      if (!ok) {
        setSaveError('Sign in to save vocabulary to your account.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!selectedText || !selectionPosition) return null

  const canSave = Boolean(medicalTerm) && !isLoadingAI && !aiError && sessionCanSave
  const saved = medicalTerm ? hasTermId(medicalTerm.id) : false
  const combinedError = saveError ?? aiError

  return (
    <MedicalTermPopover
      medicalTerm={medicalTerm}
      selectedText={selectedText}
      position={selectionPosition}
      onClose={handleClose}
      onSave={handleSave}
      isSaved={saved}
      isSaving={isSaving}
      canSave={canSave}
      isLoading={isLoadingAI}
      isAIGenerated={isAIGeneratedTerm(medicalTerm)}
      errorMessage={combinedError}
      authHint={!sessionCanSave && medicalTerm ? 'Sign in to save terms to your account.' : null}
    />
  )
}
