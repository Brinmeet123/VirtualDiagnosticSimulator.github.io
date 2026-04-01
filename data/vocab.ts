import { MEDICAL_TERMS } from '@/src/data/medicalTerms'
import { lookupMedicalTerm } from '@/src/lib/medicalTerms'
import { medicalTermToLegacyVocabTerm, type LegacyVocabTerm } from '@/src/lib/medicalTermAdapters'

/** @deprecated Prefer {@link import('@/src/types/medicalTerm').MedicalTerm} for new code. */
export type VocabTerm = LegacyVocabTerm

export const vocab: VocabTerm[] = MEDICAL_TERMS.map(medicalTermToLegacyVocabTerm)

export function getVocabTerm(term: string): VocabTerm | undefined {
  const m = lookupMedicalTerm(term)
  return m ? medicalTermToLegacyVocabTerm(m) : undefined
}

export function findVocabTerms(text: string): VocabTerm[] {
  const lowerText = text.toLowerCase()
  const found: VocabTerm[] = []
  const seen = new Set<string>()

  for (const m of MEDICAL_TERMS) {
    const candidates = [m.term, ...m.synonyms].filter((c) => c.length >= 2)
    for (const c of candidates) {
      const esc = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(?:^|\\W)${esc}(?:$|\\W)`, 'i')
      if (re.test(lowerText) && !seen.has(m.id)) {
        seen.add(m.id)
        found.push(medicalTermToLegacyVocabTerm(m))
        break
      }
    }
  }

  return found
}
