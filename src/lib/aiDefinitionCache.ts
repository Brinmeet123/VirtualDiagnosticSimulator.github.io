import { normalizeLookupKey } from '@/src/lib/medicalTerms'
import type { MedicalTermLike } from '@/src/types/medicalTerm'

const STORAGE_KEY = 'aiVocabDefinitions_v1'

type CacheRoot = Record<string, MedicalTermLike>

function readRoot(): CacheRoot {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as CacheRoot
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeRoot(root: CacheRoot): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root))
  } catch {
    /* quota / private mode */
  }
}

export function cacheKeyForTerm(term: string): string {
  return normalizeLookupKey(term).toLowerCase()
}

export function getCachedAIDefinition(term: string): MedicalTermLike | null {
  const key = cacheKeyForTerm(term)
  const root = readRoot()
  const hit = root[key]
  if (hit && hit.isAIGenerated === true) return hit
  return null
}

export function setCachedAIDefinition(term: string, value: MedicalTermLike): void {
  const key = cacheKeyForTerm(term)
  const root = readRoot()
  root[key] = { ...value, isAIGenerated: true }
  writeRoot(root)
}
