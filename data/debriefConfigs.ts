import type { ScenarioDebriefConfig } from '@/types/debrief'

/**
 * Rule-based debrief configuration per scenario.
 * Tune copy and expectations here without changing engine code.
 */
export const DEBRIEF_CONFIGS: Record<string, ScenarioDebriefConfig> = {
  'chest-pain-er': {
    keyHistoryQuestions: [
      'onset timing and what patient was doing',
      'pain quality and location',
      'radiation to arm jaw or back',
      'associated shortness of breath sweating nausea',
      'cardiac risk factors and medications',
      'family history of heart disease',
    ],
    keyExamItems: ['general', 'cardiac', 'respiratory'],
    criticalTests: ['ecg', 'troponin'],
    unnecessaryTests: ['cbc'],
    mustRecognizeFindings: [
      'Exertional chest pressure with radiation',
      'ECG shows ST changes',
      'Troponin elevation',
    ],
    commonMisses: [
      'Not ordering ECG early in ACS workup',
      'Forgetting to ask about radiation or diaphoresis',
      'Omitting pulmonary embolism from must-not-miss differential',
    ],
    correctDiagnosisExplanation: [
      'STEMI fits exertional pressure-like pain with radiation, ECG ST elevations, and elevated troponin.',
      'This pattern requires urgent reperfusion-oriented care in real practice (simulation stops at diagnosis).',
    ],
    differentialComparison: [
      {
        diagnosis: 'GERD',
        whyLessLikely:
          'Typically meal-related or positional burning; does not explain exertional onset, ECG changes, and troponin.',
      },
      {
        diagnosis: 'Panic attack',
        whyLessLikely:
          'Can mimic chest discomfort, but exertional pressure with objective ECG and troponin abnormality points to ACS.',
      },
    ],
    clinicalPearls: [
      'Exertional chest pain with diaphoresis and radiation is ACS until proven otherwise.',
      'ECG and troponin are central to the initial evaluation of suspected ACS.',
    ],
    vocabTerms: ['troponin', 'STEMI', 'acute coronary syndrome', 'reperfusion'],
  },

  'sudden-headache-er': {
    keyHistoryQuestions: [
      'onset sudden vs gradual',
      'maximal intensity at onset thunderclap',
      'neck stiffness or meningismus',
      'photophobia or vision change',
      'focal neuro deficits',
      'trauma or anticoagulation',
    ],
    keyExamItems: ['general', 'neuro'],
    criticalTests: ['ct_head'],
    unnecessaryTests: ['cbc'],
    mustRecognizeFindings: [
      'Thunderclap headache maximal at onset',
      'CT shows subarachnoid blood',
    ],
    commonMisses: [
      'Treating thunderclap headache as migraine without imaging',
      'Not asking about neck stiffness or sudden maximal onset',
    ],
    correctDiagnosisExplanation: [
      'Subarachnoid hemorrhage is supported by thunderclap onset and blood on CT.',
      'Sudden worst headache of life is a neuroimaging emergency.',
    ],
    differentialComparison: [
      {
        diagnosis: 'Migraine',
        whyLessLikely:
          'Usually gradual build-up or prior similar episodes; thunderclap maximal-at-onset pattern is atypical.',
      },
    ],
    clinicalPearls: [
      'Thunderclap headache warrants urgent neuroimaging to exclude hemorrhage.',
      'CT non-contrast is first-line for suspected SAH; LP may follow if CT negative and suspicion remains high.',
    ],
    vocabTerms: ['thunderclap headache', 'subarachnoid hemorrhage', 'meningismus'],
  },

  'acute-sob-er': {
    keyHistoryQuestions: [
      'onset sudden vs gradual',
      'pleuritic vs non pleuritic pain',
      'recent travel immobilization surgery',
      'cough fever leg swelling',
      'past clot or bleeding risk',
    ],
    keyExamItems: ['respiratory', 'cardiac'],
    criticalTests: ['ct_chest'],
    unnecessaryTests: ['cbc'],
    mustRecognizeFindings: ['Hypoxia with acute dyspnea', 'CT shows pulmonary embolus'],
    commonMisses: [
      'Anchoring on pneumonia without PE risk factors',
      'Not linking recent travel to dyspnea',
    ],
    correctDiagnosisExplanation: [
      'PE explains acute dyspnea with risk factors and a filling defect on CTPA.',
    ],
    differentialComparison: [
      {
        diagnosis: 'Pneumonia',
        whyLessLikely:
          'Often has fever and focal lung findings; this case emphasizes embolic pattern on CT.',
      },
    ],
    clinicalPearls: [
      'Unexplained hypoxia and tachycardia with risk factors should raise PE suspicion.',
      'CT pulmonary angiography is diagnostic when suspicion is moderate to high.',
    ],
    vocabTerms: ['pulmonary embolism', 'CTPA', 'Wells score', 'D-dimer'],
  },

  'rlq-abdominal-pain': {
    keyHistoryQuestions: [
      'pain migration from periumbilical to RLQ',
      'anorexia nausea vomiting',
      'fever and bowel changes',
      'urinary symptoms',
      'prior abdominal surgery',
    ],
    keyExamItems: ['abdomen'],
    criticalTests: ['ct_abdomen'],
    unnecessaryTests: ['cbc'],
    mustRecognizeFindings: ['Migratory abdominal pain', 'RLQ tenderness on exam', 'CT appendix inflammation'],
    commonMisses: [
      'Missing migration history classic for appendicitis',
      'Delaying imaging when exam suggests surgical abdomen',
    ],
    correctDiagnosisExplanation: [
      'Appendicitis fits migratory pain, focal RLQ findings, and inflamed appendix on CT.',
    ],
    differentialComparison: [
      {
        diagnosis: 'Gastroenteritis',
        whyLessLikely:
          'Usually diffuse cramping with diarrhea; focal RLQ progression argues against isolated gastroenteritis.',
      },
    ],
    clinicalPearls: [
      'Periumbilical pain migrating to RLQ is a classic appendicitis story.',
      'CT abdomen/pelvis is highly useful when diagnosis is uncertain.',
    ],
    vocabTerms: ['appendicitis', 'McBurney point', 'rebound tenderness'],
  },

  'fever-confusion': {
    keyHistoryQuestions: [
      'time course of confusion',
      'fever rigors',
      'focal weakness speech vision',
      'urinary symptoms abdominal pain',
      'immune status and recent procedures',
    ],
    keyExamItems: ['general', 'neuro'],
    criticalTests: ['blood_culture', 'cmp'],
    unnecessaryTests: ['covid'],
    mustRecognizeFindings: ['Hypotension with fever', 'Altered mental status', 'Positive blood cultures'],
    commonMisses: [
      'Underestimating sepsis in elderly with altered mental status',
      'Not checking perfusion and lactate early',
    ],
    correctDiagnosisExplanation: [
      'Sepsis is supported by fever, hypotension, altered mental status, and positive cultures.',
    ],
    differentialComparison: [
      {
        diagnosis: 'Stroke',
        whyLessLikely:
          'Fever and infection markers point to systemic infection; focal deficits may be absent early.',
      },
    ],
    clinicalPearls: [
      'Altered mental status plus infection signs should prompt sepsis evaluation.',
      'Early recognition and source control improve outcomes.',
    ],
    vocabTerms: ['sepsis', 'SIRS', 'qSOFA', 'lactate'],
  },
}

export function getDebriefConfigForScenario(scenarioId: string): ScenarioDebriefConfig | null {
  return DEBRIEF_CONFIGS[scenarioId] ?? null
}
