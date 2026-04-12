/**
 * Mock responses for demo mode (DEMO_MODE=true) when Ollama is not used.
 * Strictly keyed by scenario id from data/scenarios.ts — no shared/global answer pools.
 */

export type MockIntentCategory =
  | 'symptom'
  | 'timing'
  | 'progression'
  | 'location'
  | 'radiation'
  | 'red_flags'
  | 'history'
  | 'meds'
  | 'greeting'
  | 'severity'
  | 'allergies'
  | 'family'
  | 'smoking'
  | 'alcohol'

/** Keyword hints per category (UI guided questions + common variants). */
export const categories = {
  symptom: ['feel', 'symptom', "what's wrong", 'feeling', 'tell me more', 'chief complaint'],
  timing: ['when', 'start', 'how long', 'onset'],
  progression: ['better', 'worse', 'change', 'what makes'],
  location: ['where', 'location', 'exactly'],
  radiation: ['anywhere else', 'spread', 'radiat', 'go anywhere', 'move anywhere'],
  red_flags: ['shortness of breath', 'nausea', 'sweating', 'sweat'],
  history: ['medical condition', 'conditions', 'history', 'health problems'],
  meds: ['medication', 'medicine', 'take anything', 'meds', 'prescription'],
} as const

type ScenarioResponseRow = {
  symptom: string
  timing: string
  progression: string
  location: string
  radiation: string
  red_flags: string
  history: string
  meds: string
  greeting?: string
  severity?: string
  allergies?: string
  family?: string
  smoking?: string
  alcohol?: string
}

const scenarioResponses: Record<string, ScenarioResponseRow> = {
  'chest-pain-er': {
    symptom: 'I feel a heavy pressure in my chest.',
    timing: 'It started about 30 minutes ago.',
    progression: "It's getting worse.",
    location: 'Right in the center of my chest.',
    radiation: 'Yes, it goes to my left arm.',
    red_flags: 'Yes, I feel short of breath and sweaty.',
    history: 'I have high blood pressure.',
    meds: 'I take medication for that.',
    greeting: "Hi doctor. I'm not feeling well. Can you help me?",
    severity: "I'd say about a 7 out of 10. It's pretty uncomfortable.",
    allergies: "I'm allergic to penicillin. It gives me a rash.",
    family: 'My father had a heart attack when he was 55. My mother has diabetes.',
    smoking: 'I used to smoke, but I quit about 5 years ago.',
    alcohol: 'I have a glass of wine with dinner occasionally. Maybe 2-3 times a week.',
  },
  'sudden-headache-er': {
    symptom:
      'I have a really bad headache. It feels like a sudden, intense pressure.',
    timing: 'It started suddenly about an hour ago.',
    progression: "It's getting worse, not better.",
    location: "It's mainly at the back of my head.",
    radiation: 'No, it stays in the same spot.',
    red_flags: 'I do feel a bit nauseous.',
    history: 'No major medical conditions.',
    meds: "I'm not taking any medications.",
    greeting: "Hi doctor. I'm not feeling well. Can you help me?",
    severity: "It's the worst headache I've ever had — like a 10 out of 10.",
    allergies: "I don't have any known drug allergies.",
    family: 'No heart attacks or strokes in my close family that I know of.',
    smoking: "I don't smoke.",
    alcohol: 'I drink socially sometimes, but not much.',
  },
  'acute-sob-er': {
    symptom:
      "I can't catch my breath. It came on suddenly and I feel really winded.",
    timing: 'It started very suddenly, within the last hour or so.',
    progression: 'Sitting still helps a little, but moving makes it much worse.',
    location:
      "It's not really one sharp spot — my chest feels tight and I can't get enough air.",
    radiation:
      'The worst of it is my breathing, but one of my legs has felt a bit swollen lately.',
    red_flags:
      'Yes — my oxygen feels low, my heart is racing, and I was on a long flight recently.',
    history: 'I have high blood pressure. No lung disease that I know of.',
    meds: 'I take medication for my blood pressure.',
    greeting: "Hi doctor. I'm not feeling well. Can you help me?",
    severity: "It's bad — I can barely talk in full sentences.",
    allergies: "I don't have any known allergies.",
    family: 'Nothing major that I know of.',
    smoking: 'I quit years ago.',
    alcohol: 'I drink occasionally.',
  },
  'rlq-abdominal-pain': {
    symptom:
      'My stomach hurts really badly — it started near my belly button and moved to the lower right.',
    timing: 'It started earlier today.',
    progression: 'Walking and moving make it worse. Nothing really makes it better.',
    location: 'Right now it hurts most in my lower right abdomen.',
    radiation: "It started central and moved — it doesn't really go to my shoulder or chest.",
    red_flags: 'I feel nauseous and I had a bit of fever at home.',
    history: "I'm pretty healthy otherwise — no big medical problems.",
    meds: "I don't take any regular medications.",
    greeting: "Hi doctor. I'm not feeling well. Can you help me?",
    severity: "It's pretty severe — maybe an 8 out of 10.",
    allergies: "I don't have any known allergies.",
    family: 'No surgical emergencies like this in my family.',
    smoking: "I don't smoke.",
    alcohol: 'I drink a little on weekends.',
  },
  'fever-confusion': {
    symptom: "I don't feel right — I've had a fever and everything feels foggy and confused.",
    timing: 'This came on today.',
    progression: "I think I'm getting worse — I'm more out of it than earlier.",
    location: "It's not really one spot — I feel sick all over.",
    radiation: "No — it's not like pain that travels. I just feel terrible and confused.",
    red_flags: 'I have a high fever and my blood pressure feels low to me.',
    history: 'I have diabetes.',
    meds: "I take medicines for my diabetes, but I'm fuzzy on the names right now.",
    greeting: "Hi doctor. I'm not feeling well. Can you help me?",
    severity: "I feel awful — it's hard to even think straight.",
    allergies: "I don't remember any drug allergies.",
    family: 'My family brought me in because I was confused.',
    smoking: "I don't smoke.",
    alcohol: 'I barely drink.',
  },
}

function getLastDoctorMessage(
  messages: Array<{ role: string; content: string }>
): string {
  const last = [...messages]
    .reverse()
    .find((m) => m.role === 'doctor' || m.role === 'user')
  return last?.content ?? ''
}

/**
 * Map the doctor's message to a response category. Order matters (e.g. "anywhere" vs "when").
 */
export function detectIntent(message: string): MockIntentCategory | null {
  const msg = message.toLowerCase()

  if (/\b(hello|hi|hey)\b/.test(msg) || msg.includes('how are you')) {
    return 'greeting'
  }

  if (
    msg.includes('anywhere else') ||
    msg.includes('go anywhere') ||
    msg.includes('move anywhere') ||
    msg.includes('does it spread') ||
    msg.includes('radiat') ||
    (msg.includes('anywhere') && (msg.includes('else') || msg.includes('pain')))
  ) {
    return 'radiation'
  }

  if (
    msg.includes('medical condition') ||
    msg.includes('medical conditions') ||
    (msg.includes('conditions') &&
      (msg.includes('medical') || msg.includes('any') || msg.includes('health'))) ||
    (msg.includes('health') && msg.includes('problem'))
  ) {
    return 'history'
  }

  if (
    msg.includes('medication') ||
    msg.includes('medications') ||
    msg.includes('medicine') ||
    msg.includes('take anything') ||
    msg.includes('prescription') ||
    /\bmeds\b/.test(msg)
  ) {
    return 'meds'
  }

  if (
    msg.includes('shortness') ||
    msg.includes('nausea') ||
    (msg.includes('sweat') && !msg.includes('sweater'))
  ) {
    return 'red_flags'
  }

  if (
    /\bwhere\b/.test(msg) ||
    msg.includes('location') ||
    (msg.includes('exactly') && msg.includes('feel'))
  ) {
    return 'location'
  }

  if (
    msg.includes('better') ||
    msg.includes('worse') ||
    msg.includes('what makes') ||
    msg.includes('anything make')
  ) {
    return 'progression'
  }

  if (
    /\bwhen\b/.test(msg) ||
    msg.includes('how long') ||
    msg.includes('onset') ||
    (msg.includes('start') && (msg.includes('did') || msg.includes('this')))
  ) {
    return 'timing'
  }

  if (
    msg.includes('tell me more') ||
    msg.includes("what you're feeling") ||
    msg.includes('more about what') ||
    msg.includes('what brings you') ||
    msg.includes('chief complaint') ||
    msg.includes("what's wrong") ||
    (msg.includes('describe') && (msg.includes('symptom') || msg.includes('pain') || msg.includes('feel')))
  ) {
    return 'symptom'
  }

  if (
    msg.includes('severity') ||
    msg.includes('scale') ||
    msg.includes('1-10') ||
    msg.includes('1 to 10') ||
    msg.includes('how bad')
  ) {
    return 'severity'
  }

  if (msg.includes('allerg')) return 'allergies'
  if (msg.includes('family history') || (msg.includes('family') && msg.includes('heart')))
    return 'family'
  if (msg.includes('smok') || msg.includes('tobacco')) return 'smoking'
  if (msg.includes('alcohol') || msg.includes('drink')) return 'alcohol'

  if (
    msg.includes('feel') ||
    msg.includes('symptom') ||
    msg.includes('wrong') ||
    msg.includes('happening')
  ) {
    return 'symptom'
  }

  return null
}

function matchResponse(row: ScenarioResponseRow, intent: MockIntentCategory): string | null {
  const extra: Partial<Record<MockIntentCategory, string | undefined>> = {
    greeting: row.greeting,
    severity: row.severity,
    allergies: row.allergies,
    family: row.family,
    smoking: row.smoking,
    alcohol: row.alcohol,
  }

  if (intent === 'greeting') {
    return row.greeting ?? "Hi doctor. I'm not feeling well. Can you help me?"
  }

  if (intent in extra && extra[intent]) {
    return extra[intent]!
  }

  const core = row[intent as keyof ScenarioResponseRow]
  if (typeof core === 'string' && core.length > 0) {
    return core
  }

  return null
}

export function getMockPatientResponse(
  scenarioId: string,
  messages: Array<{ role: string; content: string }>
): string {
  if (!scenarioResponses[scenarioId]) {
    console.error('Invalid scenarioId:', scenarioId)
    return "I'm not sure how to respond."
  }

  const lastDoctorMessage = getLastDoctorMessage(messages)
  if (!lastDoctorMessage.trim()) {
    return 'Can you clarify what you mean?'
  }

  const scenario = scenarioResponses[scenarioId]
  const intent = detectIntent(lastDoctorMessage)

  if (intent) {
    const hit = matchResponse(scenario, intent)
    if (hit) return hit
  }

  return 'Can you clarify what you mean?'
}

export function getMockAssessment() {
  return {
    overallRating: 'Good',
    summary:
      'Sample case. Score 71/100 (good). About 60% of suggested history topics covered. Teaching diagnosis: see scenario.',
    strengths: [
      'Thorough history-taking approach',
      'Appropriate physical exam sections reviewed',
      'Considered multiple diagnostic possibilities',
      'Good test prioritization in parts of the workup',
    ],
    areasForImprovement: [
      'Explore red flag symptoms in a more systematic way',
      'Tighten test selection to improve efficiency',
      'Add more specific reasoning notes on the differential',
    ],
    diagnosisFeedback: 'Teaching diagnosis noted in case overview.',
    missedKeyHistoryPoints: ['Family history of cardiac disease'],
    testSelectionFeedback: 'Include critical confirmatory tests; avoid low-yield shotgun panels.',
    sectionRatings: {
      history: 'Good',
      exam: 'Good',
      tests: 'Good',
      diagnosis: 'Good',
      communication: 'Good',
    },
    totalScore: 71,
    totalScorePercentage: 71,
    maxScore: 100,
    rubric100: {
      historyTaking: 18,
      clinicalReasoning: 17,
      diagnosticAccuracy: 19,
      efficiencyAndQuestionSelection: 17,
      total: 71,
    },
    scoreBreakdown: {
      history: 8,
      exam: 7,
      tests: 10,
      diagnosis: 5,
      communication: 2,
    },
    debriefStructured: {
      summary: 'Sample case. Score 71/100 (good).',
      strengths: [
        'Thorough history-taking approach',
        'Appropriate physical exam sections reviewed',
        'Considered multiple diagnostic possibilities',
        'Good test prioritization in parts of the workup',
      ],
      missedOpportunities: [
        'Explore red flag symptoms in a more systematic way',
        'Tighten test selection to improve efficiency',
        'Add more specific reasoning notes on the differential',
      ],
      correctApproach: [
        'Use the history and exam to establish pretest probability before testing.',
        'Anchor the differential in dangerous diagnoses you can rule in or out with targeted data.',
        'Confirm the working diagnosis with findings that fit the clinical picture.',
      ],
      improvementTip:
        'Next time, focus on asking about family history of early cardiac disease earlier to narrow the diagnosis faster.',
      diagnosticReasoning: [],
      nextStepAdvice: [],
      clinicalPearls: [],
      vocabToReview: [],
    },
  }
}

export function getMockTermExplanation(selectedText: string, contextText?: string) {
  const term = selectedText.trim().toLowerCase()

  const commonTerms: Record<string, { simple: string; clinical: string; why: string; example: string }> = {
    'chest pain': {
      simple: 'Pain or discomfort felt in the chest area.',
      clinical:
        'Thoracic pain or discomfort; can be cardiac, respiratory, musculoskeletal, or gastrointestinal in origin.',
      why: 'Chest pain can indicate serious conditions like heart attack or less serious issues like muscle strain.',
      example: 'The patient reported chest pain that started 3 hours ago.',
    },
    'shortness of breath': {
      simple: "Feeling like you can't get enough air or are breathing hard.",
      clinical: 'Dyspnea; a subjective sensation of difficult or uncomfortable breathing.',
      why: 'Can be a sign of serious heart or lung conditions.',
      example: 'The patient complained of shortness of breath when walking up stairs.',
    },
    tachycardia: {
      simple: 'A faster than normal heart rate.',
      clinical: 'Heart rate above the normal range (typically >100 bpm in adults at rest).',
      why: 'Can indicate stress, fever, dehydration, or heart problems.',
      example: "The patient's heart rate was tachycardic at 110 bpm.",
    },
    hypertension: {
      simple: 'High blood pressure.',
      clinical: 'Persistently elevated systemic arterial blood pressure (typically >130/80 mmHg).',
      why: 'Hypertension increases risk of heart disease, stroke, and kidney problems.',
      example: 'The patient has a history of hypertension managed with medication.',
    },
    dyspnea: {
      simple: 'Shortness of breath or difficulty breathing.',
      clinical: 'Subjective sensation of difficult or labored breathing.',
      why: 'A common symptom of many cardiac and respiratory conditions.',
      example: 'The patient presented with acute dyspnea.',
    },
  }

  if (commonTerms[term]) {
    const def = commonTerms[term]
    return {
      term: selectedText.trim(),
      definitionSimple: def.simple,
      definitionClinical: def.clinical,
      whyItMatters: def.why,
      whyItMattersHere: contextText
        ? `In this case, ${term} is an important finding that helps the doctor understand the patient's condition.`
        : def.why,
      example: def.example,
      exampleFromContext: contextText
        ? `${selectedText.trim()} appears in the patient's presentation: ${contextText.substring(0, 80)}...`
        : def.example,
      synonymsOrRelated: [],
      source: 'local' as const,
    }
  }

  return {
    term: selectedText.trim(),
    definitionSimple: `"${selectedText.trim()}" is a medical term. In this context, it refers to a clinical finding or condition.`,
    definitionClinical: `"${selectedText.trim()}" is a medical term used in clinical practice. Specific definitions may vary based on context.`,
    whyItMatters:
      'Understanding medical terminology is important for effective communication in healthcare.',
    whyItMattersHere: contextText
      ? `In this case, "${selectedText.trim()}" is relevant to understanding the patient's presentation.`
      : 'Understanding medical terminology is important for effective communication in healthcare.',
    example: `Example: The term "${selectedText.trim()}" is used to describe a clinical finding.`,
    exampleFromContext: contextText
      ? `In this case: "${selectedText.trim()}" - ${contextText.substring(0, 100)}...`
      : `Example: The term "${selectedText.trim()}" is used in medical contexts.`,
    synonymsOrRelated: [],
    source: 'ai' as const,
  }
}
