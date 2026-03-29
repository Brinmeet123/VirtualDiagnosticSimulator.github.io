import { NextRequest, NextResponse } from 'next/server'
import { scenarios } from '@/data/scenarios'
import { resolveTest, calculateTestScore } from '@/lib/testEngine'
import { resolveDx, calculateDxScore, calculateFinalDxScore, calculateEfficiencyPenalty, checkMissingMustNotMiss } from '@/lib/dxEngine'
import { diagnosisCatalog } from '@/data/diagnosisCatalog'
import { getMockAssessment } from '@/lib/mockResponses'
import { callLLM } from '@/lib/llm'

const USE_DEMO_MOCKS = process.env.DEMO_MODE === 'true'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      scenarioId,
      stability,
      redFlagsFound,
      chiefComplaint,
      chat,
      hpi,
      background,
      problemRep,
      viewedExamSections,
      differentials,
      orderedTests,
      reasoningUpdates,
      finalDiagnosis,
      patientExplanation,
      plan,
      // New diagnosis system
      differentialDetailed,
      finalDxId,
      missingMustNotMiss,
      // Legacy fields for backward compatibility
      selectedDifferentialIds,
      finalDiagnosisId,
    } = body

    const scenario = scenarios.find(s => s.id === scenarioId)
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    // Get correct diagnosis - support both legacy and new systems
    let correctDiagnosisName = 'Unknown'
    if (scenario.finalDxId) {
      // New system: use finalDxId
      const correctDx = diagnosisCatalog.find(d => d.id === scenario.finalDxId)
      correctDiagnosisName = correctDx?.name || scenario.finalDxId
    } else if (scenario.diagnosisOptions) {
      // Legacy system: use diagnosisOptions
      const correctDiagnosis = scenario.diagnosisOptions.find(d => d.isCorrect)
      correctDiagnosisName = correctDiagnosis?.name || 'Unknown'
    }

    // Get selected final diagnosis - support both systems
    let selectedFinalDiagnosisName = 'None'
    if (finalDxId) {
      // New system
      const selectedDx = diagnosisCatalog.find(d => d.id === finalDxId)
      selectedFinalDiagnosisName = selectedDx?.name || finalDxId
    } else if (scenario.diagnosisOptions) {
      // Legacy system
      const selectedFinalDiagnosis = finalDiagnosis 
        ? scenario.diagnosisOptions.find(d => d.id === finalDiagnosis.diagnosisId)
        : scenario.diagnosisOptions.find(d => d.id === finalDiagnosisId)
      selectedFinalDiagnosisName = selectedFinalDiagnosis?.name || 'None'
    }

    if (USE_DEMO_MOCKS) {
      const mockAssessment = getMockAssessment()
      // Still calculate test and diagnosis scores from actual data
      let totalScore = 0
      const scoreBreakdown: Record<string, number> = {}

      if (orderedTests && orderedTests.length > 0) {
        const testScore = orderedTests.reduce((sum: number, testId: string) => {
          try {
            const resolved = resolveTest(scenario, testId)
            return sum + calculateTestScore(resolved.yield)
          } catch {
            return sum
          }
        }, 0)
        scoreBreakdown.tests = testScore
        totalScore += testScore
      }

      if (differentialDetailed && differentialDetailed.length > 0) {
        const dxScore = differentialDetailed.reduce((sum: number, item: any) => {
          try {
            const resolved = resolveDx(scenario, item.dxId)
            return sum + calculateDxScore(resolved.yield)
          } catch {
            return sum
          }
        }, 0)
        const finalScore = calculateFinalDxScore(finalDxId, scenario.finalDxId)
        const efficiencyPenalty = calculateEfficiencyPenalty(differentialDetailed.length)
        const missing = checkMissingMustNotMiss(
          differentialDetailed.map((d: any) => d.dxId),
          scenario.requiredMustNotMiss
        )
        const missingPenalty = missing.length * -3
        scoreBreakdown.diagnosis = dxScore + finalScore + efficiencyPenalty + missingPenalty
        totalScore += scoreBreakdown.diagnosis
      }

      const maxScore = 45
      const scorePercentage = Math.max(0, Math.min(100, Math.round((totalScore / maxScore) * 100)))

      return NextResponse.json({
        ...mockAssessment,
        totalScore,
        totalScorePercentage: scorePercentage,
        maxScore,
        scoreBreakdown
      })
    }

    const systemPrompt = `You are an instructor in a fictional diagnostic reasoning simulator for students.
You will be given comprehensive workflow data from a 12-step diagnostic process:
- Safety check and triage
- Chief complaint and history (HPI with OPQRST)
- Medical background
- Problem representation
- Physical exam findings
- Differential diagnosis (categorized)
- Test selection
- Clinical reasoning updates
- Final diagnosis with confidence
- Patient communication
- Plan and disposition

Your job is to give a structured, supportive educational assessment with scores (0-5) for each category.
Do NOT give real-world medical advice. Do NOT tell the user what they personally should do in real life.
Focus only on how well they handled this fictional case.

Output your assessment as a JSON object with this exact structure:
{
  "overallRating": "Excellent" | "Good" | "Needs Improvement" | "Poor",
  "summary": "A short paragraph summarizing their overall performance.",
  "strengths": ["item1", "item2", "item3"],
  "areasForImprovement": ["item1", "item2", "item3"],
  "diagnosisFeedback": "Detailed comment on: (1) Whether the DDx included must-not-miss diagnoses (if missing, note the penalty), (2) Whether ranking made sense (most likely first), (3) Whether final diagnosis aligns with key data, (4) If user 'shotgunned' too many irrelevant diagnoses (efficiency penalty), (5) Quality of reasoning notes (if provided).",
  "missedKeyHistoryPoints": ["item1", "item2"],
  "testSelectionFeedback": "Detailed comment on: (1) High-yield tests they chose correctly, (2) Unnecessary/inappropriate tests ordered, (3) Critical tests they missed (if any), (4) Overall efficiency vs shotgun ordering approach.",
  "sectionRatings": {
    "history": "Excellent" | "Good" | "Needs Improvement" | "Poor",
    "exam": "Excellent" | "Good" | "Needs Improvement" | "Poor",
    "tests": "Excellent" | "Good" | "Needs Improvement" | "Poor",
    "diagnosis": "Excellent" | "Good" | "Needs Improvement" | "Poor",
    "communication": "Excellent" | "Good" | "Needs Improvement" | "Poor"
  },
  "totalScore": number,
  "scoreBreakdown": {
    "history": number,
    "exam": number,
    "tests": number,
    "diagnosis": number,
    "communication": number
  }
}

Be constructive and educational. Point out what they did well and what they could improve.`

    const userPrompt = `SCENARIO: ${scenario.title}
Description: ${scenario.description}

PATIENT:
Name: ${scenario.patientPersona.name}, Age: ${scenario.patientPersona.age}, Gender: ${scenario.patientPersona.gender}
Chief Complaint: ${scenario.patientPersona.chiefComplaint}
Background: ${scenario.patientPersona.background}
Vital Signs: HR ${scenario.patientPersona.vitals.heartRate} bpm, BP ${scenario.patientPersona.vitals.bloodPressure}, RR ${scenario.patientPersona.vitals.respiratoryRate}/min, O2 Sat ${scenario.patientPersona.vitals.oxygenSat}, Temp ${scenario.patientPersona.vitals.temperature}

KEY HISTORY POINTS (that a good doctor should find):
${scenario.patientPersona.keyHistoryPoints.map(p => `- ${p}`).join('\n')}

RED FLAGS:
${scenario.patientPersona.redFlags.map(f => `- ${f}`).join('\n')}

CORRECT DIAGNOSIS: ${correctDiagnosisName}
${scenario.diagnosisOptions ? scenario.diagnosisOptions.map(d => `- ${d.name} (${d.isCorrect ? 'CORRECT' : 'incorrect'}, ${d.isDangerous ? 'DANGEROUS' : 'not dangerous'}): ${d.explanation}`).join('\n') : scenario.dxOverrides ? scenario.dxOverrides.map(d => {
  const dx = diagnosisCatalog.find(c => c.id === d.dxId)
  return `- ${dx?.name || d.dxId} (${d.yield === 'correct' ? 'CORRECT' : d.yield === 'dangerous-miss' ? 'DANGEROUS' : 'incorrect'}): ${d.explanation}`
}).join('\n') : 'No diagnosis options defined'}

STUDENT'S PERFORMANCE:

Step 0 - Safety Check:
Stability Assessment: ${stability || 'Not completed'}
Red Flags Identified: ${redFlagsFound?.join(', ') || 'None'}

Step 1 - Chief Complaint:
${chiefComplaint || 'Not recorded'}

Step 2 - History (HPI):
${hpi ? `Onset: ${hpi.onset || 'Not asked'}
Provocation: ${hpi.provocation || 'Not asked'}
Quality: ${hpi.quality || 'Not asked'}
Radiation: ${hpi.radiation || 'Not asked'}
Severity: ${hpi.severity !== undefined ? hpi.severity + '/10' : 'Not asked'}
Timing: ${hpi.timing || 'Not asked'}
Associated Symptoms: ${hpi.associatedSymptoms?.join(', ') || 'None'}
Pertinent Positives: ${hpi.pertinentPositives?.join(', ') || 'None'}
Pertinent Negatives: ${hpi.pertinentNegatives?.join(', ') || 'None'}` : 'Not completed'}

Chat Transcript:
${chat?.map((m: { role: string; content: string }) => `${m.role === 'doctor' ? 'Doctor' : 'Patient'}: ${m.content}`).join('\n') || 'No conversation'}

Step 3 - Medical Background:
${background ? `PMH: ${background.pastMedicalHistory?.join(', ') || 'None'}
Meds: ${background.medications?.join(', ') || 'None'}
Allergies: ${background.allergies?.map((a: { allergen: string; reaction: string }) => `${a.allergen} (${a.reaction})`).join(', ') || 'None'}
Family History: ${background.familyHistory?.join(', ') || 'None'}
Social: ${JSON.stringify(background.socialHistory || {})}` : 'Not completed'}

Step 4 - Problem Representation:
${problemRep?.summary || 'Not completed'}

Step 5 - Physical Exam:
Exam Sections Viewed: ${viewedExamSections?.join(', ') || 'None'}

Step 6 - Differential Diagnosis:
${differentialDetailed ? differentialDetailed.map((item: any) => {
  try {
    const dx = diagnosisCatalog.find(d => d.id === item.dxId)
    return `#${item.rank} ${dx?.name || item.dxId} (${item.confidence} confidence)${item.note ? ` - Note: ${item.note}` : ''}`
  } catch {
    return `#${item.rank} ${item.dxId} (Error resolving)`
  }
}).join('\n') : differentials?.map((d: any) => `- ${d.name} (${d.category}): ${d.reasoning || 'No reasoning'}`).join('\n') || selectedDifferentialIds?.map((id: string) => {
  const opt = scenario.diagnosisOptions?.find(o => o.id === id)
  return opt ? `- ${opt.name}` : ''
}).join('\n') || 'None'}

${missingMustNotMiss && missingMustNotMiss.length > 0 ? `⚠️ MISSING MUST-NOT-MISS DIAGNOSES: ${missingMustNotMiss.join(', ')} - Penalty applies` : ''}
${differentialDetailed ? `Efficiency: ${differentialDetailed.length} diagnoses${differentialDetailed.length > 6 ? ' (over recommended limit, efficiency penalty applies)' : ''}` : ''}

Step 7 - Tests:
Tests Ordered: ${orderedTests?.join(', ') || 'None'}
${orderedTests && orderedTests.length > 0 ? `
Test Details:
${orderedTests.map((testId: string) => {
  try {
    const resolved = resolveTest(scenario, testId)
    return `- ${resolved.test.name}: ${resolved.yield} yield, Result: ${resolved.result}`
  } catch {
    return `- ${testId}: Error resolving test`
  }
}).join('\n')}
` : ''}

Step 8 - Clinical Reasoning:
${reasoningUpdates?.map((u: any) => {
  if (scenario.diagnosisOptions) {
    const opt = scenario.diagnosisOptions.find(o => o.id === u.id)
    return `- ${opt?.name || u.id}: Moved ${u.moved} - ${u.reasoning}`
  } else {
    const dx = diagnosisCatalog.find(d => d.id === u.id)
    return `- ${dx?.name || u.id}: Moved ${u.moved} - ${u.reasoning}`
  }
}).join('\n') || 'No reasoning updates'}

Step 9 - Final Diagnosis:
Selected: ${finalDxId ? (() => {
  try {
    const dx = diagnosisCatalog.find(d => d.id === finalDxId)
    return dx?.name || finalDxId
  } catch {
    return finalDxId
  }
})() : selectedFinalDiagnosisName}
${finalDxId && scenario.finalDxId ? `Correct Answer: ${scenario.finalDxId === finalDxId ? '✓ CORRECT' : '✗ INCORRECT'}` : ''}
Confidence: ${finalDiagnosis?.confidence || (differentialDetailed?.find((d: any) => d.dxId === finalDxId)?.confidence) || 'Not specified'}
${finalDiagnosis?.confidence === 'Low' ? `Next Steps: ${finalDiagnosis.nextSteps || 'None'}` : ''}

Step 10 - Patient Communication:
Explanation: ${patientExplanation || 'Not provided'}

Step 11 - Plan & Disposition:
Disposition: ${plan?.disposition || 'Not selected'}
Plan: ${plan?.planDetails || 'Not provided'}
Consultations: ${plan?.consultations?.join(', ') || 'None'}
Monitoring: ${plan?.monitoring?.join(', ') || 'None'}

TEACHING POINTS:
${scenario.teachingPoints.map(p => `- ${p}`).join('\n')}

Provide your comprehensive assessment as JSON with scores for each category.`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    const responseText = await callLLM(messages)
    
    // Try to extract JSON from the response (model might wrap it in text)
    let assessmentText = responseText
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      assessmentText = jsonMatch[0]
    }
    
    const assessment = JSON.parse(assessmentText)

    // Calculate cumulative scores
    let totalScore = 0
    const scoreBreakdown: Record<string, number> = {}

    // Test scores
    if (orderedTests && orderedTests.length > 0) {
      const testScore = orderedTests.reduce((sum: number, testId: string) => {
        try {
          const resolved = resolveTest(scenario, testId)
          return sum + calculateTestScore(resolved.yield)
        } catch {
          return sum
        }
      }, 0)
      scoreBreakdown.tests = testScore
      totalScore += testScore
    }

    // Diagnosis scores
    if (differentialDetailed && differentialDetailed.length > 0) {
      const dxScore = differentialDetailed.reduce((sum: number, item: any) => {
        try {
          const resolved = resolveDx(scenario, item.dxId)
          return sum + calculateDxScore(resolved.yield)
        } catch {
          return sum
        }
      }, 0)
      
      // Final diagnosis score
      const finalScore = calculateFinalDxScore(finalDxId, scenario.finalDxId)
      
      // Efficiency penalty
      const efficiencyPenalty = calculateEfficiencyPenalty(differentialDetailed.length)
      
      // Missing must-not-miss penalty
      const missing = checkMissingMustNotMiss(
        differentialDetailed.map((d: any) => d.dxId),
        scenario.requiredMustNotMiss
      )
      const missingPenalty = missing.length * -3
      
      scoreBreakdown.diagnosis = dxScore + finalScore + efficiencyPenalty + missingPenalty
      totalScore += scoreBreakdown.diagnosis
    }

    // Calculate maximum possible score
    let maxScore = 0
    
    // Maximum test score: all high-yield tests (+2 each)
    if (scenario.testOverrides) {
      const highYieldTests = scenario.testOverrides.filter(t => t.yield === 'high')
      maxScore += highYieldTests.length * 2
    }
    
    // Maximum diagnosis score: optimal DDx (up to 6 correct diagnoses + final diagnosis)
    if (scenario.dxOverrides) {
      const correctDiagnoses = scenario.dxOverrides.filter(d => d.yield === 'correct')
      // Optimal: include all correct diagnoses, but limit to 6 for efficiency
      const optimalDxCount = Math.min(correctDiagnoses.length, 6)
      maxScore += optimalDxCount * 3  // +3 for each correct diagnosis
      maxScore += 5  // +5 for correct final diagnosis
      // No penalties in perfect scenario
    }
    
    // If maxScore is 0 (no overrides defined), use a default scale
    // Scale based on typical scenario: ~20 points for tests, ~25 points for diagnosis = 45 points
    if (maxScore === 0) {
      maxScore = 45
    }
    
    // Calculate percentage (clamp between 0 and 100)
    const scorePercentage = Math.max(0, Math.min(100, Math.round((totalScore / maxScore) * 100)))

    // Add scores to assessment
    assessment.totalScore = totalScore
    assessment.totalScorePercentage = scorePercentage
    assessment.maxScore = maxScore
    assessment.scoreBreakdown = scoreBreakdown

    return NextResponse.json(assessment)
  } catch (error: any) {
    console.error('Error in assess:', error)
    
    const shouldUseDemo =
      USE_DEMO_MOCKS || process.env.FALLBACK_TO_DEMO === 'true'

    if (
      shouldUseDemo &&
      (error?.message?.includes('fetch failed') ||
        error?.message?.includes('Ollama') ||
        error?.message?.includes('ECONNREFUSED'))
    ) {
      console.log('Ollama unavailable, falling back to demo mode')
      const mockAssessment = getMockAssessment()
      return NextResponse.json(mockAssessment)
    }

    const errorMessage = error?.message || 'Failed to generate assessment'
    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.message || 'Unknown error',
        demoModeAvailable:
          'Set DEMO_MODE=true for mocks, or fix Ollama (ollama serve, OLLAMA_BASE_URL, OLLAMA_MODEL).',
      },
      { status: 500 }
    )
  }
}
