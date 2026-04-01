import type { SavedVocabTerm } from '@/src/types/medicalTerm'
import { lookupMedicalTerm } from '@/src/lib/medicalTerms'

export const STORAGE_KEY_V2 = 'savedVocab_v2'
export const STORAGE_KEY_V1 = 'savedVocab_v1'

export type VocabStats = {
  totalSaved: number
  mastered: number
  lastQuizAt?: string
  quizAttempts?: number
}

export type VocabStorageV2 = {
  version: 2
  saved: SavedVocabTerm[]
  stats: VocabStats
}

function normalizeKey(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?'"()[\]]/g, '')
    .trim()
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `sv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function loadVocabStorage(): VocabStorageV2 {
  if (typeof window === 'undefined') {
    return { version: 2, saved: [], stats: { totalSaved: 0, mastered: 0 } }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2)
    if (raw) {
      const parsed = JSON.parse(raw) as VocabStorageV2
      if (parsed.version === 2 && Array.isArray(parsed.saved)) {
        return {
          ...parsed,
          stats: parsed.stats ?? { totalSaved: parsed.saved.length, mastered: parsed.saved.filter((s) => s.mastered).length },
        }
      }
    }
    const migrated = migrateV1IfPresent()
    if (migrated) return migrated
  } catch {
    /* ignore */
  }
  return { version: 2, saved: [], stats: { totalSaved: 0, mastered: 0 } }
}

function migrateV1IfPresent(): VocabStorageV2 | null {
  try {
    const v1 = localStorage.getItem(STORAGE_KEY_V1)
    if (!v1) return null
    const obj = JSON.parse(v1) as Record<string, unknown>
    const saved: SavedVocabTerm[] = []
    const seenTermIds = new Set<string>()

    for (const [, raw] of Object.entries(obj)) {
      const entry = raw as { term?: string; savedAt?: number }
      if (!entry?.term) continue
      const m = lookupMedicalTerm(entry.term)
      if (!m) continue
      if (seenTermIds.has(m.id)) continue
      seenTermIds.add(m.id)
      saved.push({
        id: randomId(),
        termId: m.id,
        savedAt: typeof entry.savedAt === 'number' ? new Date(entry.savedAt).toISOString() : new Date().toISOString(),
        mastered: false,
      })
    }

    if (saved.length === 0) return null

    const root: VocabStorageV2 = {
      version: 2,
      saved,
      stats: {
        totalSaved: saved.length,
        mastered: 0,
      },
    }
    persistVocabStorage(root)
    return root
  } catch {
    return null
  }
}

export function persistVocabStorage(data: VocabStorageV2): void {
  if (typeof window === 'undefined') return
  const stats: VocabStats = {
    ...data.stats,
    totalSaved: data.saved.length,
    mastered: data.saved.filter((s) => s.mastered).length,
  }
  localStorage.setItem(STORAGE_KEY_V2, JSON.stringify({ ...data, stats }))
}

export function upsertSavedTerm(
  data: VocabStorageV2,
  termId: string,
  options?: { mastered?: boolean }
): { data: VocabStorageV2; created: boolean } {
  const existing = data.saved.find((s) => s.termId === termId)
  if (existing) {
    const mastered = options?.mastered ?? existing.mastered
    const next = {
      ...data,
      saved: data.saved.map((s) => (s.termId === termId ? { ...s, mastered } : s)),
    }
    return { data: next, created: false }
  }
  const row: SavedVocabTerm = {
    id: randomId(),
    termId,
    savedAt: new Date().toISOString(),
    mastered: options?.mastered ?? false,
  }
  return {
    data: { ...data, saved: [...data.saved, row] },
    created: true,
  }
}

export function removeSavedTerm(data: VocabStorageV2, savedId: string): VocabStorageV2 {
  return { ...data, saved: data.saved.filter((s) => s.id !== savedId) }
}

export function toggleMastered(data: VocabStorageV2, savedId: string): VocabStorageV2 {
  return {
    ...data,
    saved: data.saved.map((s) => (s.id === savedId ? { ...s, mastered: !s.mastered } : s)),
  }
}

/** Map legacy V1 explanation objects to v2 if possible (used when importing old saves). */
export function legacyExplanationToTermId(explanation: {
  term: string
}): string | null {
  const m = lookupMedicalTerm(explanation.term)
  return m?.id ?? null
}
