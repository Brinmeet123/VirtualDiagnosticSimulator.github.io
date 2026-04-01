import type { MedicalTerm, MedicalTermLike } from '@/src/types/medicalTerm'
import { cacheKeyForTerm } from '@/src/lib/aiDefinitionCache'

/** Stable id for the same highlighted phrase (localStorage saves). */
export function stableAItermId(normalizedKey: string): string {
  let h = 0
  for (let i = 0; i < normalizedKey.length; i++) {
    h = Math.imul(31, h) + normalizedKey.charCodeAt(i)
    h |= 0
  }
  return `ai:${Math.abs(h).toString(36)}`
}

export function medicalTermLikeToMedicalTerm(like: MedicalTermLike, normalizedKey: string): MedicalTerm {
  const nk = normalizedKey.trim().toLowerCase().replace(/\s+/g, ' ')
  return {
    id: stableAItermId(nk),
    term: like.term.trim(),
    normalizedTerm: nk,
    shortDefinition: like.shortDefinition,
    definition: like.definition,
    category: like.category,
    synonyms: [],
    relatedTerms: [],
    notes: 'AI-generated definition',
  }
}
