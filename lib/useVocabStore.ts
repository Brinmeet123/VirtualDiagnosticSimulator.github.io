'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MedicalTerm } from '@/src/types/medicalTerm'
import { getMedicalTermById } from '@/src/lib/medicalTerms'
import {
  loadVocabStorage,
  persistVocabStorage,
  upsertSavedTerm,
  removeSavedTerm,
  toggleMastered,
  type VocabStorageV2,
} from '@/src/lib/vocabStorage'

export type EnrichedSavedTerm = {
  saved: import('@/src/types/medicalTerm').SavedVocabTerm
  term: MedicalTerm | null
}

export function useVocabStore() {
  const [data, setData] = useState<VocabStorageV2>(() => ({
    version: 2,
    saved: [],
    stats: { totalSaved: 0, mastered: 0 },
  }))
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setData(loadVocabStorage())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) {
      persistVocabStorage(data)
    }
  }, [data, isLoaded])

  const saveMedicalTerm = useCallback((term: MedicalTerm): boolean => {
    setData((prev) => {
      const { data: next } = upsertSavedTerm(prev, term.id)
      return next
    })
    return true
  }, [])

  const hasTermId = useCallback(
    (termId: string): boolean => {
      return data.saved.some((s) => s.termId === termId)
    },
    [data.saved]
  )

  const remove = useCallback((savedId: string) => {
    setData((prev) => removeSavedTerm(prev, savedId))
  }, [])

  const removeByTermId = useCallback((termId: string) => {
    setData((prev) => ({
      ...prev,
      saved: prev.saved.filter((s) => s.termId !== termId),
    }))
  }, [])

  const setMastered = useCallback((savedId: string) => {
    setData((prev) => toggleMastered(prev, savedId))
  }, [])

  const list = useCallback((): EnrichedSavedTerm[] => {
    return [...data.saved]
      .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
      .map((saved) => ({
        saved,
        term: getMedicalTermById(saved.termId) ?? null,
      }))
  }, [data.saved])

  const getByTermId = useCallback(
    (termId: string) => {
      return data.saved.find((s) => s.termId === termId)
    },
    [data.saved]
  )

  const updateStats = useCallback((patch: Partial<VocabStorageV2['stats']>) => {
    setData((prev) => ({
      ...prev,
      stats: { ...prev.stats, ...patch },
    }))
  }, [])

  const recordQuizComplete = useCallback(() => {
    setData((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        quizAttempts: (prev.stats.quizAttempts ?? 0) + 1,
        lastQuizAt: new Date().toISOString(),
      },
    }))
  }, [])

  return {
    saveMedicalTerm,
    hasTermId,
    remove,
    removeByTermId,
    setMastered,
    list,
    getByTermId,
    updateStats,
    recordQuizComplete,
    isLoaded,
    count: data.saved.length,
    masteredCount: data.saved.filter((s) => s.mastered).length,
    stats: data.stats,
  }
}
