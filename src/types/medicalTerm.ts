/**
 * Canonical medical term entry for the local vocabulary database.
 */
export type MedicalTerm = {
  id: string
  term: string
  normalizedTerm: string
  shortDefinition: string
  definition: string
  category: string
  synonyms: string[]
  relatedTerms: string[]
  example?: string
  pronunciation?: string
  notes?: string
}

/**
 * User-saved reference to a term in MEDICAL_TERMS (localStorage).
 */
export type SavedVocabTerm = {
  id: string
  termId: string
  savedAt: string
  mastered: boolean
}

/**
 * AI-generated definition payload (API + cache). Distinct from {@link MedicalTerm} for typing.
 */
export type MedicalTermLike = {
  term: string
  shortDefinition: string
  definition: string
  category: string
  isAIGenerated: true
}
