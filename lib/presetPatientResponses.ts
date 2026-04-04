import type { Scenario } from '@/data/scenarios'

export type ChatMessage = {
  role: string
  content: string
}

type FallbackQA = {
  id: string
  answer: string
  patterns?: string[]
  keywords?: string[]
}

type FallbackScenario = {
  key: string
  titleMatchers: string[]
  complaintMatchers: string[]
  qa: FallbackQA[]
  defaultAnswer: string
}

/** Maps scenario ids in data/scenarios.ts to FALLBACK_SCENARIOS keys (stable even if titles change). */
const SCENARIO_ID_TO_FALLBACK_KEY: Record<string, string> = {
  'chest-pain-er': 'chest-pain-er',
  'sudden-headache-er': 'sudden-severe-headache',
  'acute-sob-er': 'acute-shortness-of-breath',
  'rlq-abdominal-pain': 'rlq-abdominal-pain',
  'fever-confusion': 'fever-confusion',
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

function uniqueWords(text: string): string[] {
  return Array.from(new Set(normalize(text).split(' ').filter(Boolean)))
}

function includesPhrase(text: string, phrase: string): boolean {
  return normalize(text).includes(normalize(phrase))
}

function scoreQuestion(question: string, qa: FallbackQA): number {
  const normalized = normalize(question)
  let score = 0

  for (const pattern of qa.patterns || []) {
    if (includesPhrase(normalized, pattern)) {
      score += 12
    }
  }

  const questionWords = new Set(uniqueWords(normalized))
  for (const keyword of qa.keywords || []) {
    if (questionWords.has(normalize(keyword))) {
      score += 3
    }
  }

  return score
}

function detectScenarioBucket(scenario: Scenario): FallbackScenario | null {
  const mappedKey = SCENARIO_ID_TO_FALLBACK_KEY[scenario.id]
  if (mappedKey) {
    const mapped = FALLBACK_SCENARIOS.find((b) => b.key === mappedKey)
    if (mapped) return mapped
  }

  const title = normalize(scenario?.title || '')
  const chiefComplaint = normalize(scenario?.patientPersona?.chiefComplaint || '')
  const combined = `${title} ${chiefComplaint}`

  let best: FallbackScenario | null = null
  let bestScore = 0

  for (const bucket of FALLBACK_SCENARIOS) {
    let score = 0

    for (const matcher of bucket.titleMatchers) {
      if (includesPhrase(combined, matcher)) score += 10
    }

    for (const matcher of bucket.complaintMatchers) {
      if (includesPhrase(combined, matcher)) score += 8
    }

    if (score > bestScore) {
      best = bucket
      bestScore = score
    }
  }

  return best
}

export function getPresetPatientResponse(
  scenario: Scenario,
  messages: ChatMessage[]
): string {
  const lastDoctorMessage =
    [...messages].reverse().find((m) => m.role === 'doctor' || m.role === 'user')
      ?.content || ''

  if (!lastDoctorMessage) {
    return "I'm not sure what you're asking."
  }

  const bucket = detectScenarioBucket(scenario)

  if (!bucket) {
    return "I'm not really sure how to answer that, but I can tell you more about how I'm feeling if you ask in a different way."
  }

  let bestQA: FallbackQA | null = null
  let bestScore = 0

  for (const qa of bucket.qa) {
    const score = scoreQuestion(lastDoctorMessage, qa)
    if (score > bestScore) {
      bestScore = score
      bestQA = qa
    }
  }

  // Threshold to avoid bad matches (lowered slightly so keyword-only matches still count)
  if (!bestQA || bestScore < 5) {
    return bucket.defaultAnswer
  }

  return bestQA.answer
}

const FALLBACK_SCENARIOS: FallbackScenario[] = [
  {
    key: 'chest-pain-er',
    titleMatchers: ['chest pain in the er', 'chest pain'],
    complaintMatchers: ['chest pain', 'walking up stairs'],
    defaultAnswer:
      "I'm having really bad chest pain in the middle of my chest. It started when I was walking upstairs, and I feel short of breath and sweaty.",
    qa: [
      {
        id: 'feeling-open',
        answer:
          "I get this heavy, crushing feeling right in the middle of my chest, and it spreads into my left arm and jaw. I'm sweaty, short of breath, and nauseous — it started when I was walking upstairs about half an hour ago.",
        patterns: [
          'can you tell me more about what you re feeling',
          'can you tell me more about what you\'re feeling',
          'tell me more about what you re feeling',
        ],
        keywords: ['feeling', 'more', 'tell'],
      },
      {
        id: 'chief-complaint',
        answer:
          "I started having really bad chest pain while walking up the stairs about 30 minutes ago.",
        patterns: [
          'what brought you in',
          'what brings you in',
          'what happened',
          'what seems to be the problem',
          'why are you here',
          'tell me what is going on',
        ],
        keywords: ['problem', 'today', 'here', 'complaint'],
      },
      {
        id: 'onset',
        answer:
          "It started about 30 minutes ago while I was walking upstairs.",
        patterns: [
          'when did this start',
          'when did it start',
          'how long has this been going on',
          'what were you doing when it started',
        ],
        keywords: ['when', 'start', 'started', 'onset', 'doing'],
      },
      {
        id: 'trajectory',
        answer:
          "If anything it's gotten worse since it started — I don't feel like I'm turning the corner.",
        patterns: [
          'has it been getting better or worse',
          'getting better or worse',
          'better or worse',
        ],
        keywords: ['better', 'worse'],
      },
      {
        id: 'location',
        answer: "It's right in the center of my chest.",
        patterns: [
          'where exactly do you feel it',
          'where is the pain',
          'where does it hurt',
          'where is it located',
          'show me where it hurts',
        ],
        keywords: ['where', 'location', 'located', 'hurt'],
      },
      {
        id: 'quality',
        answer:
          "It feels heavy and crushing, like a lot of pressure on my chest.",
        patterns: [
          'what does it feel like',
          'describe the pain',
          'is it sharp dull pressure burning',
        ],
        keywords: ['feel', 'pressure', 'crushing', 'heavy', 'pain'],
      },
      {
        id: 'radiation',
        answer: "Yeah, it goes into my left arm and up into my jaw.",
        patterns: [
          'does it go anywhere else',
          'does the pain travel',
          'does it radiate',
          'go anywhere else',
          'move anywhere',
        ],
        keywords: ['radiate', 'travel', 'arm', 'jaw'],
      },
      {
        id: 'associated-sob-nausea-sweat',
        answer:
          "Yes — I'm short of breath, I feel nauseous, and I've been sweating buckets.",
        patterns: [
          'any shortness of breath nausea or sweating',
          'shortness of breath nausea or sweating',
          'shortness of breath nausea sweating',
        ],
        keywords: ['shortness', 'breath', 'nausea', 'sweating'],
      },
      {
        id: 'severity',
        answer: "It's about a 9 out of 10.",
        patterns: [
          'how bad is it',
          'rate the pain',
          'pain scale',
          'from 1 to 10',
        ],
        keywords: ['bad', 'severe', 'scale', '10'],
      },
      {
        id: 'worse',
        answer:
          "Walking upstairs brought it on, and trying to push through makes it feel worse. I haven't found anything that really helps besides stopping to rest.",
        patterns: [
          'does anything make it worse',
          'what makes it worse',
          'anything make it worse',
          'does movement make it worse',
          'worse with activity',
        ],
        keywords: ['worse', 'activity', 'exertion', 'movement'],
      },
      {
        id: 'better',
        answer: "Nothing has really made it better so far.",
        patterns: [
          'what makes it better',
          'anything help',
          'anything relieve it',
          'does rest help',
          'does anything help',
        ],
        keywords: ['better', 'relieve', 'help', 'rest'],
      },
      {
        id: 'shortness-breath',
        answer: "Yes, I do feel short of breath.",
        patterns: [
          'do you have shortness of breath',
          'are you short of breath',
          'trouble breathing',
        ],
        keywords: ['shortness', 'breath', 'breathing'],
      },
      {
        id: 'nausea',
        answer: "Yes, I feel nauseous.",
        patterns: ['are you nauseous', 'do you feel sick', 'nausea'],
        keywords: ['nausea', 'nauseous', 'sick'],
      },
      {
        id: 'sweating',
        answer: "Yeah, I've been sweating a lot.",
        patterns: ['are you sweating', 'did you get sweaty', 'diaphoresis'],
        keywords: ['sweat', 'sweating', 'diaphoresis'],
      },
      {
        id: 'fever',
        answer: "No, I don't have a fever and I haven't been sick recently.",
        patterns: ['do you have fever', 'any fever', 'recent illness', 'any cough'],
        keywords: ['fever', 'cough', 'sick', 'illness'],
      },
      {
        id: 'past-medical',
        answer:
          "I have high blood pressure and high cholesterol — my doctor talks about cardiac risk a lot.",
        patterns: [
          'do you have any medical conditions',
          'medical problems',
          'past medical history',
          'any conditions',
          'do you have any health problems',
        ],
        keywords: ['medical', 'history', 'conditions', 'problems'],
      },
      {
        id: 'medications',
        answer:
          "I take a statin for cholesterol and a pill for blood pressure — I think it's a thiazide — but honestly I miss doses sometimes.",
        patterns: [
          'do you take any medications',
          'what medicines do you take',
          'what medications are you on',
          'do you take anything',
        ],
        keywords: ['medications', 'medicines', 'take'],
      },
      {
        id: 'allergies',
        answer: "I don't have any known drug allergies.",
        patterns: ['any allergies', 'allergic to anything', 'drug allergies'],
        keywords: ['allergies', 'allergic'],
      },
      {
        id: 'smoking',
        answer: "Yes. I smoke about a pack a day.",
        patterns: [
          'do you smoke',
          'smoking history',
          'tobacco use',
          'do you use cigarettes',
        ],
        keywords: ['smoke', 'smoking', 'tobacco', 'cigarettes'],
      },
      {
        id: 'family-history',
        answer:
          "My father had a heart attack in his early 60s.",
        patterns: [
          'family history',
          'anyone in your family have heart disease',
          'heart attack in family',
        ],
        keywords: ['family', 'father', 'heart', 'attack'],
      },
      {
        id: 'before',
        answer: "I've never had chest pain this bad before.",
        patterns: [
          'have you had this before',
          'has this happened before',
          'similar pain before',
        ],
        keywords: ['before', 'previous', 'similar'],
      },
      {
        id: 'trauma',
        answer: "No, I didn't injure myself or have any trauma.",
        patterns: ['any trauma', 'did you fall', 'injury', 'hurt yourself'],
        keywords: ['trauma', 'injury', 'fall'],
      },
    ],
  },

  {
    key: 'sudden-severe-headache',
    titleMatchers: ['sudden severe headache', 'severe headache', 'headache'],
    complaintMatchers: [
      'sudden headache',
      'headache started one hour ago',
      'neck hurts',
      'worst headache',
      'worst headache of my life',
    ],
    defaultAnswer:
      "I have a really severe headache that started suddenly, and my neck hurts too. Bright lights make it worse.",
    qa: [
      {
        id: 'feeling-open',
        answer:
          "My head is pounding all over — it's the worst headache of my life — and my neck is stiff and hurts. Bright light makes it worse, I've been nauseous, and I've had fever and chills.",
        patterns: [
          'can you tell me more about what you re feeling',
          'can you tell me more about what you\'re feeling',
          'tell me more about what you re feeling',
        ],
        keywords: ['feeling', 'more', 'tell'],
      },
      {
        id: 'chief-complaint',
        answer:
          "I got a really bad headache all of a sudden about an hour ago, and my neck hurts too.",
        patterns: [
          'what brought you in',
          'what seems to be the problem',
          'why are you here',
          'what happened',
        ],
        keywords: ['problem', 'headache', 'today'],
      },
      {
        id: 'onset',
        answer: "It started suddenly about an hour ago.",
        patterns: [
          'when did it start',
          'when did this start',
          'how long has it been going on',
          'was it sudden',
        ],
        keywords: ['when', 'start', 'sudden', 'hour'],
      },
      {
        id: 'trajectory',
        answer:
          "It's not improving — if anything it's ramping up. This is nothing like my usual headaches.",
        patterns: [
          'has it been getting better or worse',
          'getting better or worse',
          'better or worse',
        ],
        keywords: ['better', 'worse'],
      },
      {
        id: 'location',
        answer:
          "The headache feels like it's all over my head, not just one spot.",
        patterns: [
          'where exactly do you feel it',
          'where is the pain',
          'where is the headache',
          'what part of your head hurts',
        ],
        keywords: ['where', 'head', 'location'],
      },
      {
        id: 'severity',
        answer: "It's a 10 out of 10. It's the worst headache I've had.",
        patterns: ['how bad is it', 'pain scale', 'from 1 to 10', 'rate it'],
        keywords: ['bad', 'scale', '10', 'worst'],
      },
      {
        id: 'quality',
        answer:
          "It's a severe pounding, throbbing pain — like my head is going to explode.",
        patterns: ['what does it feel like', 'describe the headache'],
        keywords: ['feel', 'describe', 'pounding'],
      },
      {
        id: 'neck',
        answer: "Yes, my neck is really stiff and painful.",
        patterns: [
          'does your neck hurt',
          'neck pain',
          'neck stiffness',
          'is your neck stiff',
        ],
        keywords: ['neck', 'stiff', 'stiffness'],
      },
      {
        id: 'radiation',
        answer:
          "It's mostly all over my head and neck. It doesn't really feel like it's going down my arm like a heart thing — it's my head and neck.",
        patterns: [
          'does it go anywhere else',
          'does the pain travel',
          'does it radiate',
          'go anywhere else',
          'move anywhere',
          'does the pain move',
          'pain move',
        ],
        keywords: ['radiate', 'travel', 'move', 'else', 'arm'],
      },
      {
        id: 'associated-sob-nausea-sweat',
        answer:
          "I'm not really short of breath. I do feel nauseous, and I've had sweats and chills with the fever.",
        patterns: [
          'any shortness of breath nausea or sweating',
          'shortness of breath nausea or sweating',
          'shortness of breath nausea sweating',
        ],
        keywords: ['shortness', 'breath', 'nausea', 'sweating'],
      },
      {
        id: 'worse',
        answer:
          "Bright lights and moving my head make it worse. Lying still in a dark room helps a little.",
        patterns: [
          'does anything make it worse',
          'what makes it worse',
          'anything make it worse',
          'worse with activity',
          'anything make it better',
          'what makes it better',
          'does anything help',
          'anything relieve',
        ],
        keywords: ['worse', 'better', 'anything'],
      },
      {
        id: 'photophobia',
        answer: "Yes, bright lights make it worse.",
        patterns: [
          'does light bother you',
          'bright lights make it worse',
          'photophobia',
        ],
        keywords: ['light', 'lights', 'bright', 'photophobia'],
      },
      {
        id: 'fever',
        answer: "Yes, I've had fever and chills.",
        patterns: ['do you have fever', 'any fever', 'chills'],
        keywords: ['fever', 'chills'],
      },
      {
        id: 'nausea',
        answer: "Yes, I feel nauseous.",
        patterns: ['nausea', 'are you nauseous', 'have you vomited'],
        keywords: ['nausea', 'nauseous', 'vomit'],
      },
      {
        id: 'weak',
        answer: "I feel really tired and weak.",
        patterns: ['are you weak', 'fatigue', 'tired'],
        keywords: ['weak', 'tired', 'fatigue'],
      },
      {
        id: 'injury',
        answer: "No, I haven't hit my head or had any recent injury.",
        patterns: ['head injury', 'trauma', 'did you fall', 'hit your head'],
        keywords: ['injury', 'trauma', 'head'],
      },
      {
        id: 'before',
        answer: "No, I've never had a headache like this before.",
        patterns: [
          'have you had this before',
          'similar headache before',
          'history of migraines',
        ],
        keywords: ['before', 'similar', 'migraines'],
      },
      {
        id: 'seizure',
        answer: "No, I don't have any history of seizures.",
        patterns: ['history of seizures', 'any seizure history'],
        keywords: ['seizure', 'seizures'],
      },
      {
        id: 'allergies',
        answer: "I don't have any known medication allergies.",
        patterns: ['any allergies', 'drug allergies', 'allergic to anything'],
        keywords: ['allergies', 'allergic'],
      },
      {
        id: 'past-medical',
        answer:
          "I'm generally healthy — no diabetes, no high blood pressure that I know of. I don't see a doctor often.",
        patterns: [
          'do you have any medical conditions',
          'past medical history',
          'medical problems',
          'any conditions',
        ],
        keywords: ['medical', 'conditions', 'history'],
      },
      {
        id: 'medications',
        answer:
          "I don't take any daily prescriptions — just ibuprofen sometimes for cramps.",
        patterns: [
          'do you take any medications',
          'what medicines do you take',
          'what medications are you on',
        ],
        keywords: ['medications', 'medicines', 'take'],
      },
      {
        id: 'social',
        answer: "I'm a college student and I live in a dorm.",
        patterns: [
          'do you live with anyone',
          'where do you live',
          'social history',
          'living situation',
        ],
        keywords: ['college', 'dorm', 'live'],
      },
    ],
  },

  {
    key: 'acute-shortness-of-breath',
    titleMatchers: ['acute shortness of breath', 'shortness of breath'],
    complaintMatchers: ['sudden onset shortness of breath', 'trouble breathing'],
    defaultAnswer:
      "I suddenly got really short of breath. It came on pretty quickly and it's hard to catch my breath.",
    qa: [
      {
        id: 'feeling-open',
        answer:
          "I can't catch my breath — it hit me out of nowhere today. My chest feels tight and I'm winded even sitting still. One leg has felt a bit swollen lately, and I was on a long trip recently where I was sitting for hours.",
        patterns: [
          'can you tell me more about what you re feeling',
          'can you tell me more about what you\'re feeling',
          'tell me more about what you re feeling',
        ],
        keywords: ['feeling', 'more', 'tell'],
      },
      {
        id: 'chief-complaint',
        answer:
          "I suddenly became very short of breath, and it came on pretty quickly.",
        patterns: [
          'what brought you in',
          'what seems to be the problem',
          'what happened',
          'why are you here',
        ],
        keywords: ['problem', 'breathing', 'shortness'],
      },
      {
        id: 'onset',
        answer: "It started suddenly today.",
        patterns: [
          'when did it start',
          'when did this start',
          'how long has it been going on',
          'did it start suddenly',
        ],
        keywords: ['when', 'start', 'suddenly'],
      },
      {
        id: 'trajectory',
        answer:
          "I'd say it's been steady or a little worse — I haven't bounced back to normal.",
        patterns: [
          'has it been getting better or worse',
          'getting better or worse',
          'better or worse',
        ],
        keywords: ['better', 'worse'],
      },
      {
        id: 'quality',
        answer:
          "It feels like I can't get a full breath — tight and air-hungry, not really sharp pain.",
        patterns: [
          'what does it feel like',
          'describe what you re feeling',
          'describe the breathing',
        ],
        keywords: ['feel', 'describe', 'like'],
      },
      {
        id: 'severity',
        answer: "It's pretty bad. I'm really struggling to catch my breath.",
        patterns: ['how bad is it', 'severity', 'from 1 to 10'],
        keywords: ['bad', 'severe', 'breath'],
      },
      {
        id: 'location',
        answer:
          "It's mostly a tight, can't-breathe feeling in my chest — like I can't fill my lungs all the way.",
        patterns: [
          'where exactly do you feel it',
          'where do you feel it',
          'where is the discomfort',
        ],
        keywords: ['where', 'feel', 'chest'],
      },
      {
        id: 'radiation',
        answer:
          "The breathing trouble is mostly in my chest. I don't have pain shooting down my arm — but one calf has felt off and a bit swollen.",
        patterns: [
          'does it go anywhere else',
          'does the pain travel',
          'does it radiate',
          'go anywhere else',
        ],
        keywords: ['anywhere', 'else', 'radiate', 'travel'],
      },
      {
        id: 'associated-sob-nausea-sweat',
        answer:
          "I'm definitely short of breath — that's the main thing. I'm not nauseous, but I've felt a little clammy.",
        patterns: [
          'any shortness of breath nausea or sweating',
          'shortness of breath nausea or sweating',
          'shortness of breath nausea sweating',
        ],
        keywords: ['shortness', 'breath', 'nausea', 'sweating'],
      },
      {
        id: 'chest-pain',
        answer: "I don't really have crushing chest pain. It's mainly the breathing that's bothering me.",
        patterns: ['any chest pain', 'does your chest hurt'],
        keywords: ['chest', 'pain'],
      },
      {
        id: 'worse',
        answer:
          "Yes — walking and even talking make me more winded. Resting helps a little but I'm still short of breath.",
        patterns: [
          'does anything make it worse',
          'what makes it worse',
          'worse with walking',
          'worse with activity',
        ],
        keywords: ['worse', 'walking', 'activity', 'movement'],
      },
      {
        id: 'better',
        answer: "Sitting still helps a little, but I'm still short of breath.",
        patterns: ['what makes it better', 'anything help', 'rest help'],
        keywords: ['better', 'help', 'rest'],
      },
      {
        id: 'cough',
        answer: "I don't have much of a cough.",
        patterns: ['do you have a cough', 'coughing'],
        keywords: ['cough'],
      },
      {
        id: 'fever',
        answer: "No, I haven't had a fever.",
        patterns: ['fever', 'any fever', 'recent illness'],
        keywords: ['fever', 'illness'],
      },
      {
        id: 'wheezing',
        answer: "I don't really notice wheezing. I just feel very short of breath.",
        patterns: ['are you wheezing', 'wheezing'],
        keywords: ['wheezing', 'wheeze'],
      },
      {
        id: 'leg',
        answer: "Now that you mention it, one of my legs has felt more swollen recently.",
        patterns: [
          'leg swelling',
          'any swelling in your legs',
          'calf pain',
          'leg pain',
        ],
        keywords: ['leg', 'swelling', 'calf'],
      },
      {
        id: 'medical-history',
        answer:
          "I have high blood pressure, and my doctor said my cholesterol is a little high. I don't have asthma or COPD that I know of.",
        patterns: [
          'do you have any medical conditions',
          'past medical history',
          'medical problems',
          'health conditions',
        ],
        keywords: ['medical', 'history', 'conditions'],
      },
      {
        id: 'medications',
        answer:
          "I take lisinopril for blood pressure and a statin — atorvastatin — for cholesterol. That's about it for daily meds.",
        patterns: [
          'do you take any medications',
          'medications',
          'medicines',
          'what do you take',
        ],
        keywords: ['medications', 'medicines'],
      },
      {
        id: 'allergies',
        answer: "I don't have any known allergies.",
        patterns: ['allergies', 'allergic to anything'],
        keywords: ['allergies', 'allergic'],
      },
      {
        id: 'smoking',
        answer: "I used to smoke, but not heavily.",
        patterns: ['do you smoke', 'smoking history', 'tobacco'],
        keywords: ['smoke', 'smoking', 'tobacco'],
      },
      {
        id: 'travel',
        answer: "I was sitting for a long time recently during travel.",
        patterns: [
          'recent travel',
          'long car ride',
          'plane ride',
          'were you immobile recently',
        ],
        keywords: ['travel', 'plane', 'car', 'immobile'],
      },
      {
        id: 'before',
        answer: "No, this hasn't happened to me before.",
        patterns: ['have you had this before', 'similar episode before'],
        keywords: ['before', 'similar'],
      },
    ],
  },

  {
    key: 'rlq-abdominal-pain',
    titleMatchers: [
      'right lower quadrant abdominal pain',
      'abdominal pain',
      'right lower quadrant',
    ],
    complaintMatchers: ['abdominal pain', 'right side', 'stomach hurts'],
    defaultAnswer:
      "My stomach started hurting earlier today, and now it's mostly on the lower right side. It gets worse when I move.",
    qa: [
      {
        id: 'feeling-open',
        answer:
          "My whole belly felt off earlier, then the pain settled into the right lower side — sharp, worse when I walk or bounce. I'm nauseous and had a low fever at home.",
        patterns: [
          'can you tell me more about what you re feeling',
          'can you tell me more about what you\'re feeling',
          'tell me more about what you re feeling',
        ],
        keywords: ['feeling', 'more', 'tell'],
      },
      {
        id: 'chief-complaint',
        answer:
          "My stomach started hurting earlier today, and now the pain is mostly on the lower right side.",
        patterns: [
          'what brought you in',
          'what seems to be the problem',
          'what happened',
          'why are you here',
        ],
        keywords: ['problem', 'stomach', 'pain'],
      },
      {
        id: 'onset',
        answer: "It started earlier today around my belly button.",
        patterns: [
          'when did this start',
          'when did it start',
          'when did this begin',
          'how long',
        ],
        keywords: ['when', 'start', 'begin'],
      },
      {
        id: 'trajectory',
        answer:
          "It's gotten worse as the day went on — especially after it moved to the right lower side.",
        patterns: [
          'has it been getting better or worse',
          'getting better or worse',
          'better or worse',
        ],
        keywords: ['better', 'worse'],
      },
      {
        id: 'migration',
        answer:
          "It started around my belly button and then moved down to the right lower side.",
        patterns: [
          'did the pain move',
          'has the location changed',
          'where did it start',
          'did it migrate',
        ],
        keywords: ['move', 'moved', 'belly', 'button', 'right'],
      },
      {
        id: 'radiation',
        answer:
          "It stays focused in the right lower belly — it doesn't really shoot to my shoulder or all over.",
        patterns: [
          'does it go anywhere else',
          'does the pain travel',
          'does it radiate',
          'go anywhere else',
        ],
        keywords: ['anywhere', 'else', 'radiate', 'travel'],
      },
      {
        id: 'associated-sob-nausea-sweat',
        answer:
          "I'm not short of breath. I've been nauseous and threw up once, and I've felt a bit sweaty with the fever.",
        patterns: [
          'any shortness of breath nausea or sweating',
          'shortness of breath nausea or sweating',
          'shortness of breath nausea sweating',
        ],
        keywords: ['shortness', 'breath', 'nausea', 'sweating'],
      },
      {
        id: 'location',
        answer: "Right now it's in the lower right side of my abdomen.",
        patterns: [
          'where exactly do you feel it',
          'where is the pain',
          'where does it hurt',
          'show me where it hurts',
        ],
        keywords: ['where', 'location', 'right'],
      },
      {
        id: 'quality',
        answer:
          "It's a sharp, constant pain — like something's irritated right there — and it spikes when I move.",
        patterns: ['what does it feel like', 'describe the pain'],
        keywords: ['sharp', 'feel', 'describe'],
      },
      {
        id: 'severity',
        answer: "It's about an 8 out of 10.",
        patterns: ['how bad is it', 'from 1 to 10', 'pain scale'],
        keywords: ['bad', 'scale', '8', '10'],
      },
      {
        id: 'worse',
        answer:
          "Walking, bouncing my heel, and even pressing on the area make it worse. I want to lie still.",
        patterns: [
          'does anything make it worse',
          'what makes it worse',
          'worse with movement',
          'worse walking',
        ],
        keywords: ['worse', 'walking', 'moving', 'movement'],
      },
      {
        id: 'better',
        answer: "Nothing really seems to make it better.",
        patterns: ['what makes it better', 'anything help', 'relieve it'],
        keywords: ['better', 'help', 'relieve'],
      },
      {
        id: 'nausea',
        answer: "Yeah, I feel nauseous.",
        patterns: ['nausea', 'are you nauseous', 'feel sick'],
        keywords: ['nausea', 'nauseous', 'sick'],
      },
      {
        id: 'vomiting',
        answer: "I threw up once.",
        patterns: ['have you vomited', 'any vomiting', 'throw up'],
        keywords: ['vomit', 'vomited', 'throw'],
      },
      {
        id: 'appetite',
        answer: "I don't really want to eat anything.",
        patterns: ['appetite', 'are you hungry', 'loss of appetite'],
        keywords: ['appetite', 'hungry', 'eat'],
      },
      {
        id: 'fever',
        answer: "I had a low fever at home.",
        patterns: ['fever', 'any fever', 'temperature'],
        keywords: ['fever', 'temperature'],
      },
      {
        id: 'diarrhea',
        answer: "No, I don't have diarrhea.",
        patterns: ['diarrhea', 'loose stool'],
        keywords: ['diarrhea', 'stool'],
      },
      {
        id: 'urinary',
        answer: "No, it doesn't burn when I pee.",
        patterns: ['pain with urination', 'burning urination', 'urinary symptoms'],
        keywords: ['urination', 'pee', 'burning', 'urinary'],
      },
      {
        id: 'trauma',
        answer: "No, I didn't get injured.",
        patterns: ['any injury', 'trauma', 'did you fall'],
        keywords: ['injury', 'trauma'],
      },
      {
        id: 'medical-history',
        answer:
          "I'm usually healthy — no diabetes, no inflammatory bowel problems that I know of. I've never had anything like this before.",
        patterns: [
          'do you have any medical conditions',
          'past medical history',
          'medical problems',
          'health conditions',
        ],
        keywords: ['medical', 'history', 'conditions'],
      },
      {
        id: 'surgeries',
        answer: "I've never had surgery.",
        patterns: ['any surgeries', 'have you had surgery before'],
        keywords: ['surgery', 'surgeries'],
      },
      {
        id: 'medications',
        answer:
          "I don't take any regular prescriptions — just occasional ibuprofen for headaches.",
        patterns: [
          'do you take any medications',
          'medications',
          'medicines',
          'what do you take',
        ],
        keywords: ['medications', 'medicines'],
      },
      {
        id: 'allergies',
        answer: "I don't have any allergies that I know of.",
        patterns: ['allergies', 'allergic to anything'],
        keywords: ['allergies', 'allergic'],
      },
    ],
  },

  {
    key: 'fever-confusion',
    titleMatchers: ['fever and confusion', 'confusion'],
    complaintMatchers: ['fever', 'confusion', 'acute confusion'],
    defaultAnswer:
      "I don't feel right. I've had a fever, and everything feels kind of foggy.",
    qa: [
      {
        id: 'feeling-open',
        answer:
          "My head feels foggy, I'm hot and sweaty, and I'm not thinking straight. I'm a little nauseous, and it burns when I pee. I feel weaker than usual — this started today and has been sliding downhill.",
        patterns: [
          'can you tell me more about what you re feeling',
          'can you tell me more about what you\'re feeling',
          'tell me more about what you re feeling',
        ],
        keywords: ['feeling', 'more', 'tell'],
      },
      {
        id: 'chief-complaint',
        answer:
          "I've had a fever, and I've been feeling confused — not like myself.",
        patterns: [
          'what brought you in',
          'what seems to be the problem',
          'why are you here',
          'what happened',
        ],
        keywords: ['problem', 'fever', 'confused'],
      },
      {
        id: 'onset',
        answer:
          "It started this morning and has gotten worse through the day — I wasn't this confused earlier.",
        patterns: [
          'when did this start',
          'when did it start',
          'how long has this been going on',
        ],
        keywords: ['when', 'start', 'long'],
      },
      {
        id: 'trajectory',
        answer:
          "Worse — I was a little off earlier, but now I'm really foggy and weak.",
        patterns: [
          'has it been getting better or worse',
          'getting better or worse',
          'better or worse',
        ],
        keywords: ['better', 'worse'],
      },
      {
        id: 'quality',
        answer:
          "It doesn't feel like pain so much as a hot, foggy, sick feeling — I can't focus and I don't feel steady.",
        patterns: ['what does it feel like', 'describe what you re feeling'],
        keywords: ['feel', 'describe', 'like'],
      },
      {
        id: 'location',
        answer:
          "It's not one sharp spot — I feel hot and unwell all over, and my head feels foggy.",
        patterns: [
          'where exactly do you feel it',
          'where do you feel it',
          'where is the discomfort',
        ],
        keywords: ['where', 'feel'],
      },
      {
        id: 'radiation',
        answer:
          "The weird feeling doesn't travel like shooting pain — it's more my whole-body fever and my head fog.",
        patterns: [
          'does it go anywhere else',
          'does the pain travel',
          'does it radiate',
          'go anywhere else',
        ],
        keywords: ['anywhere', 'else', 'radiate', 'travel'],
      },
      {
        id: 'associated-sob-nausea-sweat',
        answer:
          "I'm not really short of breath. I feel a bit nauseous. I've been sweating with the fever.",
        patterns: [
          'any shortness of breath nausea or sweating',
          'shortness of breath nausea or sweating',
          'shortness of breath nausea sweating',
        ],
        keywords: ['shortness', 'breath', 'nausea', 'sweating'],
      },
      {
        id: 'worse',
        answer:
          "Trying to move around and do things makes me feel worse. I want to lie still.",
        patterns: [
          'does anything make it worse',
          'what makes it worse',
          'anything make it worse',
        ],
        keywords: ['worse', 'anything'],
      },
      {
        id: 'fever',
        answer: "Yes, I've had a fever — I've felt hot and cold.",
        patterns: ['fever', 'any fever', 'temperature'],
        keywords: ['fever', 'temperature'],
      },
      {
        id: 'confusion',
        answer: "Yes, I feel confused and not like myself.",
        patterns: ['are you confused', 'what do you mean by confusion', 'mental status'],
        keywords: ['confused', 'confusion', 'mental'],
      },
      {
        id: 'weakness',
        answer: "I feel weak and tired.",
        patterns: ['weak', 'fatigue', 'tired'],
        keywords: ['weak', 'fatigue', 'tired'],
      },
      {
        id: 'cough',
        answer: "I don't really have much of a cough.",
        patterns: ['cough', 'are you coughing'],
        keywords: ['cough'],
      },
      {
        id: 'urinary',
        answer: "It does burn a little when I pee.",
        patterns: ['burning urination', 'pain with urination', 'urinary symptoms'],
        keywords: ['burning', 'urination', 'pee', 'urinary'],
      },
      {
        id: 'abd-pain',
        answer: "I don't really have bad belly pain.",
        patterns: ['abdominal pain', 'belly pain'],
        keywords: ['abdominal', 'belly', 'pain'],
      },
      {
        id: 'medical-history',
        answer:
          "I have high blood pressure, and my doctor said I'm at risk for diabetes — I take pills for the blood pressure.",
        patterns: [
          'do you have any medical conditions',
          'past medical history',
          'medical problems',
        ],
        keywords: ['medical', 'history', 'conditions'],
      },
      {
        id: 'medications',
        answer:
          "I take something for blood pressure — I think it's lisinopril — and a water pill. I forget names sometimes.",
        patterns: [
          'do you take any medications',
          'medications',
          'medicines',
          'what do you take',
        ],
        keywords: ['medications', 'medicines'],
      },
      {
        id: 'allergies',
        answer: "I don't remember having any medication allergies.",
        patterns: ['allergies', 'allergic to anything'],
        keywords: ['allergies', 'allergic'],
      },
    ],
  },
]
