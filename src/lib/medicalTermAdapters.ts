import type { MedicalTerm } from '@/src/types/medicalTerm'

/** Legacy shape used by VocabText, quiz, and SummaryPanel. */
export type LegacyVocabTerm = {
  term: string
  display: string
  definitionSimple: string
  definitionClinical: string
  whyItMatters: string
  exampleSimple: string
  tags: string[]
  aliases?: string[]
}

function titleCasePhrase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

export function medicalTermToLegacyVocabTerm(m: MedicalTerm): LegacyVocabTerm {
  return {
    term: m.term,
    display: titleCasePhrase(m.term),
    definitionSimple: m.shortDefinition,
    definitionClinical: m.definition,
    whyItMatters: m.notes ?? `Common ${m.category.toLowerCase()} concept for clinical reasoning.`,
    exampleSimple: m.example ?? '',
    tags: [m.category, ...m.relatedTerms.slice(0, 3)],
    aliases: m.synonyms.length ? m.synonyms : undefined,
  }
}

/** Matches {@link import('@/lib/vocabEngine').VocabExplanation} — kept local to avoid circular imports. */
export function medicalTermToVocabExplanation(m: MedicalTerm) {
  return {
    term: m.term,
    definitionSimple: m.shortDefinition,
    definitionClinical: m.definition,
    whyItMatters: m.notes ?? `Relevant to ${m.category.toLowerCase()} learning scenarios.`,
    example: m.example ?? '',
    synonymsOrRelated: [...new Set([...m.synonyms, ...m.relatedTerms])].slice(0, 12),
    source: 'local' as const,
  }
}
