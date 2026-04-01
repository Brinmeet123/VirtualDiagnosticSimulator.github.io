import type { MedicalTerm } from '@/src/types/medicalTerm'
import { MEDICAL_TERMS } from '@/src/data/medicalTerms'

/** Lowercase, trim, collapse spaces, strip trailing/leading punctuation (keeps internal hyphens). */
export function normalizeLookupKey(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  s = s.replace(/^['"([{]+/, '').replace(/['")\]}.,;:!?]+$/, '')
  return s.trim()
}

/** Stronger normalization for index keys (also strips internal punctuation except hyphen). */
export function normalizeForIndex(raw: string): string {
  return normalizeLookupKey(raw).replace(/[.,;:!?'"()[\]]/g, '')
}

function simplePluralVariants(s: string): string[] {
  const out = new Set<string>([s])
  if (s.length < 3) return [...out]
  if (s.endsWith('ies') && s.length > 3) {
    out.add(s.slice(0, -3) + 'y')
  }
  if (s.endsWith('es') && s.length > 2) {
    out.add(s.slice(0, -2))
    out.add(s.slice(0, -1))
  }
  if (s.endsWith('s') && !s.endsWith('ss')) {
    out.add(s.slice(0, -1))
  }
  if (!s.endsWith('s')) {
    out.add(s + 's')
    out.add(s + 'es')
  }
  return [...out]
}

type TermIndex = {
  byId: Map<string, MedicalTerm>
  byNormalized: Map<string, MedicalTerm>
  synonymToTerm: Map<string, MedicalTerm>
}

function buildIndex(terms: MedicalTerm[]): TermIndex {
  const byId = new Map<string, MedicalTerm>()
  const byNormalized = new Map<string, MedicalTerm>()
  const synonymToTerm = new Map<string, MedicalTerm>()

  for (const t of terms) {
    byId.set(t.id, t)
    byNormalized.set(normalizeForIndex(t.normalizedTerm), t)
    byNormalized.set(normalizeForIndex(t.term), t)

    const addSyn = (syn: string) => {
      const k = normalizeForIndex(syn)
      if (k.length) synonymToTerm.set(k, t)
      for (const v of simplePluralVariants(k)) {
        synonymToTerm.set(v, t)
      }
    }

    for (const syn of t.synonyms) {
      addSyn(syn)
    }
  }

  return { byId, byNormalized, synonymToTerm }
}

let cached: TermIndex | null = null

function getIndex(): TermIndex {
  if (!cached) {
    cached = buildIndex(MEDICAL_TERMS)
  }
  return cached
}

/** Reset index after hot reload in dev (tests). */
export function __resetMedicalTermIndexForTests(): void {
  cached = null
}

/**
 * Look up a medical term from user-selected text (phrase or word).
 * Uses exact/normalized match, synonyms, and simple singular/plural fallbacks.
 */
export function lookupMedicalTerm(selectedText: string): MedicalTerm | null {
  const raw = selectedText.trim()
  if (raw.length < 2) return null

  // Ignore punctuation-only
  if (!/[\p{L}\p{N}]/u.test(raw)) return null

  const idx = getIndex()
  const n = normalizeForIndex(raw)
  if (!n) return null

  const direct =
    idx.byNormalized.get(n) ||
    idx.synonymToTerm.get(n)
  if (direct) return direct

  for (const variant of simplePluralVariants(n)) {
    const hit = idx.byNormalized.get(variant) || idx.synonymToTerm.get(variant)
    if (hit) return hit
  }

  // Phrase: try matching any term whose normalized form is a substring (prefer longer)
  let best: MedicalTerm | null = null
  let bestLen = -1
  for (const t of MEDICAL_TERMS) {
    const tn = normalizeForIndex(t.term)
    if (tn.length >= 4 && (n === tn || n.includes(tn) || tn.includes(n))) {
      if (tn.length > bestLen) {
        best = t
        bestLen = tn.length
      }
    }
  }
  return best
}

export function getMedicalTermById(id: string): MedicalTerm | undefined {
  return getIndex().byId.get(id)
}

export { MEDICAL_TERMS }
