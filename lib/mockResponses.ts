/**
 * Mock responses for demo mode when OpenAI is not configured
 */

export function getMockPatientResponse(
  scenarioId: string,
  messages: Array<{ role: string; content: string }>
): string {
  // Get the last doctor message
  const lastDoctorMessage = messages
    .filter(m => m.role === 'doctor' || m.role === 'user')
    .pop()?.content.toLowerCase() || ''

  // Generate contextual responses based on common questions
  if (lastDoctorMessage.includes('hello') || lastDoctorMessage.includes('hi') || lastDoctorMessage.includes('how are you')) {
    return "Hi doctor. I'm not feeling well. Can you help me?"
  }

  if (lastDoctorMessage.includes('what brings you') || lastDoctorMessage.includes('chief complaint') || lastDoctorMessage.includes('what\'s wrong')) {
    return "I've been having some chest pain. It started a few hours ago."
  }

  if (lastDoctorMessage.includes('when did') || lastDoctorMessage.includes('when did this start')) {
    return "It started about 3 hours ago, around lunchtime. I was just sitting at my desk when it came on."
  }

  if (lastDoctorMessage.includes('where') || lastDoctorMessage.includes('location') || lastDoctorMessage.includes('point')) {
    return "It's in the center of my chest, kind of pressing. Sometimes it goes to my left arm."
  }

  if (lastDoctorMessage.includes('severity') || lastDoctorMessage.includes('scale') || lastDoctorMessage.includes('1-10') || lastDoctorMessage.includes('how bad')) {
    return "I'd say about a 7 out of 10. It's pretty uncomfortable."
  }

  if (lastDoctorMessage.includes('better') || lastDoctorMessage.includes('worse') || lastDoctorMessage.includes('what makes')) {
    return "It gets worse when I take a deep breath. Nothing really makes it better."
  }

  if (lastDoctorMessage.includes('shortness') || lastDoctorMessage.includes('breath') || lastDoctorMessage.includes('breathing')) {
    return "Yes, I feel a bit short of breath. I'm breathing faster than usual."
  }

  if (lastDoctorMessage.includes('nausea') || lastDoctorMessage.includes('sick') || lastDoctorMessage.includes('vomit')) {
    return "Yes, I feel a little nauseous. I haven't thrown up though."
  }

  if (lastDoctorMessage.includes('sweat') || lastDoctorMessage.includes('sweating')) {
    return "Yes, I'm sweating a lot. I feel clammy."
  }

  if (lastDoctorMessage.includes('medical history') || lastDoctorMessage.includes('conditions') || lastDoctorMessage.includes('diagnoses')) {
    return "I have high blood pressure and high cholesterol. My doctor put me on medications for those."
  }

  if (lastDoctorMessage.includes('medication') || lastDoctorMessage.includes('meds') || lastDoctorMessage.includes('prescription')) {
    return "I take lisinopril for my blood pressure and atorvastatin for cholesterol."
  }

  if (lastDoctorMessage.includes('allerg') || lastDoctorMessage.includes('allergic')) {
    return "I'm allergic to penicillin. It gives me a rash."
  }

  if (lastDoctorMessage.includes('family history') || lastDoctorMessage.includes('family')) {
    return "My father had a heart attack when he was 55. My mother has diabetes."
  }

  if (lastDoctorMessage.includes('smok') || lastDoctorMessage.includes('tobacco')) {
    return "I used to smoke, but I quit about 5 years ago."
  }

  if (lastDoctorMessage.includes('alcohol') || lastDoctorMessage.includes('drink')) {
    return "I have a glass of wine with dinner occasionally. Maybe 2-3 times a week."
  }

  // Default response
  return "I'm not sure how to describe that. Can you ask me in a different way?"
}

export function getMockAssessment() {
  return {
    overallRating: "Good",
    summary: "You demonstrated solid clinical reasoning throughout this case. You gathered relevant history, performed an appropriate exam, and selected reasonable tests. Your differential diagnosis showed good consideration of multiple possibilities. There are some areas where you could improve, such as exploring more red flags and refining your test selection efficiency.",
    strengths: [
      "Thorough history-taking approach",
      "Appropriate physical exam sections reviewed",
      "Considered multiple diagnostic possibilities",
      "Good patient communication"
    ],
    areasForImprovement: [
      "Could explore more red flag symptoms systematically",
      "Some tests may have been unnecessary - consider efficiency",
      "Differential diagnosis could benefit from more specific reasoning notes",
      "Consider asking about family history earlier in the encounter"
    ],
    diagnosisFeedback: "Your differential diagnosis included relevant possibilities. You correctly identified the most likely diagnosis and ranked your differential appropriately. Consider being more explicit in your reasoning notes to demonstrate your clinical thinking process.",
    missedKeyHistoryPoints: [
      "Family history of cardiac disease"
    ],
    testSelectionFeedback: "You selected several high-yield tests that are appropriate for this presentation. Some tests may have been ordered as a 'shotgun' approach rather than being targeted. In a real clinical setting, efficiency is important - consider whether each test truly changes your management or adds critical information.",
    sectionRatings: {
      history: "Good",
      exam: "Good",
      tests: "Good",
      diagnosis: "Good",
      communication: "Good"
    },
    totalScore: 32,
    totalScorePercentage: 71,
    maxScore: 45,
    scoreBreakdown: {
      history: 8,
      exam: 7,
      tests: 10,
      diagnosis: 5,
      communication: 2
    }
  }
}

export function getMockTermExplanation(
  selectedText: string,
  contextText?: string,
  viewMode: 'simple' | 'clinical' = 'simple'
) {
  const term = selectedText.trim().toLowerCase()
  
  // Common medical terms with mock explanations
  const commonTerms: Record<string, { simple: string; clinical: string; why: string; example: string }> = {
    'chest pain': {
      simple: 'Pain or discomfort felt in the chest area.',
      clinical: 'Thoracic pain or discomfort; can be cardiac, respiratory, musculoskeletal, or gastrointestinal in origin.',
      why: 'Chest pain can indicate serious conditions like heart attack or less serious issues like muscle strain.',
      example: 'The patient reported chest pain that started 3 hours ago.'
    },
    'shortness of breath': {
      simple: 'Feeling like you can\'t get enough air or are breathing hard.',
      clinical: 'Dyspnea; a subjective sensation of difficult or uncomfortable breathing.',
      why: 'Can be a sign of serious heart or lung conditions.',
      example: 'The patient complained of shortness of breath when walking up stairs.'
    },
    'tachycardia': {
      simple: 'A faster than normal heart rate.',
      clinical: 'Heart rate above the normal range (typically >100 bpm in adults at rest).',
      why: 'Can indicate stress, fever, dehydration, or heart problems.',
      example: 'The patient\'s heart rate was tachycardic at 110 bpm.'
    },
    'hypertension': {
      simple: 'High blood pressure.',
      clinical: 'Persistently elevated systemic arterial blood pressure (typically >130/80 mmHg).',
      why: 'Hypertension increases risk of heart disease, stroke, and kidney problems.',
      example: 'The patient has a history of hypertension managed with medication.'
    },
    'dyspnea': {
      simple: 'Shortness of breath or difficulty breathing.',
      clinical: 'Subjective sensation of difficult or labored breathing.',
      why: 'A common symptom of many cardiac and respiratory conditions.',
      example: 'The patient presented with acute dyspnea.'
    }
  }

  // Check for exact match
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
      source: 'local' as const
    }
  }

  // Generic response
  return {
    term: selectedText.trim(),
    definitionSimple: `"${selectedText.trim()}" is a medical term. In this context, it refers to a clinical finding or condition.`,
    definitionClinical: `"${selectedText.trim()}" is a medical term used in clinical practice. Specific definitions may vary based on context.`,
    whyItMatters: 'Understanding medical terminology is important for effective communication in healthcare.',
    whyItMattersHere: contextText
      ? `In this case, "${selectedText.trim()}" is relevant to understanding the patient's presentation.`
      : 'Understanding medical terminology is important for effective communication in healthcare.',
    example: `Example: The term "${selectedText.trim()}" is used to describe a clinical finding.`,
    exampleFromContext: contextText
      ? `In this case: "${selectedText.trim()}" - ${contextText.substring(0, 100)}...`
      : `Example: The term "${selectedText.trim()}" is used in medical contexts.`,
    synonymsOrRelated: [],
    source: 'ai' as const
  }
}


