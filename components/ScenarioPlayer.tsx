'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Scenario } from '@/data/scenarios'
import type { RubricBreakdown } from '@/lib/scoring'
import { getMockAssessment } from '@/lib/mockResponses'
import DoctorPatientScene from './DoctorPatientScene'
import ChatPanel from './ChatPanel'
import PhysicalExamPanel from './PhysicalExamPanel'
import TestsPanel from './TestsPanel'
import DiagnosisPanel from './DiagnosisPanel'
import SummaryPanel from './SummaryPanel'
import SectionNav, { ClinicalSection } from './SectionNav'
import HistoryHelperPanel from './HistoryHelperPanel'
import SimulatorProgressBar from './simulator/SimulatorProgressBar'
import type { SimulatorStep } from './simulator/SimulatorProgressBar'
import ScenarioSectionHeader from './ux/ScenarioSectionHeader'

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
  sectionRatings?: {
    history?: string
    exam?: string
    tests?: string
    diagnosis?: string
    communication?: string
  }
  totalScore?: number
  totalScorePercentage?: number
  maxScore?: number
  scoreBreakdown?: {
    history?: number
    exam?: number
    tests?: number
    diagnosis?: number
    communication?: number
  }
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
}

type Props = {
  scenario: Scenario
}

type ScenarioScoreState = {
  score: number
  level: string
  feedback: string
  rubric: RubricBreakdown
}

type OrderedTestData = {
  testId: string
  result: string
}

type DifferentialItem = {
  dxId: string
  rank: number
  confidence: 'High' | 'Medium' | 'Low'
  note?: string
}

type PersistedState = {
  viewedExamSections: string[]
  orderedTests: [string, OrderedTestData][]
  differential: DifferentialItem[]
  finalDiagnosisId: string | null
  activeSection: ClinicalSection
}

export default function ScenarioPlayer({ scenario }: Props) {
  const { data: session, status: sessionStatus } = useSession()
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [scenarioScore, setScenarioScore] = useState<ScenarioScoreState | null>(null)
  const [activeSection, setActiveSection] = useState<ClinicalSection>('history')
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      role: 'patient',
      content: `Hello, doctor. ${scenario.patientPersona.chiefComplaint}.`
    }
  ])
  const [viewedExamSections, setViewedExamSections] = useState<string[]>([])
  const [orderedTests, setOrderedTests] = useState<Map<string, OrderedTestData>>(new Map())
  const [differential, setDifferential] = useState<DifferentialItem[]>([])
  const [finalDiagnosisId, setFinalDiagnosisId] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(false)
  const [clickedTerms, setClickedTerms] = useState<string[]>([])
  const [savedTerms, setSavedTerms] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [mobileTab, setMobileTab] = useState<'helper' | 'chat'>('chat')

  // Match media avoids resize/scrollbar thrash flipping layout at ~768px (flash between tabs).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Start or resume tracked attempt (signed-in users)
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !session?.user?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/scenario/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: scenario.id }),
        })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as {
          attemptId: string
          resume: boolean
          messages: Message[] | null
          state: PersistedState | null
        }
        if (cancelled) return
        setAttemptId(data.attemptId)
        if (data.resume && data.messages && data.messages.length > 0) {
          setChatMessages(data.messages)
          if (data.state && typeof data.state === 'object') {
            const st = data.state
            if (Array.isArray(st.viewedExamSections)) setViewedExamSections(st.viewedExamSections)
            if (Array.isArray(st.orderedTests)) setOrderedTests(new Map(st.orderedTests))
            if (Array.isArray(st.differential)) setDifferential(st.differential)
            if (st.finalDiagnosisId !== undefined) setFinalDiagnosisId(st.finalDiagnosisId)
            if (st.activeSection) setActiveSection(st.activeSection)
          }
        }
      } catch (e) {
        console.error('scenario start', e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionStatus, session?.user?.id, scenario.id])

  // Persist messages + UI state for resume
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !attemptId) return
    const t = setTimeout(() => {
      const state: PersistedState = {
        viewedExamSections,
        orderedTests: Array.from(orderedTests.entries()),
        differential,
        finalDiagnosisId,
        activeSection,
      }
      void fetch('/api/scenario/attempt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          scenarioId: scenario.id,
          messages: chatMessages,
          state,
        }),
      })
    }, 1500)
    return () => clearTimeout(t)
  }, [
    chatMessages,
    viewedExamSections,
    orderedTests,
    differential,
    finalDiagnosisId,
    activeSection,
    attemptId,
    scenario.id,
    sessionStatus,
  ])


  const handleChatUpdate = useCallback((messages: Message[]) => {
    setChatMessages(messages)
  }, [])

  const handleTermClick = (term: string) => {
    if (!clickedTerms.includes(term)) {
      setClickedTerms([...clickedTerms, term])
    }
  }

  const handleTermSave = (term: string) => {
    if (!savedTerms.includes(term)) {
      setSavedTerms([...savedTerms, term])
    }
  }

  const handleInsertQuestion = (question: string) => {
    const event = new CustomEvent('send-preset-question', { detail: { question } })
    window.dispatchEvent(event)
  }

  const handleExamSectionsViewed = (sectionIds: string[]) => {
    setViewedExamSections(sectionIds)
  }

  const handleTestsOrdered = (tests: Map<string, OrderedTestData>) => {
    setOrderedTests(tests)
  }

  const handleDifferentialUpdate = (differential: DifferentialItem[]) => {
    setDifferential(differential)
  }

  const handleFinalDxUpdate = (finalDxId: string | null) => {
    setFinalDiagnosisId(finalDxId)
  }

  const handleDiagnosisSubmit = async (data: {
    differentialDetailed: Array<{ dxId: string; rank: number; confidence: string; note?: string }>
    finalDxId: string | null
    missingMustNotMiss: string[]
  }) => {
    // State is already updated via onDifferentialUpdate and onFinalDxUpdate
    setIsLoadingAssessment(true)
    setActiveSection('debrief')

    const completeScoring = async (aid: string | null) => {
      if (sessionStatus !== 'authenticated' || !aid) return
      try {
        const cr = await fetch('/api/scenario/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: scenario.id,
            attemptId: aid,
            messages: chatMessages,
            finalDxId: finalDiagnosisId,
            viewedExamSections,
            orderedTests: Array.from(orderedTests.keys()),
            differential,
          }),
        })
        if (cr.ok) {
          const scoreJson = (await cr.json()) as {
            error?: string
            score: number
            level: string
            feedback: string
            rubric: RubricBreakdown
          }
          if (!scoreJson.error) {
            setScenarioScore({
              score: scoreJson.score,
              level: scoreJson.level,
              feedback: scoreJson.feedback,
              rubric: scoreJson.rubric,
            })
          }
        }
      } catch (e) {
        console.error('scenario complete scoring', e)
      }
    }

    let effectiveAttemptId = attemptId
    if (sessionStatus === 'authenticated' && !effectiveAttemptId) {
      try {
        const sr = await fetch('/api/scenario/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: scenario.id }),
        })
        if (sr.ok) {
          const d = (await sr.json()) as { attemptId: string }
          effectiveAttemptId = d.attemptId
          setAttemptId(d.attemptId)
        }
      } catch (e) {
        console.error('scenario start before complete', e)
      }
    }

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: scenario.id,
          chat: chatMessages,
          viewedExamSections,
          orderedTests: Array.from(orderedTests.keys()),
          differentialDetailed: differential,
          finalDxId: finalDiagnosisId,
          missingMustNotMiss: data.missingMustNotMiss,
          // Legacy fields for backward compatibility
          selectedDifferentialIds: differential.map(d => d.dxId),
          finalDiagnosisId: finalDiagnosisId,
        }),
      })

      if (!response.ok) {
        setAssessment(getMockAssessment() as AssessmentResult)
        await completeScoring(effectiveAttemptId)
        return
      }

      const result = await response.json()
      
      // Check if result has error
      if (result.error) {
        throw new Error(result.error)
      }
      
      setAssessment(result)
      await completeScoring(effectiveAttemptId)
    } catch (error: any) {
      console.error('Error:', error)
      const errorMessage = error?.message || 'Unknown error occurred'
      const isNetworkError = errorMessage.includes('Failed to fetch') || errorMessage.includes('Load failed')
      if (isNetworkError) {
        setAssessment(getMockAssessment() as AssessmentResult)
        await completeScoring(effectiveAttemptId)
        return
      }

      setAssessment({
        overallRating: 'Error',
        summary:
          'Assessment failed to load. For local dev: run Ollama or set DEMO_MODE=true.',
        strengths: [],
        areasForImprovement: [errorMessage],
        diagnosisFeedback: '',
        missedKeyHistoryPoints: [],
        testSelectionFeedback: '',
      })
      await completeScoring(effectiveAttemptId)
    } finally {
      setIsLoadingAssessment(false)
    }
  }

  const scrollToChat = () => {
    const chatElement = document.getElementById('chat-panel')
    chatElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Navigation rules: determine which sections are accessible
  const canAccessDiagnosis = viewedExamSections.length > 0 && orderedTests.size > 0
  const canAccessDebrief = finalDiagnosisId !== null

  const doctorTurns = chatMessages.filter((m) => m.role === 'doctor').length
  const learnerStep: SimulatorStep =
    activeSection === 'history'
      ? 1
      : activeSection === 'exam'
        ? 2
        : activeSection === 'tests'
          ? 3
          : activeSection === 'diagnosis'
            ? 4
            : 5

  const sections = [
    {
      id: 'history' as ClinicalSection,
      label: 'Interview',
      disabled: false,
    },
    {
      id: 'exam' as ClinicalSection,
      label: 'Exam',
      disabled: false,
    },
    {
      id: 'tests' as ClinicalSection,
      label: 'Tests',
      disabled: false,
    },
    {
      id: 'diagnosis' as ClinicalSection,
      label: 'Diagnosis',
      disabled: !canAccessDiagnosis,
      disabledReason: 'Open the exam and order at least one test first.',
    },
    {
      id: 'debrief' as ClinicalSection,
      label: 'Results',
      disabled: !canAccessDebrief,
      disabledReason: 'Choose a final diagnosis and submit to see your report.',
    },
  ]

  const handleSectionChange = (section: ClinicalSection) => {
    // Prevent navigation to blocked sections
    const sectionInfo = sections.find(s => s.id === section)
    if (sectionInfo?.disabled) {
      return
    }
    setActiveSection(section)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SimulatorProgressBar currentStep={learnerStep} className="mb-10" />

      <div className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">Active case</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{scenario.title}</h1>
        <p className="text-base text-slate-600 leading-relaxed line-clamp-3">{scenario.description}</p>
      </div>

      <div className="mb-10 border-b border-slate-200 pb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">Vitals</p>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-700">
          <span><span className="text-slate-500">HR</span> {scenario.patientPersona.vitals.heartRate} bpm</span>
          <span><span className="text-slate-500">BP</span> {scenario.patientPersona.vitals.bloodPressure}</span>
          <span><span className="text-slate-500">RR</span> {scenario.patientPersona.vitals.respiratoryRate}/min</span>
          <span><span className="text-slate-500">SpO₂</span> {scenario.patientPersona.vitals.oxygenSat}</span>
          <span><span className="text-slate-500">T</span> {scenario.patientPersona.vitals.temperature}</span>
        </div>
      </div>

      {activeSection === 'history' && (
        <DoctorPatientScene patientName={scenario.patientPersona.name} onPatientClick={scrollToChat} />
      )}

      {/* Section Navigation */}
      <SectionNav
        active={activeSection}
        onChange={handleSectionChange}
        sections={sections}
      />

      <ScenarioSectionHeader section={activeSection} />

      {/* Render only the active section */}
      {activeSection === 'history' && (
        <>
          {/* Mobile: Tabbed View */}
          {isMobile ? (
            <div className="mb-6">
              {/* Tab Buttons */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setMobileTab('helper')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                    mobileTab === 'helper'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Quick prompts
                </button>
                <button
                  onClick={() => setMobileTab('chat')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                    mobileTab === 'chat'
                      ? 'border-b-2 border-primary-600 text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Chat
                </button>
              </div>

              {/* Tab Content */}
              {mobileTab === 'helper' ? (
                <div className="min-h-[400px]">
                  <HistoryHelperPanel
                    scenario={scenario}
                    onInsertQuestion={handleInsertQuestion}
                    messages={chatMessages}
                  />
                </div>
              ) : (
                <div id="chat-panel">
                  <ChatPanel
                    scenario={scenario}
                    messages={chatMessages}
                    doctorMessageCount={doctorTurns}
                    onChatUpdate={handleChatUpdate}
                    onTermClick={handleTermClick}
                    onTermSave={handleTermSave}
                  />
                </div>
              )}
            </div>
          ) : (
            /* Desktop: Split View */
            <div className="mb-6" style={{ height: '600px' }}>
              <div className="h-full flex gap-4">
                {/* Left Panel: Helper */}
                <div className="w-2/5 bg-gray-50 rounded-lg overflow-hidden p-4">
                  <HistoryHelperPanel
                    scenario={scenario}
                    onInsertQuestion={handleInsertQuestion}
                    messages={chatMessages}
                  />
                </div>

                {/* Right Panel: Chat */}
                <div className="flex-1 bg-white rounded-lg overflow-hidden p-4 flex flex-col">
                  <div id="chat-panel" className="flex-1 min-h-0">
                    <ChatPanel
                      scenario={scenario}
                      messages={chatMessages}
                      doctorMessageCount={doctorTurns}
                      onChatUpdate={handleChatUpdate}
                      onTermClick={handleTermClick}
                      onTermSave={handleTermSave}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10">
            <button
              type="button"
              onClick={() => setActiveSection('exam')}
              className="btn-press w-full rounded-lg bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 sm:w-auto sm:min-w-[11rem]"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {activeSection === 'exam' && (
        <>
          <PhysicalExamPanel
            sections={scenario.physicalExam}
            scenarioId={scenario.id}
            viewedSections={viewedExamSections}
            onSectionsViewed={handleExamSectionsViewed}
            onTermClick={handleTermClick}
            onTermSave={handleTermSave}
          />
          <div className="mt-10">
            <button
              type="button"
              onClick={() => setActiveSection('tests')}
              className="btn-press w-full rounded-lg bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 sm:w-auto sm:min-w-[11rem]"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {activeSection === 'tests' && (
        <>
          <TestsPanel
            scenario={scenario}
            orderedTests={orderedTests}
            onTestsOrdered={handleTestsOrdered}
            onTermClick={handleTermClick}
            onTermSave={handleTermSave}
          />
          <div className="mt-10 flex flex-col items-start gap-2">
            {!canAccessDiagnosis && (
              <p className="text-xs text-slate-500">Open the exam and order a test to continue.</p>
            )}
            <button
              type="button"
              onClick={() => setActiveSection('diagnosis')}
              disabled={!canAccessDiagnosis}
              title={
                canAccessDiagnosis
                  ? undefined
                  : 'Open the exam and order at least one test.'
              }
              className="btn-press w-full rounded-lg bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[11rem]"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {activeSection === 'diagnosis' && (
        <>
          <DiagnosisPanel
            scenario={scenario}
            differential={differential}
            finalDxId={finalDiagnosisId}
            onDifferentialUpdate={handleDifferentialUpdate}
            onFinalDxUpdate={handleFinalDxUpdate}
            onSubmit={handleDiagnosisSubmit}
            onTermClick={handleTermClick}
            onTermSave={handleTermSave}
          />
        </>
      )}

      {activeSection === 'debrief' && (
        <>
          {isLoadingAssessment ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">Building your report — scoring feedback and teaching points…</p>
            </div>
          ) : assessment ? (
            <SummaryPanel 
              scenario={scenario} 
              assessment={assessment}
              clickedTerms={clickedTerms}
              savedTerms={savedTerms}
              onTermClick={handleTermClick}
              onTermSave={handleTermSave}
              scenarioScore={scenarioScore ?? undefined}
            />
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
