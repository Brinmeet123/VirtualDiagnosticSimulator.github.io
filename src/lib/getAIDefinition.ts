import type { MedicalTermLike } from '@/src/types/medicalTerm'
import { getCachedAIDefinition, setCachedAIDefinition } from '@/src/lib/aiDefinitionCache'

function offlineFallback(term: string): MedicalTermLike {
  const t = term.trim()
  return {
    term: t,
    shortDefinition: `Educational placeholder for “${t}” (offline / API unavailable).`,
    definition:
      'A full definition could not be loaded. Try again when the server is available, or add this term to the local vocabulary dataset.',
    category: 'general',
    isAIGenerated: true,
  }
}

export type GetAIDefinitionOptions = {
  signal?: AbortSignal
}

/**
 * Fetches an AI definition for a term not in the local dataset.
 * Uses localStorage cache first, then POST /api/vocab-ai-definition.
 */
export async function getAIDefinition(
  term: string,
  options?: GetAIDefinitionOptions
): Promise<MedicalTermLike> {
  const cached = getCachedAIDefinition(term)
  if (cached) return cached

  try {
    const res = await fetch('/api/vocab-ai-definition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term: term.trim() }),
      signal: options?.signal,
    })

    if (!res.ok) {
      return offlineFallback(term)
    }

    const data = (await res.json()) as MedicalTermLike & { error?: string }
    if (data.error || !data.shortDefinition) {
      return offlineFallback(term)
    }

    const normalized: MedicalTermLike = {
      term: data.term || term.trim(),
      shortDefinition: data.shortDefinition,
      definition: data.definition || data.shortDefinition,
      category: data.category || 'general',
      isAIGenerated: true,
    }
    setCachedAIDefinition(term, normalized)
    return normalized
  } catch (e: unknown) {
    if (options?.signal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
      throw e instanceof Error ? e : new DOMException('Aborted', 'AbortError')
    }
    return offlineFallback(term)
  }
}
