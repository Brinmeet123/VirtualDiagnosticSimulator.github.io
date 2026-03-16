import { vocab, getVocabTerm } from '@/data/vocab'
import { getMockTermExplanation } from '@/lib/mockResponses'

export type SourceType = 'chat' | 'exam' | 'tests' | 'diagnosis' | 'debrief'

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
  whyItMattersHere?: string // Context-specific
  example: string
  exampleFromContext?: string // Context-specific
  synonymsOrRelated?: string[]
  source: 'local' | 'ai'
}

/**
 * Normalize a term for matching (trim, lowercase, collapse spaces, handle punctuation)
 */
function normalizeTerm(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .replace(/[.,;:!?]/g, '') // Remove punctuation
}

/**
 * Try to find a term in the vocab dictionary with various matching strategies
 */
function findVocabTerm(term: string): ReturnType<typeof getVocabTerm> | null {
  const normalized = normalizeTerm(term)
  
  // 1. Exact normalized match
  let found = getVocabTerm(normalized)
  if (found) return found
  
  // 2. Try original term (preserve case)
  found = getVocabTerm(term.trim().toLowerCase())
  if (found) return found
  
  // 3. Try singular/plural variations (basic)
  // For now, we'll rely on the dictionary having common variations
  // This could be enhanced with a proper pluralization library
  
  return null
}

/**
 * Resolves a vocabulary term with context, checking local dictionary first, then AI if not found
 */
export async function resolveVocab(
  term: string, 
  viewMode: 'simple' | 'clinical',
  context?: VocabContext
): Promise<VocabExplanation | null> {
  // Normalize term (preserve original for display)
  const trimmedTerm = term.trim()
  const normalizedTerm = normalizeTerm(trimmedTerm)
  
  // 1. Check local vocab dictionary first (with phrase-aware matching)
  const localTerm = findVocabTerm(trimmedTerm)
  if (localTerm) {
    const explanation: VocabExplanation = {
      term: localTerm.term,
      definitionSimple: localTerm.definitionSimple,
      definitionClinical: localTerm.definitionClinical,
      whyItMatters: localTerm.whyItMatters,
      example: localTerm.exampleSimple,
      source: 'local'
    }
    
    // If we have context, we can enhance with context-specific info
    // but for local terms, we'll keep it simple for now
    return explanation
  }
  
  // 2. If not found locally, try AI explanation with context
  try {
    const response = await fetch('/api/explain-term', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedText: trimmedTerm,
        contextText: context?.contextText || '',
        sourceType: context?.sourceType || 'chat',
        scenarioMeta: context?.scenarioMeta,
        viewMode
      })
    })
    
    if (!response.ok) {
      // Static hosting (e.g. GitHub Pages): use client-side mock
      return getMockTermExplanation(trimmedTerm, context?.contextText, viewMode)
    }
    
    const data = await response.json()
    return {
      term: data.term || trimmedTerm,
      definitionSimple: data.definitionSimple || '',
      definitionClinical: data.definitionClinical || '',
      whyItMatters: data.whyItMatters || '',
      whyItMattersHere: data.whyItMattersHere,
      example: data.example || '',
      exampleFromContext: data.exampleFromContext,
      synonymsOrRelated: data.synonymsOrRelated,
      source: 'ai'
    }
  } catch (error) {
    // Network error on static host: use mock
    return getMockTermExplanation(trimmedTerm, context?.contextText, viewMode)
  }
}

