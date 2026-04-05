import type { ScenarioDebriefConfig } from "@/types/debrief";

export type ScenarioDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type VitalSigns = {
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  oxygenSat: string;
  temperature: string;
};

export type PhysicalExamSectionId =
  | "general"
  | "cardiac"
  | "respiratory"
  | "abdomen"
  | "neuro"
  | "extremities"
  | "heent"
  | "other";

export type PhysicalExamSection = {
  id: PhysicalExamSectionId | string;
  label: string;     // "Cardiac"
  summary: string;   // Short summary
  details: string;   // Detailed findings
};

// Legacy types kept for backward compatibility
export type DiagnosticTestId =
  | "ecg"
  | "troponin"
  | "cxr"
  | "cbc"
  | "cmp"
  | "lipid"
  | "ct-head"
  | "d-dimer"
  | "other";

export type DiagnosticTest = {
  id: DiagnosticTestId | string;
  name: string;
  category: string;
  description: string;
  result: string;
  isHighYield: boolean;
};

// New test system types
export type ScenarioTestYield = "high" | "helpful" | "low" | "inappropriate";

export type ScenarioTestOverride = {
  testId: string;
  result: string;
  yield: ScenarioTestYield;
};

export type TestDefaultBehavior = {
  labDefault: string;
  imagingDefault: string;
  bedsideDefault: string;
  procedureDefault: string;
};


// Legacy type kept for backward compatibility
export type DiagnosisOption = {
  id: string;
  name: string;              // "ST-elevation myocardial infarction"
  isCorrect: boolean;
  explanation: string;       // Why this diagnosis is or isn't correct
  isDangerous?: boolean;     // Must-not-miss diagnosis
};

// New diagnosis system types
export type DxYield = "correct" | "reasonable" | "low" | "dangerous-miss" | "irrelevant";

export type ScenarioDxOverride = {
  dxId: string;         // must match diagnosisCatalog id
  yield: DxYield;       // scoring + feedback class
  explanation: string;  // why it fits/doesn't
};

// Workflow Types
export type StabilityStatus = "Stable" | "Unstable";

export type HPI = {
  onset?: string;           // When did it start? Sudden/gradual?
  provocation?: string;      // What makes it better/worse?
  quality?: string;          // What does it feel like?
  radiation?: string;        // Does it move anywhere?
  severity?: number;        // 0-10 scale
  timing?: string;          // Constant vs comes/goes, progression
  associatedSymptoms?: string[]; // Fever, nausea, cough, etc.
  pertinentPositives?: string[];
  pertinentNegatives?: string[];
};

export type MedicalBackground = {
  pastMedicalHistory?: string[];
  medications?: string[];
  allergies?: Array<{ allergen: string; reaction: string }>;
  familyHistory?: string[];
  socialHistory?: {
    smoking?: string;
    alcohol?: string;
    drugs?: string;
    occupation?: string;
    travel?: string;
  };
  reviewOfSystems?: Record<string, string>; // System -> positive/negative
};

export type ProblemRepresentation = {
  summary: string; // One-sentence clinical snapshot
};

export type DifferentialDiagnosisCategory = "Most Likely" | "Must-Not-Miss" | "Less Likely";

export type DifferentialDiagnosis = {
  id: string;
  name: string;
  category: DifferentialDiagnosisCategory;
  reasoning?: string;
};

export type ConfidenceLevel = "High" | "Medium" | "Low";

export type FinalDiagnosis = {
  diagnosisId: string;
  confidence: ConfidenceLevel;
  nextSteps?: string; // If low confidence
};

export type Disposition = "Discharge" | "Observe" | "Admit" | "ICU";

export type Plan = {
  disposition: Disposition;
  planDetails: string;
  consultations?: string[];
  monitoring?: string[];
};

export type PatientPersona = {
  name: string;
  age: number;
  gender: string;
  chiefComplaint: string;    // "Chest pain"
  background: string;        // Story, context, personality
  vitals: VitalSigns;
  keyHistoryPoints: string[]; // Important info a good doctor should find
  redFlags: string[];         // Critical danger signs
};

export type AIInstructions = {
  patientStyle: string;      // How the patient talks (anxious, calm, etc.)
  behaviorRules: string[];   // e.g., don't reveal diagnosis, answer as patient only
  doNotRevealDirectly: string[]; // Phrases/concepts the AI must not say
};

export type Scenario = {
  id: string;
  title: string;
  specialty: string;          // "Emergency Medicine"
  difficulty: ScenarioDifficulty;
  estimatedMinutes: number;
  description: string;
  objectives: string[];
  patientPersona: PatientPersona;
  aiInstructions: AIInstructions;
  physicalExam: PhysicalExamSection[];
  tests?: DiagnosticTest[];  // Legacy - kept for backward compatibility
  testOverrides?: ScenarioTestOverride[];
  testDefaultBehavior?: TestDefaultBehavior;
  diagnosisOptions?: DiagnosisOption[];  // Legacy - kept for backward compatibility
  dxOverrides?: ScenarioDxOverride[];    // New diagnosis system
  requiredMustNotMiss?: string[];        // dxIds that must appear in DDx
  finalDxId?: string;                    // correct final diagnosis id
  teachingPoints: string[];   // Key points for debrief
  /** Optional override; defaults are in data/debriefConfigs.ts by scenario id */
  debriefConfig?: ScenarioDebriefConfig;
};

export const scenarios: Scenario[] = [
  {
    id: "chest-pain-er",
    title: "Chest Pain in the ER",
    specialty: "Emergency Medicine",
    difficulty: "Beginner",
    estimatedMinutes: 12,
    description:
      "You are the ER doctor evaluating a 54-year-old man with chest pain that started 30 minutes ago while walking up stairs.",
    objectives: [
      "Practice taking a focused chest pain history.",
      "Identify red flags that suggest an urgent cardiac cause.",
      "Choose appropriate initial tests and arrive at a reasonable diagnosis."
    ],
    patientPersona: {
      name: "Mr. Lopez",
      age: 54,
      gender: "Male",
      chiefComplaint: "Chest pain",
      background:
        "Mr. Lopez works in construction, has high blood pressure and high cholesterol, and sometimes skips his medicines. He is worried but trying to stay calm.",
      vitals: {
        heartRate: 105,
        bloodPressure: "150/92",
        respiratoryRate: 20,
        oxygenSat: "95% on room air",
        temperature: "37.0°C"
      },
      keyHistoryPoints: [
        "Onset during exertion (walking up stairs)",
        "Pressure-like chest pain in center of chest",
        "Radiation to left arm",
        "Duration around 30 minutes",
        "Associated shortness of breath and sweating",
        "Past hypertension and high cholesterol",
        "Family history of heart disease"
      ],
      redFlags: [
        "Exertional onset",
        "Pressure quality",
        "Radiation to arm",
        "Diaphoresis (sweating)",
        "Shortness of breath"
      ]
    },
    aiInstructions: {
      patientStyle:
        "Answer as Mr. Lopez, a slightly anxious but cooperative patient. Use simple, natural language.",
      behaviorRules: [
        "Answer only as the patient. Do NOT speak as a doctor or give medical advice.",
        "Do NOT mention any disease names or diagnoses.",
        "Volunteer basic information about symptoms when asked open questions.",
        "Reveal specific details (like radiation, timing, associated symptoms, past history) only when the user asks clearly about them.",
        "If the user asks specifically for a diagnosis or what they should do in real life, respond that you are just a simulated patient and cannot give real-world medical advice."
      ],
      doNotRevealDirectly: [
        "This is a heart attack.",
        "myocardial infarction",
        "STEMI",
        "You should go to the cath lab.",
        "You should take specific medications."
      ]
    },
    physicalExam: [
      {
        id: "general",
        label: "General",
        summary: "Appears uncomfortable, slightly sweaty, sitting upright.",
        details:
          "Mr. Lopez looks uncomfortable and a bit sweaty. He is alert and oriented, speaking in full sentences but with mild shortness of breath."
      },
      {
        id: "cardiac",
        label: "Cardiac",
        summary: "Tachycardic, regular rhythm.",
        details:
          "Heart rate is fast but regular. No obvious murmurs, rubs, or gallops heard with a quick exam."
      },
      {
        id: "respiratory",
        label: "Respiratory",
        summary: "Lungs clear to auscultation.",
        details:
          "Breath sounds are clear in all lung fields. No wheezing, crackles, or decreased breath sounds."
      },
      {
        id: "abdomen",
        label: "Abdomen",
        summary: "Soft, non-tender.",
        details:
          "Abdomen is soft, non-distended, and non-tender. No guarding or rebound."
      }
    ],
    // New test system
    testOverrides: [
      {
        testId: "ecg",
        result: "Shows ST-segment elevations in leads II, III, and aVF, concerning for an inferior wall myocardial infarction.",
        yield: "high"
      },
      {
        testId: "troponin",
        result: "Initial troponin is mildly elevated above the normal range.",
        yield: "high"
      },
      {
        testId: "cxr",
        result: "Normal heart size, clear lung fields, no evidence of pneumonia or pneumothorax.",
        yield: "helpful"
      },
      {
        testId: "cbc",
        result: "Within normal limits.",
        yield: "low"
      }
    ],
    testDefaultBehavior: {
      labDefault: "Within normal limits.",
      imagingDefault: "No acute abnormality.",
      bedsideDefault: "No significant abnormality.",
      procedureDefault: "Not indicated in this case."
    },
    // Legacy tests array kept for backward compatibility
    tests: [
      {
        id: "ecg",
        name: "ECG (Electrocardiogram)",
        category: "Cardiac",
        description:
          "Records the electrical activity of the heart, essential in chest pain evaluation.",
        result:
          "Shows ST-segment elevations in leads II, III, and aVF, concerning for an inferior wall myocardial infarction.",
        isHighYield: true
      },
      {
        id: "troponin",
        name: "Troponin I",
        category: "Lab",
        description:
          "A blood test that can be elevated when heart muscle is damaged.",
        result:
          "Initial troponin is mildly elevated above the normal range.",
        isHighYield: true
      },
      {
        id: "cxr",
        name: "Chest X-Ray",
        category: "Imaging",
        description:
          "Helps evaluate the lungs, heart size, and other structures in the chest.",
        result:
          "Normal heart size, clear lung fields, no evidence of pneumonia or pneumothorax.",
        isHighYield: true
      },
      {
        id: "cbc",
        name: "Complete Blood Count (CBC)",
        category: "Lab",
        description:
          "General screening test for anemia, infection, and other blood conditions.",
        result: "Within normal limits.",
        isHighYield: false
      }
    ],
    // New diagnosis system
    finalDxId: "stemi",
    requiredMustNotMiss: ["stemi", "pe", "aortic_dissection"],
    dxOverrides: [
      {
        dxId: "stemi",
        yield: "correct",
        explanation: "Exertional pressure + radiation + ECG/troponin support MI. This is the best diagnosis: acute, pressure-like exertional chest pain with radiation, concerning vital signs, ST elevations on ECG, and elevated troponin all point to an acute myocardial infarction."
      },
      {
        dxId: "pe",
        yield: "dangerous-miss",
        explanation: "Pulmonary embolism is a must-not-miss diagnosis for chest pain, but the exertional onset, ECG changes, and troponin elevation point more strongly to cardiac cause."
      },
      {
        dxId: "aortic_dissection",
        yield: "dangerous-miss",
        explanation: "Aortic dissection is a must-not-miss diagnosis, but the classic cardiac presentation with ECG changes and troponin elevation makes MI more likely."
      },
      {
        dxId: "gerd",
        yield: "low",
        explanation: "GERD can cause burning chest discomfort, often related to meals and lying down, but it does not explain exertional chest pressure with radiation to the arm, sweating, and ECG changes."
      },
      {
        dxId: "panic",
        yield: "low",
        explanation: "Panic attacks can cause chest discomfort, shortness of breath, and sweating, but the exertional onset, classic pressure-like pain, radiation, and ECG/troponin findings point to a cardiac cause instead."
      },
      {
        dxId: "costochondritis",
        yield: "low",
        explanation: "Costochondritis can cause chest pain, but the exertional onset, cardiac findings, and troponin elevation make cardiac cause much more likely."
      }
    ],
    // Legacy diagnosisOptions kept for backward compatibility
    diagnosisOptions: [
      {
        id: "stemi",
        name: "ST-elevation myocardial infarction (heart attack)",
        isCorrect: true,
        isDangerous: true,
        explanation:
          "This is the best diagnosis: acute, pressure-like exertional chest pain with radiation, concerning vital signs, ST elevations on ECG, and elevated troponin all point to an acute myocardial infarction."
      },
      {
        id: "gerd",
        name: "Gastroesophageal reflux disease (GERD)",
        isCorrect: false,
        isDangerous: false,
        explanation:
          "GERD can cause burning chest discomfort, often related to meals and lying down, but it does not explain exertional chest pressure with radiation to the arm, sweating, and ECG changes."
      },
      {
        id: "panic-attack",
        name: "Panic attack",
        isCorrect: false,
        isDangerous: false,
        explanation:
          "Panic attacks can cause chest discomfort, shortness of breath, and sweating, but the exertional onset, classic pressure-like pain, radiation, and ECG/troponin findings point to a cardiac cause instead."
      }
    ],
    teachingPoints: [
      "Chest pain with exertion, pressure quality, and radiation to the arm are classic red flags for a cardiac cause.",
      "Vital signs and general appearance are critical in the first minutes of evaluation.",
      "Early ECG and cardiac enzymes (like troponin) are essential in suspected acute coronary syndrome.",
      "A good differential includes both common and life-threatening conditions, but life-threatening possibilities must be prioritized."
    ]
  },
  {
    id: "sudden-headache-er",
    title: "Sudden Severe Headache",
    specialty: "Emergency Medicine / Neurology",
    difficulty: "Intermediate",
    estimatedMinutes: 12,
    description:
      "A 42-year-old woman presents with a sudden, severe headache that started one hour ago.",
    objectives: [
      "Identify red flags in headache evaluation",
      "Differentiate primary vs secondary headache causes",
      "Recognize when urgent neuroimaging is required"
    ],
    patientPersona: {
      name: "Ms. Carter",
      age: 42,
      gender: "Female",
      chiefComplaint: "Worst headache of my life",
      background:
        "Previously healthy, no migraine history. Pain started suddenly while resting.",
      vitals: {
        heartRate: 96,
        bloodPressure: "158/92",
        respiratoryRate: 18,
        oxygenSat: "98%",
        temperature: "36.9°C"
      },
      keyHistoryPoints: [
        "Sudden onset",
        "Maximal intensity at onset",
        "No prior headache history",
        "Neck stiffness",
        "Nausea"
      ],
      redFlags: [
        "Thunderclap onset",
        "Neck stiffness",
        "No migraine history"
      ]
    },
    aiInstructions: {
      patientStyle:
        "Answer as Ms. Carter, a worried but cooperative patient. Use simple, natural language.",
      behaviorRules: [
        "Answer only as the patient. Do NOT speak as a doctor or give medical advice.",
        "Do NOT mention any disease names or diagnoses.",
        "Volunteer basic information about symptoms when asked open questions.",
        "Reveal specific details (like neck stiffness, photophobia, timing) only when the user asks clearly about them.",
        "If the user asks specifically for a diagnosis or what they should do in real life, respond that you are just a simulated patient and cannot give real-world medical advice."
      ],
      doNotRevealDirectly: [
        "This is a subarachnoid hemorrhage.",
        "SAH",
        "Brain bleed",
        "You need a CT scan.",
        "You need surgery."
      ]
    },
    physicalExam: [
      { id: "general", label: "General", summary: "Appears uncomfortable", details: "Photophobic, holding head" },
      { id: "neuro", label: "Neurologic", summary: "Alert, no focal deficits", details: "Mild neck stiffness present" }
    ],
    testOverrides: [
      {
        testId: "ct_head",
        result: "Acute subarachnoid hemorrhage visible.",
        yield: "high"
      }
    ],
    testDefaultBehavior: {
      labDefault: "Within normal limits.",
      imagingDefault: "No acute abnormality.",
      bedsideDefault: "No significant abnormality.",
      procedureDefault: "Not indicated in this case."
    },
    finalDxId: "subarachnoid_hemorrhage",
    requiredMustNotMiss: ["subarachnoid_hemorrhage"],
    dxOverrides: [
      {
        dxId: "subarachnoid_hemorrhage",
        yield: "correct",
        explanation: "Thunderclap headache with CT evidence of bleeding."
      },
      {
        dxId: "migraine",
        yield: "low",
        explanation: "Lacks migraine history and onset was sudden."
      }
    ],
    diagnosisOptions: [
      {
        id: "subarachnoid_hemorrhage",
        name: "Subarachnoid hemorrhage",
        isCorrect: true,
        isDangerous: true,
        explanation: "Thunderclap headache with CT evidence of bleeding."
      },
      {
        id: "migraine",
        name: "Migraine",
        isCorrect: false,
        isDangerous: false,
        explanation: "Lacks migraine history and onset was sudden."
      }
    ],
    teachingPoints: [
      "Thunderclap headache (sudden, maximal intensity) is a red flag requiring urgent evaluation.",
      "Neck stiffness in acute headache suggests meningeal irritation.",
      "CT head is the first-line imaging for suspected subarachnoid hemorrhage.",
      "Primary headaches (migraine, tension) typically have gradual onset, not thunderclap."
    ]
  },
  {
    id: "acute-sob-er",
    title: "Acute Shortness of Breath",
    specialty: "Emergency Medicine / Pulmonary",
    difficulty: "Intermediate",
    estimatedMinutes: 12,
    description:
      "A 60-year-old man presents with sudden onset shortness of breath.",
    objectives: [
      "Differentiate cardiac vs pulmonary causes",
      "Recognize pulmonary embolism red flags",
      "Select appropriate imaging"
    ],
    patientPersona: {
      name: "Mr. Daniels",
      age: 60,
      gender: "Male",
      chiefComplaint: "I can't catch my breath",
      background:
        "Recent long-distance flight. History of hypertension.",
      vitals: {
        heartRate: 112,
        bloodPressure: "138/86",
        respiratoryRate: 26,
        oxygenSat: "89%",
        temperature: "37.1°C"
      },
      keyHistoryPoints: [
        "Sudden onset dyspnea",
        "Recent immobilization",
        "Pleuritic chest pain"
      ],
      redFlags: [
        "Hypoxia",
        "Tachycardia",
        "Recent travel"
      ]
    },
    aiInstructions: {
      patientStyle:
        "Answer as Mr. Daniels, a slightly anxious but cooperative patient. Use simple, natural language.",
      behaviorRules: [
        "Answer only as the patient. Do NOT speak as a doctor or give medical advice.",
        "Do NOT mention any disease names or diagnoses.",
        "Volunteer basic information about symptoms when asked open questions.",
        "Reveal specific details (like recent travel, chest pain quality, timing) only when the user asks clearly about them.",
        "If the user asks specifically for a diagnosis or what they should do in real life, respond that you are just a simulated patient and cannot give real-world medical advice."
      ],
      doNotRevealDirectly: [
        "This is a pulmonary embolism.",
        "PE",
        "Blood clot",
        "You need a CT scan.",
        "You need blood thinners."
      ]
    },
    physicalExam: [
      { id: "respiratory", label: "Respiratory", summary: "Clear lungs", details: "No wheezes or crackles" },
      { id: "cardiac", label: "Cardiac", summary: "Tachycardic", details: "Regular rhythm" }
    ],
    testOverrides: [
      {
        testId: "ct_chest",
        result: "Large pulmonary embolus in right pulmonary artery.",
        yield: "high"
      }
    ],
    testDefaultBehavior: {
      labDefault: "Within normal limits.",
      imagingDefault: "No acute abnormality.",
      bedsideDefault: "No significant abnormality.",
      procedureDefault: "Not indicated in this case."
    },
    finalDxId: "pe",
    requiredMustNotMiss: ["pe"],
    dxOverrides: [
      {
        dxId: "pe",
        yield: "correct",
        explanation: "Acute dyspnea with risk factors and CT confirmation."
      },
      {
        dxId: "pneumonia",
        yield: "low",
        explanation: "No fever or lung findings."
      }
    ],
    diagnosisOptions: [
      {
        id: "pe",
        name: "Pulmonary embolism",
        isCorrect: true,
        isDangerous: true,
        explanation: "Acute dyspnea with risk factors and CT confirmation."
      },
      {
        id: "pneumonia",
        name: "Pneumonia",
        isCorrect: false,
        isDangerous: false,
        explanation: "No fever or lung findings."
      }
    ],
    teachingPoints: [
      "Acute dyspnea with hypoxia and risk factors (immobilization, travel) suggests pulmonary embolism.",
      "Pleuritic chest pain (worse with breathing) is common in PE.",
      "CT pulmonary angiography is the gold standard for PE diagnosis.",
      "Wells score and D-dimer can help risk-stratify before imaging."
    ]
  },
  {
    id: "rlq-abdominal-pain",
    title: "Right Lower Quadrant Abdominal Pain",
    specialty: "General Surgery / Emergency Medicine",
    difficulty: "Beginner",
    estimatedMinutes: 10,
    description:
      "A 19-year-old college student presents with abdominal pain.",
    objectives: [
      "Use location-based differential diagnosis",
      "Recognize appendicitis presentation",
      "Choose appropriate imaging"
    ],
    patientPersona: {
      name: "Alex",
      age: 19,
      gender: "Male",
      chiefComplaint: "Stomach pain",
      background:
        "Pain started near the belly button and moved to the right lower abdomen.",
      vitals: {
        heartRate: 102,
        bloodPressure: "124/78",
        respiratoryRate: 18,
        oxygenSat: "99%",
        temperature: "38.2°C"
      },
      keyHistoryPoints: [
        "Pain migration",
        "Loss of appetite",
        "Low-grade fever",
        "Nausea"
      ],
      redFlags: [
        "Localized RLQ pain",
        "Fever"
      ]
    },
    aiInstructions: {
      patientStyle:
        "Answer as Alex, a young adult who is uncomfortable but cooperative. Use simple, natural language.",
      behaviorRules: [
        "Answer only as the patient. Do NOT speak as a doctor or give medical advice.",
        "Do NOT mention any disease names or diagnoses.",
        "Volunteer basic information about symptoms when asked open questions.",
        "Reveal specific details (like pain migration, appetite changes, fever) only when the user asks clearly about them.",
        "If the user asks specifically for a diagnosis or what they should do in real life, respond that you are just a simulated patient and cannot give real-world medical advice."
      ],
      doNotRevealDirectly: [
        "This is appendicitis.",
        "You need surgery.",
        "Your appendix is inflamed."
      ]
    },
    physicalExam: [
      { id: "abdomen", label: "Abdomen", summary: "RLQ tenderness", details: "Rebound tenderness present" }
    ],
    testOverrides: [
      {
        testId: "ct_abdomen",
        result: "Enlarged appendix with surrounding inflammation.",
        yield: "high"
      }
    ],
    testDefaultBehavior: {
      labDefault: "Within normal limits.",
      imagingDefault: "No acute abnormality.",
      bedsideDefault: "No significant abnormality.",
      procedureDefault: "Not indicated in this case."
    },
    finalDxId: "appendicitis",
    requiredMustNotMiss: ["appendicitis"],
    dxOverrides: [
      {
        dxId: "appendicitis",
        yield: "correct",
        explanation: "Classic migratory pain with CT confirmation."
      },
      {
        dxId: "gastroenteritis",
        yield: "low",
        explanation: "Pain localization and exam findings inconsistent."
      }
    ],
    diagnosisOptions: [
      {
        id: "appendicitis",
        name: "Appendicitis",
        isCorrect: true,
        isDangerous: true,
        explanation: "Classic migratory pain with CT confirmation."
      },
      {
        id: "gastroenteritis",
        name: "Gastroenteritis",
        isCorrect: false,
        isDangerous: false,
        explanation: "Pain localization and exam findings inconsistent."
      }
    ],
    teachingPoints: [
      "Appendicitis classically presents with periumbilical pain that migrates to RLQ.",
      "Fever, loss of appetite, and rebound tenderness are supportive findings.",
      "CT abdomen/pelvis is highly sensitive and specific for appendicitis.",
      "Early recognition prevents perforation and complications."
    ]
  },
  {
    id: "fever-confusion",
    title: "Fever and Confusion",
    specialty: "Emergency Medicine / Infectious Disease",
    difficulty: "Advanced",
    estimatedMinutes: 14,
    description:
      "A 70-year-old woman presents with fever and acute confusion.",
    objectives: [
      "Recognize sepsis and CNS infection",
      "Prioritize dangerous diagnoses",
      "Interpret labs in systemic illness"
    ],
    patientPersona: {
      name: "Mrs. Huang",
      age: 70,
      gender: "Female",
      chiefComplaint: "Acting strange",
      background:
        "Family reports confusion began this morning. History of diabetes.",
      vitals: {
        heartRate: 118,
        bloodPressure: "92/58",
        respiratoryRate: 24,
        oxygenSat: "94%",
        temperature: "39.4°C"
      },
      keyHistoryPoints: [
        "Acute mental status change",
        "High fever",
        "Low blood pressure"
      ],
      redFlags: [
        "Hypotension",
        "Altered mental status",
        "High fever"
      ]
    },
    aiInstructions: {
      patientStyle:
        "Answer as Mrs. Huang, an elderly patient who may be confused. Family may provide additional history. Use simple, natural language.",
      behaviorRules: [
        "Answer only as the patient or family member. Do NOT speak as a doctor or give medical advice.",
        "Do NOT mention any disease names or diagnoses.",
        "Volunteer basic information about symptoms when asked open questions.",
        "Reveal specific details (like confusion onset, fever, blood pressure concerns) only when the user asks clearly about them.",
        "If the user asks specifically for a diagnosis or what they should do in real life, respond that you are just a simulated patient and cannot give real-world medical advice."
      ],
      doNotRevealDirectly: [
        "This is sepsis.",
        "She has an infection.",
        "You need antibiotics.",
        "She needs to be admitted."
      ]
    },
    physicalExam: [
      { id: "general", label: "General", summary: "Ill-appearing", details: "Confused, slow responses" },
      { id: "neuro", label: "Neurologic", summary: "Altered", details: "No focal deficits" }
    ],
    testOverrides: [
      {
        testId: "blood_culture",
        result: "Positive for gram-negative rods.",
        yield: "high"
      }
    ],
    testDefaultBehavior: {
      labDefault: "Within normal limits.",
      imagingDefault: "No acute abnormality.",
      bedsideDefault: "No significant abnormality.",
      procedureDefault: "Not indicated in this case."
    },
    finalDxId: "sepsis",
    requiredMustNotMiss: ["sepsis"],
    dxOverrides: [
      {
        dxId: "sepsis",
        yield: "correct",
        explanation: "Fever, hypotension, and altered mental status."
      },
      {
        dxId: "uti",
        yield: "reasonable",
        explanation: "Possible source in elderly but systemic signs dominate."
      }
    ],
    diagnosisOptions: [
      {
        id: "sepsis",
        name: "Sepsis",
        isCorrect: true,
        isDangerous: true,
        explanation: "Fever, hypotension, and altered mental status."
      },
      {
        id: "uti",
        name: "Urinary tract infection",
        isCorrect: false,
        isDangerous: false,
        explanation: "Possible source in elderly but systemic signs dominate."
      }
    ],
    teachingPoints: [
      "Sepsis is a medical emergency requiring immediate recognition and treatment.",
      "Altered mental status in the elderly with fever suggests systemic infection.",
      "Hypotension in sepsis indicates organ dysfunction and poor prognosis.",
      "Early antibiotics and fluid resuscitation are critical in sepsis management."
    ]
  }
];

