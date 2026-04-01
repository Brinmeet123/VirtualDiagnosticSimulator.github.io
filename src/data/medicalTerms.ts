import type { MedicalTerm } from '@/src/types/medicalTerm'

function slug(s: string): string {
  const x = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return x || 'term'
}

type Row = Omit<MedicalTerm, 'id' | 'normalizedTerm' | 'synonyms' | 'relatedTerms'> & {
  id?: string
  synonyms?: string[]
  relatedTerms?: string[]
}

function build(entries: Row[]): MedicalTerm[] {
  return entries.map((e) => ({
    ...e,
    id: e.id ?? slug(e.term),
    normalizedTerm: e.term.trim().toLowerCase().replace(/\s+/g, ' '),
    synonyms: e.synonyms ?? [],
    relatedTerms: e.relatedTerms ?? [],
  }))
}

/**
 * Local beginner-friendly clinical vocabulary (≥75 terms) for scenario learning.
 * Add rows here — lookup uses {@link '@/src/lib/medicalTerms'}.
 */
export const MEDICAL_TERMS: MedicalTerm[] = build([
  {
    term: 'chest pain',
    shortDefinition: 'Pain or discomfort in the chest area.',
    definition:
      'Pain or discomfort in the thoracic region; can be cardiac, pulmonary, musculoskeletal, or other etiologies.',
    category: 'Symptoms',
    synonyms: ['cp'],
    relatedTerms: ['angina', 'myocardial infarction', 'pulmonary embolism'],
    example: 'The patient reports pressure-like chest pain for one hour.',
    notes: 'Always consider life-threatening causes in the right clinical context.',
  },
  {
    term: 'dyspnea',
    shortDefinition: 'Shortness of breath or difficulty breathing.',
    definition:
      'Subjective sense of uncomfortable breathing; common in heart failure, asthma, PE, anemia, and deconditioning.',
    category: 'Symptoms',
    synonyms: ['shortness of breath', 'SOB', 'breathlessness'],
    relatedTerms: ['tachypnea', 'hypoxia', 'wheezing'],
    example: 'Dyspnea worsened when climbing stairs.',
  },
  {
    term: 'tachycardia',
    shortDefinition: 'Heart rate faster than normal (often >100 bpm in adults).',
    definition:
      'Elevated heart rate; may reflect pain, fever, dehydration, arrhythmia, PE, anemia, or stimulant effect.',
    category: 'Vitals',
    synonyms: ['fast heart rate'],
    relatedTerms: ['palpitations', 'arrhythmia', 'hypotension'],
  },
  {
    term: 'bradycardia',
    shortDefinition: 'Heart rate slower than normal (often <60 bpm in adults).',
    definition:
      'Slow heart rate; may be normal in athletes or due to medications, heart block, or ischemia.',
    category: 'Vitals',
    relatedTerms: ['syncope', 'heart block', 'beta blocker'],
  },
  {
    term: 'palpitations',
    shortDefinition: 'Awareness of heartbeat (racing, pounding, or skipping).',
    definition:
      'Patient-reported sensation of abnormal heartbeats; can be benign or reflect arrhythmia.',
    category: 'Symptoms',
    relatedTerms: ['tachycardia', 'arrhythmia', 'anxiety'],
  },
  {
    term: 'diaphoresis',
    shortDefinition: 'Heavy sweating, often from pain, fever, or shock.',
    definition:
      'Profuse sweating from sympathetic activation; concerning with chest pain (possible ACS).',
    category: 'Exam',
    synonyms: ['sweating'],
    relatedTerms: ['myocardial infarction', 'shock', 'hypoglycemia'],
  },
  {
    term: 'nausea',
    shortDefinition: 'Feeling like you may vomit.',
    definition:
      'Unpleasant urge to vomit; seen in GI illness, migraine, pregnancy, and can accompany MI.',
    category: 'Symptoms',
    relatedTerms: ['vomiting', 'gastroenteritis'],
  },
  {
    term: 'syncope',
    shortDefinition: 'Fainting or brief loss of consciousness.',
    definition:
      'Transient loss of consciousness from cerebral hypoperfusion; evaluate for cardiac, reflex, or orthostatic causes.',
    category: 'Symptoms',
    synonyms: ['fainting'],
    relatedTerms: ['hypotension', 'arrhythmia', 'dehydration'],
  },
  {
    term: 'myocardial infarction',
    shortDefinition: 'Heart attack — heart muscle injury from blocked blood flow.',
    definition:
      'Acute coronary syndrome with myocardial necrosis; diagnosed with symptoms, ECG, and troponin.',
    category: 'Cardiology',
    synonyms: ['MI', 'heart attack', 'STEMI', 'NSTEMI'],
    relatedTerms: ['troponin', 'ECG', 'angina', 'ischemia'],
  },
  {
    term: 'angina',
    shortDefinition: 'Chest pain from reduced blood flow to heart muscle.',
    definition:
      'Ischemic chest discomfort, often exertional; unstable angina is an ACS spectrum diagnosis.',
    category: 'Cardiology',
    relatedTerms: ['chest pain', 'myocardial infarction', 'ischemia'],
  },
  {
    term: 'pulmonary embolism',
    shortDefinition: 'A blood clot blocking an artery in the lung.',
    definition:
      'PE causes ventilation-perfusion mismatch; can present with dyspnea, pleuritic pain, tachycardia, hypoxia.',
    category: 'Pulmonary',
    synonyms: ['PE'],
    relatedTerms: ['hypoxia', 'tachycardia', 'dyspnea', 'D-dimer'],
  },
  {
    term: 'hypoxia',
    shortDefinition: 'Low oxygen in the blood or tissues.',
    definition:
      'Inadequate oxygenation; often assessed with pulse oximetry and blood gas.',
    category: 'Pathophysiology',
    synonyms: ['low oxygen'],
    relatedTerms: ['cyanosis', 'pneumonia', 'pulmonary embolism'],
  },
  {
    term: 'cyanosis',
    shortDefinition: 'Bluish skin or lips from low oxygen.',
    definition:
      'Bluish discoloration reflecting deoxygenated hemoglobin; indicates serious hypoxemia in many cases.',
    category: 'Exam',
    relatedTerms: ['hypoxia', 'respiratory distress'],
  },
  {
    term: 'wheezing',
    shortDefinition: 'High-pitched whistling sound when breathing (often exhaling).',
    definition:
      'Musical airway sound from narrowed bronchi; common in asthma and COPD exacerbations.',
    category: 'Exam',
    relatedTerms: ['asthma', 'COPD', 'stridor'],
  },
  {
    term: 'crackles',
    shortDefinition: 'Fine crackling lung sounds (often called “rales”).',
    definition:
      'Discontinuous lung sounds from fluid or reopened alveoli; seen in pneumonia, edema, fibrosis.',
    category: 'Exam',
    synonyms: ['rales'],
    relatedTerms: ['pneumonia', 'heart failure', 'auscultation'],
  },
  {
    term: 'rales',
    shortDefinition: 'Older term for crackles — discontinuous lung sounds.',
    definition:
      'Non-musical “crackling” heard on inspiration; often used interchangeably with crackles in teaching.',
    category: 'Exam',
    synonyms: ['crackles'],
    relatedTerms: ['pneumonia', 'pulmonary edema'],
  },
  {
    term: 'fever',
    shortDefinition: 'Elevated body temperature, often from infection or inflammation.',
    definition:
      'Fever supports infection or inflammatory processes; interpret with vitals and exam.',
    category: 'Vitals',
    relatedTerms: ['sepsis', 'infection', 'meningitis'],
  },
  {
    term: 'sepsis',
    shortDefinition: 'Life-threatening organ dysfunction from infection.',
    definition:
      'Dysregulated host response to infection; may include hypotension, confusion, and lactate elevation.',
    category: 'Infectious disease',
    relatedTerms: ['fever', 'hypotension', 'lactate', 'leukocytosis'],
  },
  {
    term: 'dehydration',
    shortDefinition: 'Too little body water — often from losses or poor intake.',
    definition:
      'Volume depletion can cause tachycardia, orthostasis, dry mucosa, and acute kidney injury.',
    category: 'Pathophysiology',
    relatedTerms: ['hypotension', 'acute kidney injury', 'orthostatic'],
  },
  {
    term: 'confusion',
    shortDefinition: 'Disorganized thinking or altered awareness.',
    definition:
      'Acute confusion often prompts evaluation for infection, metabolic causes, intoxication, or stroke.',
    category: 'Neurology',
    relatedTerms: ['altered mental status', 'delirium', 'meningitis'],
  },
  {
    term: 'altered mental status',
    shortDefinition: 'Change in alertness, orientation, or cognition.',
    definition:
      'Umbrella term for acute changes; requires structured assessment (infection, stroke, toxins, withdrawal).',
    category: 'Neurology',
    synonyms: ['AMS'],
    relatedTerms: ['confusion', 'sepsis', 'stroke', 'hypoglycemia'],
  },
  {
    term: 'meningitis',
    shortDefinition: 'Inflammation of the membranes around the brain and spinal cord.',
    definition:
      'Can present with fever, headache, neck stiffness, photophobia; bacterial meningitis is an emergency.',
    category: 'Infectious disease',
    relatedTerms: ['fever', 'headache', 'Kernig sign'],
  },
  {
    term: 'appendicitis',
    shortDefinition: 'Inflammation of the appendix.',
    definition:
      'Classic pattern: periumbilical pain migrating to RLQ with nausea; may have rebound/guarding.',
    category: 'Gastroenterology',
    relatedTerms: ['rebound tenderness', 'guarding', 'McBurney point'],
  },
  {
    term: 'rebound tenderness',
    shortDefinition: 'More pain when pressure is suddenly released on the abdomen.',
    definition:
      'Suggests peritoneal irritation; evaluate for surgical abdomen causes (e.g., appendicitis).',
    category: 'Exam',
    synonyms: ['rebound', 'Blumberg sign'],
    relatedTerms: ['guarding', 'peritonitis', 'appendicitis'],
  },
  {
    term: 'guarding',
    shortDefinition: 'Involuntary muscle tightening to protect a painful abdomen.',
    definition:
      'Voluntary or involuntary guarding raises concern for peritoneal inflammation.',
    category: 'Exam',
    relatedTerms: ['rebound tenderness', 'appendicitis'],
  },
  {
    term: 'troponin',
    shortDefinition: 'Blood test for heart muscle injury.',
    definition:
      'Cardiac troponins are central to diagnosing myocardial infarction alongside ECG and symptoms.',
    category: 'Laboratory',
    relatedTerms: ['myocardial infarction', 'ECG', 'ACS'],
  },
  {
    term: 'ECG',
    shortDefinition: 'Recording of the heart’s electrical activity.',
    definition:
      'Electrocardiogram used to detect ischemia, infarction, arrhythmias, and electrolyte effects.',
    category: 'Diagnostics',
    synonyms: ['EKG', 'electrocardiogram'],
    relatedTerms: ['arrhythmia', 'ischemia', 'troponin'],
  },
  {
    term: 'CBC',
    shortDefinition: 'Blood counts — red cells, white cells, and platelets.',
    definition:
      'Complete blood count helps evaluate anemia, infection (leukocytosis), and marrow problems.',
    category: 'Laboratory',
    synonyms: ['complete blood count'],
    relatedTerms: ['anemia', 'leukocytosis', 'infection'],
  },
  {
    term: 'CT scan',
    shortDefinition: 'Cross-sectional X-ray imaging of the body.',
    definition:
      'CT is fast and widely used for trauma, stroke, PE protocols, and abdominal emergencies.',
    category: 'Imaging',
    synonyms: ['computed tomography', 'CAT scan'],
    relatedTerms: ['appendicitis', 'pulmonary embolism', 'stroke'],
  },
  {
    term: 'MRI',
    shortDefinition: 'Detailed imaging using magnetic fields (no ionizing radiation).',
    definition:
      'MRI excels for soft tissues (brain, spine, MSK); slower and contraindicated with some implants.',
    category: 'Imaging',
    synonyms: ['magnetic resonance imaging'],
    relatedTerms: ['stroke', 'spinal cord'],
  },
  {
    term: 'arrhythmia',
    shortDefinition: 'Abnormal heart rhythm.',
    definition:
      'Includes AFib, VTach, heart blocks, and many others; symptoms range from palpitations to syncope.',
    category: 'Cardiology',
    relatedTerms: ['ECG', 'palpitations', 'syncope'],
  },
  {
    term: 'ischemia',
    shortDefinition: 'Inadequate blood supply to tissue.',
    definition:
      'Cardiac ischemia underlies angina and MI; time-sensitive diagnosis and treatment matter.',
    category: 'Pathophysiology',
    relatedTerms: ['angina', 'myocardial infarction', 'ECG'],
  },
  {
    term: 'edema',
    shortDefinition: 'Swelling from fluid in tissues.',
    definition:
      'Peripheral edema is common in heart failure, venous disease, liver disease, and nephrotic states.',
    category: 'Exam',
    relatedTerms: ['heart failure', 'hypoalbuminemia'],
  },
  {
    term: 'erythema',
    shortDefinition: 'Redness of the skin from inflammation or irritation.',
    definition:
      'Seen in infections, rashes, and cellulitis; interpret with warmth, tenderness, and borders.',
    category: 'Exam',
    relatedTerms: ['cellulitis', 'rash'],
  },
  {
    term: 'hematoma',
    shortDefinition: 'A collection of blood under the skin or in tissue.',
    definition:
      'Localized bleeding after trauma or procedure; large hematomas may need evaluation.',
    category: 'Pathophysiology',
    relatedTerms: ['contusion', 'hemorrhage'],
  },
  {
    term: 'hemoptysis',
    shortDefinition: 'Coughing up blood from the lungs or airways.',
    definition:
      'Can range from streaky sputum to massive bleeding; differential includes infection, PE, malignancy.',
    category: 'Symptoms',
    relatedTerms: ['pneumonia', 'pulmonary embolism', 'bronchiectasis'],
  },
  {
    term: 'hypotension',
    shortDefinition: 'Low blood pressure.',
    definition:
      'May reflect shock, dehydration, sepsis, bleeding, or medication effect; assess perfusion.',
    category: 'Vitals',
    synonyms: ['low blood pressure'],
    relatedTerms: ['shock', 'sepsis', 'syncope'],
  },
  {
    term: 'hypertension',
    shortDefinition: 'High blood pressure.',
    definition:
      'Chronic hypertension increases stroke and MI risk; acute severe hypertension needs careful management.',
    category: 'Vitals',
    synonyms: ['high blood pressure'],
    relatedTerms: ['stroke', 'kidney disease'],
  },
  {
    term: 'anemia',
    shortDefinition: 'Low red blood cells or hemoglobin.',
    definition:
      'Causes fatigue, pallor, and dyspnea on exertion; evaluate for blood loss vs production issues.',
    category: 'Laboratory',
    relatedTerms: ['CBC', 'fatigue', 'pallor'],
  },
  {
    term: 'pneumonia',
    shortDefinition: 'Infection and inflammation of the lung tissue.',
    definition:
      'Presents with cough, fever, dyspnea; exam may show crackles; diagnosis supported by imaging.',
    category: 'Pulmonary',
    relatedTerms: ['fever', 'crackles', 'chest x-ray'],
  },
  {
    term: 'leukocytosis',
    shortDefinition: 'High white blood cell count.',
    definition:
      'Often suggests infection or inflammation; interpret with clinical context and differential.',
    category: 'Laboratory',
    relatedTerms: ['CBC', 'sepsis', 'infection'],
  },
  {
    term: 'auscultation',
    shortDefinition: 'Listening to body sounds with a stethoscope.',
    definition:
      'Core exam skill for heart, lung, and abdominal sounds.',
    category: 'Exam',
    relatedTerms: ['murmur', 'wheezing', 'crackles'],
  },
  {
    term: 'tachypnea',
    shortDefinition: 'Breathing faster than normal.',
    definition:
      'Elevated respiratory rate from pain, anxiety, hypoxia, acidosis, fever, or lung disease.',
    category: 'Vitals',
    relatedTerms: ['dyspnea', 'hypoxia', 'sepsis'],
  },
  {
    term: 'vomiting',
    shortDefinition: 'Forceful expulsion of stomach contents.',
    definition:
      'Common in gastroenteritis; also seen in raised intracranial pressure, obstruction, and pregnancy.',
    category: 'Symptoms',
    relatedTerms: ['nausea', 'dehydration'],
  },
  {
    term: 'dizziness',
    shortDefinition: 'Lightheadedness or feeling unsteady.',
    definition:
      'Can represent presyncope, vertigo, or multisensory imbalance; narrow with history.',
    category: 'Symptoms',
    relatedTerms: ['syncope', 'vertigo'],
  },
  {
    term: 'fatigue',
    shortDefinition: 'Overwhelming tiredness or low energy.',
    definition:
      'Nonspecific; includes anemia, sleep disorders, depression, thyroid disease, and heart failure.',
    category: 'Symptoms',
    relatedTerms: ['anemia', 'depression'],
  },
  {
    term: 'pallor',
    shortDefinition: 'Pale appearance of skin.',
    definition:
      'May reflect anemia, hypoperfusion, or shock; combine with vitals and hemoglobin.',
    category: 'Exam',
    relatedTerms: ['anemia', 'shock'],
  },
  {
    term: 'jaundice',
    shortDefinition: 'Yellowing of skin or eyes from bilirubin.',
    definition:
      'Suggests hepatobiliary disease or hemolysis; evaluate liver enzymes and bilirubin fractionation.',
    category: 'Exam',
    relatedTerms: ['liver', 'bilirubin'],
  },
  {
    term: 'murmur',
    shortDefinition: 'Extra heart sound from turbulent blood flow.',
    definition:
      'May be innocent or pathologic; often evaluated with echocardiography when clinically indicated.',
    category: 'Exam',
    synonyms: ['heart murmur'],
    relatedTerms: ['auscultation', 'valve'],
  },
  {
    term: 'stridor',
    shortDefinition: 'High-pitched inspiratory sound from upper airway narrowing.',
    definition:
      'Suggests obstruction at or above the vocal cords; may be emergent.',
    category: 'Exam',
    relatedTerms: ['airway', 'croup'],
  },
  {
    term: 'tenderness',
    shortDefinition: 'Pain when an area is touched.',
    definition:
      'Localizes inflammation or injury on exam (abdomen, chest wall, sinuses).',
    category: 'Exam',
    relatedTerms: ['rebound tenderness', 'peritonitis'],
  },
  {
    term: 'chest x-ray',
    shortDefinition: 'X-ray image of the chest.',
    definition:
      'Screens for pneumonia, effusion, pneumothorax, and some heart/lung abnormalities.',
    category: 'Imaging',
    synonyms: ['CXR'],
    relatedTerms: ['pneumonia', 'heart failure'],
  },
  {
    term: 'D-dimer',
    shortDefinition: 'Blood test related to clot breakdown — used in PE/DVT workups.',
    definition:
      'High sensitivity to rule out clots in low-risk patients; can be elevated in many conditions.',
    category: 'Laboratory',
    relatedTerms: ['pulmonary embolism', 'DVT'],
  },
  {
    term: 'heart failure',
    shortDefinition: 'Heart cannot pump well enough for the body’s needs.',
    definition:
      'May cause dyspnea, edema, orthopnea; treated with guideline-directed medical therapy.',
    category: 'Cardiology',
    relatedTerms: ['edema', 'crackles', 'BNP'],
  },
  {
    term: 'asthma',
    shortDefinition: 'Chronic airway inflammation with reversible obstruction.',
    definition:
      'Episodic wheezing and dyspnea; triggers include allergens, exercise, and URIs.',
    category: 'Pulmonary',
    relatedTerms: ['wheezing', 'albuterol'],
  },
  {
    term: 'COPD',
    shortDefinition: 'Chronic lung disease with airflow limitation (often from smoking).',
    definition:
      'Includes emphysema and chronic bronchitis; presents with cough, sputum, and dyspnea.',
    category: 'Pulmonary',
    synonyms: ['chronic obstructive pulmonary disease'],
    relatedTerms: ['wheezing', 'smoking'],
  },
  {
    term: 'gastroenteritis',
    shortDefinition: 'Inflammation of stomach/intestines — “stomach bug.”',
    definition:
      'Often viral; presents with diarrhea, vomiting, and cramping; focus on hydration.',
    category: 'Gastroenterology',
    relatedTerms: ['dehydration', 'nausea'],
  },
  {
    term: 'stroke',
    shortDefinition: 'Brain injury from blocked or burst blood vessel.',
    definition:
      'Sudden focal deficits; emergent imaging and time-sensitive therapies may apply.',
    category: 'Neurology',
    synonyms: ['CVA', 'cerebrovascular accident'],
    relatedTerms: ['CT scan', 'MRI', 'TIA'],
  },
  {
    term: 'seizure',
    shortDefinition: 'Abnormal electrical activity in the brain causing symptoms.',
    definition:
      'May be provoked or epilepsy; protect airway, evaluate first-time seizures carefully.',
    category: 'Neurology',
    relatedTerms: ['altered mental status', 'EEG'],
  },
  {
    term: 'migraine',
    shortDefinition: 'Episodic severe headache, often with nausea or light sensitivity.',
    definition:
      'Primary headache disorder; red flags warrant imaging when atypical or thunderclap.',
    category: 'Neurology',
    relatedTerms: ['headache', 'photophobia'],
  },
  {
    term: 'headache',
    shortDefinition: 'Pain in the head — many causes from benign to emergent.',
    definition:
      'Use red-flag features (thunderclap, neuro deficits, fever with meningismus) to risk-stratify.',
    category: 'Symptoms',
    relatedTerms: ['migraine', 'meningitis', 'subarachnoid hemorrhage'],
  },
  {
    term: 'abdominal pain',
    shortDefinition: 'Pain anywhere in the belly — very broad differential.',
    definition:
      'Localize by quadrant; consider GI, renal, gynecologic, and vascular emergencies.',
    category: 'Symptoms',
    relatedTerms: ['appendicitis', 'cholecystitis', 'pancreatitis'],
  },
  {
    term: 'shortness of breath',
    shortDefinition: 'Difficulty breathing or feeling air hungry.',
    definition:
      'Overlap with dyspnea; causes span cardiac, pulmonary, anemia, anxiety, and deconditioning.',
    category: 'Symptoms',
    relatedTerms: ['dyspnea', 'heart failure', 'asthma'],
  },
  {
    term: 'diabetes',
    shortDefinition: 'Chronic high blood sugar from insulin problems.',
    definition:
      'Type 1 vs Type 2 differ in mechanism; complications include vascular and nerve damage.',
    category: 'Endocrine',
    relatedTerms: ['hyperglycemia', 'HbA1c'],
  },
  {
    term: 'infection',
    shortDefinition: 'Invasion by microbes causing illness.',
    definition:
      'May be localized or systemic; fever and leukocytosis are common clues.',
    category: 'General',
    relatedTerms: ['fever', 'sepsis', 'antibiotics'],
  },
  {
    term: 'inflammation',
    shortDefinition: 'Body’s response to injury or infection (redness, heat, swelling, pain).',
    definition:
      'Mediated by immune cells and cytokines; chronic inflammation contributes to many diseases.',
    category: 'Pathophysiology',
    relatedTerms: ['infection', 'erythema'],
  },
  {
    term: 'acute',
    shortDefinition: 'Sudden onset or short duration.',
    definition:
      'Contrasts with chronic; timelines vary by organ system.',
    category: 'Terminology',
    relatedTerms: ['chronic'],
  },
  {
    term: 'chronic',
    shortDefinition: 'Long-lasting condition (often months to years).',
    definition:
      'Management focuses on control, complications, and patient education.',
    category: 'Terminology',
    relatedTerms: ['acute'],
  },
  {
    term: 'diagnosis',
    shortDefinition: 'Naming the disease or condition explaining the findings.',
    definition:
      'Built from history, exam, and tests; always include a differential.',
    category: 'Terminology',
    relatedTerms: ['differential diagnosis'],
  },
  {
    term: 'differential diagnosis',
    shortDefinition: 'List of possible explanations for a patient’s presentation.',
    definition:
      'Structured reasoning to avoid premature closure; update as data arrive.',
    category: 'Terminology',
    synonyms: ['differential', 'DDx'],
    relatedTerms: ['diagnosis'],
  },
  {
    term: 'symptom',
    shortDefinition: 'What the patient feels or reports.',
    definition:
      'Contrasts with signs, which are observed or measured.',
    category: 'Terminology',
    relatedTerms: ['sign'],
  },
  {
    term: 'sign',
    shortDefinition: 'Objective finding on exam or testing.',
    definition:
      'Examples: fever (measured), rash (seen), murmur (heard).',
    category: 'Terminology',
    relatedTerms: ['symptom'],
  },
  {
    term: 'vital signs',
    shortDefinition: 'Core measurements like HR, BP, RR, temperature, oxygen.',
    definition:
      'Track stability and response to therapy; trends matter.',
    category: 'Vitals',
    synonyms: ['vitals'],
    relatedTerms: ['tachycardia', 'hypotension', 'fever'],
  },
  {
    term: 'physical exam',
    shortDefinition: 'Hands-on evaluation — look, listen, feel.',
    definition:
      'Structured inspection, palpation, percussion, auscultation.',
    category: 'Terminology',
    relatedTerms: ['auscultation', 'inspection'],
  },
  {
    term: 'medical history',
    shortDefinition: 'Past health, meds, allergies, family, and social context.',
    definition:
      'Essential for drug safety, risk factors, and chronic disease context.',
    category: 'Terminology',
    relatedTerms: ['chief complaint', 'HPI'],
  },
  {
    term: 'chief complaint',
    shortDefinition: 'Main reason for the visit in the patient’s words.',
    definition:
      'Drives the interview; document verbatim when possible.',
    category: 'Terminology',
    synonyms: ['CC'],
    relatedTerms: ['HPI'],
  },
  {
    term: 'red flag',
    shortDefinition: 'Warning feature suggesting serious disease.',
    definition:
      'Examples: thunderclap headache, chest pain with diaphoresis, focal neuro deficits.',
    category: 'Terminology',
    synonyms: ['red-flag'],
    relatedTerms: ['differential diagnosis'],
  },
  {
    term: 'treatment',
    shortDefinition: 'Interventions to cure, control, or prevent illness.',
    definition:
      'Includes medications, procedures, counseling, and follow-up.',
    category: 'Terminology',
    relatedTerms: ['plan', 'disposition'],
  },
  {
    term: 'medication',
    shortDefinition: 'Drug therapy used to treat or prevent disease.',
    definition:
      'Review allergies, interactions, adherence, and renal dosing.',
    category: 'Terminology',
    relatedTerms: ['prescription', 'adverse effect'],
  },
  {
    term: 'allergy',
    shortDefinition: 'Abnormal immune reaction to a substance.',
    definition:
      'Drug allergies must be documented clearly to avoid re-exposure.',
    category: 'Terminology',
    relatedTerms: ['anaphylaxis', 'rash'],
  },
  {
    term: 'HPI',
    shortDefinition: 'History of present illness — story of the current problem.',
    definition:
      'Includes onset, location, duration, character, aggravating/relieving factors, and associated symptoms.',
    category: 'Terminology',
    synonyms: ['history of present illness'],
    relatedTerms: ['chief complaint', 'review of systems'],
  },
  {
    term: 'orthopnea',
    shortDefinition: 'Shortness of breath when lying flat.',
    definition:
      'Suggests pulmonary edema or severe heart failure until proven otherwise.',
    category: 'Symptoms',
    relatedTerms: ['heart failure', 'dyspnea'],
  },
  {
    term: 'photophobia',
    shortDefinition: 'Light sensitivity — often with migraine or meningitis.',
    definition:
      'Ask about neck stiffness and fever when infection is a concern.',
    category: 'Symptoms',
    relatedTerms: ['migraine', 'meningitis'],
  },
  {
    term: 'petechiae',
    shortDefinition: 'Tiny red/purple dots from bleeding under the skin.',
    definition:
      'Non-blanching rash; concerning for platelet disorders or meningococcemia in fever.',
    category: 'Exam',
    relatedTerms: ['meningitis', 'thrombocytopenia'],
  },
  {
    term: 'urticaria',
    shortDefinition: 'Raised itchy hives from histamine release.',
    definition:
      'Often allergic; anaphylaxis if airway or hypotension involved.',
    category: 'Dermatology',
    synonyms: ['hives'],
    relatedTerms: ['allergy', 'anaphylaxis'],
  },
  {
    term: 'lactate',
    shortDefinition: 'Blood marker of tissue hypoperfusion and anaerobic metabolism.',
    definition:
      'Elevated in shock and sepsis; used with clinical assessment.',
    category: 'Laboratory',
    synonyms: ['lactic acid'],
    relatedTerms: ['sepsis', 'shock'],
  },
  {
    term: 'basic metabolic panel',
    shortDefinition: 'Blood chemistry panel (often includes sodium, potassium, creatinine, glucose).',
    definition:
      'Common lab for electrolytes, kidney function, and glucose — useful in many acute presentations.',
    category: 'Laboratory',
    synonyms: ['BMP', 'chem 8'],
    relatedTerms: ['acute kidney injury', 'dehydration'],
  },
])
