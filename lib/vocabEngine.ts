import { lookupMedicalTerm } from '@/src/lib/medicalTerms'
import { medicalTermToVocabExplanation } from '@/src/lib/medicalTermAdapters'

export type SourceType =
  | 'chat'
  | 'exam'
  | 'tests'
  | 'diagnosis'
  | 'debrief'
  | 'scenario'
  | 'summary'
  | 'history'


export type VocabContext = {
  selectedText: string
  contextText: string
  sourceType: SourceType
  scenarioMeta?: {
    scenarioTitle?: string
    chiefComplaint?: string
    specialty?: string
  }
}

export type VocabExplanation = {
  term: string
  definitionSimple: string
  definitionClinical: string
  whyItMatters: string
  whyItMattersHere?: string
  example: string
  exampleFromContext?: string
  synonymsOrRelated?: string[]
  source: 'local' | 'ai'
}

/**
 * Resolve selected text against the local medical vocabulary only (no network calls).
 */
export async function resolveVocab(
  term: string,
  _viewMode: 'simple' | 'clinical',
  _context?: VocabContext
): Promise<VocabExplanation | null> {
  const trimmedTerm = term.trim()
  const m = lookupMedicalTerm(trimmedTerm)
  if (!m) return null
  return medicalTermToVocabExplanation(m)
}
