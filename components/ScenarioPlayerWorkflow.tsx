'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Scenario, StabilityStatus, HPI, MedicalBackground, ProblemRepresentation as ProblemRepType, DifferentialDiagnosis, FinalDiagnosis, Plan } from '@/data/scenarios'
import { getMockAssessment } from '@/lib/mockResponses'
import DoctorPatientScene from './DoctorPatientScene'
import ChatPanel from './ChatPanel'
import SafetyCheck from './SafetyCheck'
import HPIForm from './HPIForm'
import MedicalBackgroundForm from './MedicalBackgroundForm'
import ProblemRepresentation from './ProblemRepresentation'
import PhysicalExamPanel from './PhysicalExamPanel'
import TestsPanel from './TestsPanel'
import DifferentialDiagnosisBuilder from './DifferentialDiagnosisBuilder'
import ClinicalReasoningUpdate from './ClinicalReasoningUpdate'
import DiagnosisPanel from './DiagnosisPanel'
import PatientCommunication from './PatientCommunication'
import PlanDisposition from './PlanDisposition'
import SummaryPanel from './SummaryPanel'
import VocabContextBlock from './VocabContextBlock'

type Message = {
  role: 'doctor' | 'patient'
  content: string
}

type AssessmentResult = {
  overallRating: string
  summary: string
  strengths: string[]
  areasForImprovement: string[]
  diagnosisFeedback: string
  missedKeyHistoryPoints: string[]
  testSelectionFeedback: string
  totalScore?: number
  totalScorePercentage?: number
  maxScore?: number
  debriefStructured?: {
    summary: string
    strengths: string[]
    missedOpportunities: string[]
    diagnosticReasoning: string[]
    nextStepAdvice: string[]
    clinicalPearls: string[]
    vocabToReview: string[]
  }
  source?: string
  scores?: {
    historyTaking?: number
    redFlags?: number
    physicalExam?: number
    testSelection?: number
    differential?: number
    finalDiagnosis?: number
    explanation?: number
  }
}

type WorkflowStep = 
  | 'safety' 
  | 'chief-complaint' 
  | 'history' 
  | 'background' 
  | 'problem-rep' 
  | 'exam' 
  | 'differential' 
  | 'tests' 
  | 'reasoning' 
  | 'final-diagnosis' 
  | 'communication' 
  | 'plan' 
  | 'debrief'

export default function ScenarioPlayerWorkflow({ scenario }: { scenario: Scenario }) {
  const { data: session, status: sessionStatus } = useSession()
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('safety')
  
  // Workflow state
  const [stability, setStability] = useState<StabilityStatus | null>(null)
  const [redFlagsFound, setRedFlagsFound] = useState<string[]>([])
  const [chiefComplaint, setChiefComplaint] = useState(scenario.patientPersona.chiefComplaint)
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [hpi, setHpi] = useState<HPI | null>(null)
  const [background, setBackground] = useState<MedicalBackground | null>(null)
  const [problemRep, setProblemRep] = useState<ProblemRepType | null>(null)
  const [viewedExamSections, setViewedExamSections] = useState<string[]>([])
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([])
  const [orderedTests, setOrderedTests] = useState<Map<string, { testId: string; result: string }>>(new Map())
  const [reasoningUpdates, setReasoningUpdates] = useState<Array<{ id: string; moved: 'up' | 'down'; reasoning: string }>>([])
  const [finalDiagnosis, setFinalDiagnosis] = useState<FinalDiagnosis | null>(null)
  const [patientExplanation, setPatientExplanation] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false)

  const handleSafetyComplete = (status: StabilityStatus, flags: string[]) => {
    setStability(status)
    setRedFlagsFound(flags)
    setCurrentStep('chief-complaint')
  }

  const handleChiefComplaintComplete = () => {
    setCurrentStep('history')
  }

  const handleHPIComplete = (hpiData: HPI) => {
    setHpi(hpiData)
    setCurrentStep('background')
  }

  const handleBackgroundComplete = (bg: MedicalBackground) => {
    setBackground(bg)
    setCurrentStep('problem-rep')
  }

  const handleProblemRepComplete = (pr: ProblemRepType) => {
    setProblemRep(pr)
    setCurrentStep('exam')
  }

  const handleExamComplete = () => {
    setCurrentStep('differential')
  }

  const handleDifferentialComplete = (diffs: DifferentialDiagnosis[]) => {
    setDifferentials(diffs)
    setCurrentStep('tests')
  }

  const handleTestsComplete = () => {
    setCurrentStep('reasoning')
  }

  const handleReasoningComplete = (updates: Array<{ id: string; moved: 'up' | 'down'; reasoning: string }>) => {
    setReasoningUpdates(updates)
    setCurrentStep('final-diagnosis')
  }

  const handleFinalDiagnosisComplete = async (data: {
    differentialDetailed: Array<{ dxId: string; rank: number; confidence: 'High' | 'Medium' | 'Low'; note?: string }>
    finalDxId: string | null
    missingMustNotMiss: string[]
  }) => {
    // Convert to legacy format for compatibility
    if (data.finalDxId) {
      setFinalDiagnosis({
        diagnosisId: data.finalDxId,
        confidence: data.differentialDetailed.find(d => d.dxId === data.finalDxId)?.confidence || 'Medium',
        nextSteps: ''
      })
    }
    setCurrentStep('communication')
  }

  const handleCommunicationComplete = (explanation: string) => {
    setPatientExplanation(explanation)
    setCurrentStep('plan')
  }

  const handlePlanComplete = async (planData: Plan) => {
    setPlan(planData)
    setIsLoadingAssessment(true)
    setCurrentStep('debrief')

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          stability,
          redFlagsFound,
          chiefComplaint,
          chat: chatMessages,
          hpi,
          background,
          problemRep,
          viewedExamSections,
          differentials,
          orderedTests: Array.from(orderedTests.keys()),
          reasoningUpdates,
          finalDiagnosis,
          patientExplanation,
          plan: planData,
        }),
      })

      if (!response.ok) {
        // Static hosting (e.g. GitHub Pages): no API — use client-side mock
        setAssessment(getMockAssessment() as AssessmentResult)
        return
      }

      const result = await response.json()
      
      // Check if result has error
      if (result.error) {
        throw new Error(result.error)
      }
      
      setAssessment(result)

      if (
        sessionStatus === 'authenticated' &&
        session?.user &&
        typeof result.totalScore === 'number' &&
        Number.isFinite(result.totalScore)
      ) {
        void fetch('/api/scenario-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: scenario.id,
            score: Math.round(result.totalScore),
            status: typeof result.overallRating === 'string' ? result.overallRating : 'completed',
          }),
        }).catch(() => {
          /* non-blocking */
        })
      }
    } catch (error: any) {
      console.error('Error:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Load failed')
      if (isNetworkError) {
        setAssessment(getMockAssessment() as AssessmentResult)
        return
      }

      setAssessment({
        overallRating: 'Error',
        summary:
          'There was an error generating your assessment. Run Ollama (ollama serve) or set DEMO_MODE=true for mocks.',
        strengths: [],
        areasForImprovement: [errorMessage],
        diagnosisFeedback: '',
        missedKeyHistoryPoints: [],
        testSelectionFeedback: '',
      })
    } finally {
      setIsLoadingAssessment(false)
    }
  }

  const steps: { id: WorkflowStep; label: string }[] = [
    { id: 'safety', label: '0. Safety' },
    { id: 'chief-complaint', label: '1. CC' },
    { id: 'history', label: '2. HPI' },
    { id: 'background', label: '3. Background' },
    { id: 'problem-rep', label: '4. Problem Rep' },
    { id: 'exam', label: '5. Exam' },
    { id: 'differential', label: '6. DDx' },
    { id: 'tests', label: '7. Tests' },
    { id: 'reasoning', label: '8. Reasoning' },
    { id: 'final-diagnosis', label: '9. Final Dx' },
    { id: 'communication', label: '10. Communication' },
    { id: 'plan', label: '11. Plan' },
    { id: 'debrief', label: '12. Debrief' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <VocabContextBlock
          source="scenario"
          scenarioId={scenario.id}
          text={`${scenario.title}\n${scenario.description}\n${chiefComplaint}`}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{scenario.title}</h1>
          <p className="text-gray-600">{scenario.description}</p>
        </VocabContextBlock>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${
                currentStep === step.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Vital Signs</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">HR:</span> {scenario.patientPersona.vitals.heartRate} bpm
          </div>
          <div>
            <span className="text-blue-700 font-medium">BP:</span> {scenario.patientPersona.vitals.bloodPressure}
          </div>
          <div>
            <span className="text-blue-700 font-medium">RR:</span> {scenario.patientPersona.vitals.respiratoryRate} /min
          </div>
          <div>
            <span className="text-blue-700 font-medium">O2 Sat:</span> {scenario.patientPersona.vitals.oxygenSat}
          </div>
          <div>
            <span className="text-blue-700 font-medium">Temp:</span> {scenario.patientPersona.vitals.temperature}
          </div>
        </div>
      </div>

      {/* Step 0: Safety Check */}
      {currentStep === 'safety' && (
        <SafetyCheck scenario={scenario} onComplete={handleSafetyComplete} />
      )}

      {/* Step 1: Chief Complaint */}
      {currentStep === 'chief-complaint' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Chief Complaint</h2>
          <p className="text-gray-600 mb-4">
            Record why the patient is here in their words.
          </p>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-lg font-medium text-gray-900">Chief Complaint:</p>
            <p className="text-gray-700">{chiefComplaint}</p>
          </div>
          <button
            onClick={handleChiefComplaintComplete}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium"
          >
            Continue to History Taking
          </button>
        </div>
      )}

      {/* Step 2: History (HPI) */}
      {currentStep === 'history' && (
        <>
          <DoctorPatientScene patientName={scenario.patientPersona.name} />
          <div id="chat-panel">
            <ChatPanel scenario={scenario} onChatUpdate={setChatMessages} />
          </div>
          <HPIForm chiefComplaint={chiefComplaint} onComplete={handleHPIComplete} />
        </>
      )}

      {/* Step 3: Medical Background */}
      {currentStep === 'background' && (
        <MedicalBackgroundForm onComplete={handleBackgroundComplete} />
      )}

      {/* Step 4: Problem Representation */}
      {currentStep === 'problem-rep' && hpi && background && (
        <ProblemRepresentation 
          scenario={scenario} 
          hpi={hpi} 
          background={background} 
          onComplete={handleProblemRepComplete} 
        />
      )}

      {/* Step 5: Physical Exam */}
      {currentStep === 'exam' && (
        <>
          <PhysicalExamPanel 
            sections={scenario.physicalExam}
            scenarioId={scenario.id}
            onSectionsViewed={(sections) => {
              setViewedExamSections(sections)
              if (sections.length >= 2) {
                // Auto-advance after viewing a few sections, or add manual button
              }
            }} 
          />
          <button
            onClick={handleExamComplete}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium mb-6"
          >
            Continue to Differential Diagnosis
          </button>
        </>
      )}

      {/* Step 6: Differential Diagnosis */}
      {currentStep === 'differential' && scenario.diagnosisOptions && (
        <DifferentialDiagnosisBuilder 
          diagnosisOptions={scenario.diagnosisOptions} 
          onComplete={handleDifferentialComplete} 
        />
      )}

      {/* Step 7: Tests */}
      {currentStep === 'tests' && (
        <>
          <TestsPanel 
            scenario={scenario}
            orderedTests={orderedTests}
            onTestsOrdered={(tests) => {
              setOrderedTests(tests)
            }} 
          />
          <button
            onClick={handleTestsComplete}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition font-medium mb-6"
          >
            Continue to Clinical Reasoning Update
          </button>
        </>
      )}

      {/* Step 8: Clinical Reasoning */}
      {currentStep === 'reasoning' && differentials.length > 0 && (
        <ClinicalReasoningUpdate 
          differentials={differentials} 
          onComplete={handleReasoningComplete} 
        />
      )}

      {/* Step 9: Final Diagnosis */}
      {currentStep === 'final-diagnosis' && (
        <DiagnosisPanel 
          scenario={scenario}
          onSubmit={handleFinalDiagnosisComplete} 
        />
      )}

      {/* Step 10: Patient Communication */}
      {currentStep === 'communication' && finalDiagnosis && (
        <PatientCommunication 
          scenario={scenario} 
          finalDiagnosis={finalDiagnosis} 
          onComplete={handleCommunicationComplete} 
        />
      )}

      {/* Step 11: Plan & Disposition */}
      {currentStep === 'plan' && (
        <PlanDisposition onComplete={handlePlanComplete} />
      )}

      {/* Step 12: Debrief */}
      {currentStep === 'debrief' && (
        <>
          {isLoadingAssessment ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">Loading assessment…</p>
            </div>
          ) : assessment ? (
            <SummaryPanel scenario={scenario} assessment={assessment} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">No assessment yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

