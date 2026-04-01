import { callLLM } from '@/lib/llm'
import { shouldAttemptOllamaForPatientChat } from '@/lib/llm'
import type { DeterministicAssessment } from '@/types/debrief'

/**
 * Optional: rephrase existing debrief strings for smoother prose only.
 * Disabled by default (USE_LOCAL_LLM_DEBRIEF_POLISH).
 * Does not run when Ollama is not reachable (e.g. Vercel with localhost URL).
 */
export async function maybePolishDeterministicAssessment(
  assessment: DeterministicAssessment
): Promise<DeterministicAssessment> {
  if (process.env.USE_LOCAL_LLM_DEBRIEF_POLISH !== 'true') {
    return assessment
  }
  if (!shouldAttemptOllamaForPatientChat()) {
    return assessment
  }

  const d = assessment.debriefStructured
  const payload = {
    summary: d.summary,
    strengths: d.strengths,
    missedOpportunities: d.missedOpportunities,
    diagnosticReasoning: d.diagnosticReasoning,
    nextStepAdvice: d.nextStepAdvice,
    clinicalPearls: d.clinicalPearls,
    vocabToReview: d.vocabToReview,
  }

  const system = `You are an editor. You receive JSON with debrief strings from a medical simulator.
Rewrite values for clearer, more natural prose only.
Rules: Do NOT add new facts, diagnoses, or recommendations. Do NOT remove items from arrays—keep the same length for each array. Do not change vocabToReview terms (return them unchanged).
Output ONLY valid JSON with the same keys: summary (string), strengths (array), missedOpportunities (array), diagnosticReasoning (array), nextStepAdvice (array), clinicalPearls (array), vocabToReview (array).`

  try {
    const text = await callLLM([
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(payload) },
    ])
    const m = text.match(/\{[\s\S]*\}/)
    const jsonStr = m ? m[0] : text
    const parsed = JSON.parse(jsonStr) as typeof payload

    const polished: DeterministicAssessment = {
      ...assessment,
      summary: typeof parsed.summary === 'string' ? parsed.summary : assessment.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : assessment.strengths,
      areasForImprovement: Array.isArray(parsed.missedOpportunities)
        ? parsed.missedOpportunities
        : assessment.areasForImprovement,
      diagnosisFeedback: assessment.diagnosisFeedback,
      debriefStructured: {
        summary: typeof parsed.summary === 'string' ? parsed.summary : d.summary,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : d.strengths,
        missedOpportunities: Array.isArray(parsed.missedOpportunities)
          ? parsed.missedOpportunities
          : d.missedOpportunities,
        diagnosticReasoning: Array.isArray(parsed.diagnosticReasoning)
          ? parsed.diagnosticReasoning
          : d.diagnosticReasoning,
        nextStepAdvice: Array.isArray(parsed.nextStepAdvice) ? parsed.nextStepAdvice : d.nextStepAdvice,
        clinicalPearls: Array.isArray(parsed.clinicalPearls) ? parsed.clinicalPearls : d.clinicalPearls,
        vocabToReview: Array.isArray(parsed.vocabToReview) ? parsed.vocabToReview : d.vocabToReview,
      },
      source: 'deterministic-polished',
    }
    return polished
  } catch (e) {
    console.warn('Debrief polish skipped:', e)
    return assessment
  }
}
