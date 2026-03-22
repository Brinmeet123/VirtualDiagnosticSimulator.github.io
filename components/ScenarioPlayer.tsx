'use client'

import { useState, useEffect } from 'react'
import { Scenario } from '@/data/scenarios'
import { getMockAssessment } from '@/lib/mockResponses'
import DoctorPatientScene from './DoctorPatientScene'
import ChatPanel from './ChatPanel'
import PhysicalExamPanel from './PhysicalExamPanel'
import TestsPanel from './TestsPanel'
import DiagnosisPanel from './DiagnosisPanel'
import SummaryPanel from './SummaryPanel'
import SectionNav, { ClinicalSection } from './SectionNav'
import HistoryHelperPanel from './HistoryHelperPanel'

type LearningMode = 'guided' | 'standard' | 'advanced'
type ViewMode = 'simple' | 'clinical'

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
}

type Props = {
  scenario: Scenario
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

export default function ScenarioPlayer({ scenario }: Props) {
  const [activeSection, setActiveSection] = useState<ClinicalSection>('history')
  const [learningMode, setLearningMode] = useState<LearningMode>('guided')
  const [viewMode, setViewMode] = useState<ViewMode>('simple')
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

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])


  const handleChatUpdate = (messages: Message[]) => {
    setChatMessages(messages)
  }

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
    // Dispatch custom event for ChatPanel to handle
    const event = new CustomEvent('insert-question', { detail: { question } })
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
        return
      }

      const result = await response.json()
      
      // Check if result has error
      if (result.error) {
        throw new Error(result.error)
      }
      
      setAssessment(result)
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
        summary: 'There was an error generating your assessment. Set OPENAI_API_KEY (sk-...) or DEMO_MODE=true for mocks.',
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

  const scrollToChat = () => {
    const chatElement = document.getElementById('chat-panel')
    chatElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Navigation rules: determine which sections are accessible
  const canAccessDiagnosis = viewedExamSections.length > 0 && orderedTests.size > 0
  const canAccessDebrief = finalDiagnosisId !== null

  const sections = [
    {
      id: 'history' as ClinicalSection,
      label: 'History',
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
      disabledReason: 'Complete the Exam and order at least one Test before moving to Diagnosis.',
    },
    {
      id: 'debrief' as ClinicalSection,
      label: 'Debrief',
      disabled: !canAccessDebrief,
      disabledReason: 'Select a final diagnosis before viewing the debrief.',
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
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{scenario.title}</h1>
            <p className="text-gray-600">{scenario.description}</p>
          </div>
          
          {/* Learning Mode and View Mode Controls */}
          <div className="flex flex-col gap-3 items-end">
            {/* Learning Mode Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="learning-mode" className="text-sm font-medium text-gray-700">
                Learning Mode:
              </label>
              <select
                id="learning-mode"
                value={learningMode}
                onChange={(e) => setLearningMode(e.target.value as LearningMode)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="guided">Guided</option>
                <option value="standard">Standard</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <div className="flex bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('simple')}
                  className={`px-3 py-1 text-sm font-medium rounded transition ${
                    viewMode === 'simple'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setViewMode('clinical')}
                  className={`px-3 py-1 text-sm font-medium rounded transition ${
                    viewMode === 'clinical'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Clinical
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vital Signs - Always visible */}
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

      {/* Section Navigation */}
      <SectionNav
        active={activeSection}
        onChange={handleSectionChange}
        sections={sections}
      />

      {/* Render only the active section */}
      {activeSection === 'history' && (
        <>
          <DoctorPatientScene patientName={scenario.patientPersona.name} onPatientClick={scrollToChat} />
          
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
                  Helper
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
                    learningMode={learningMode}
                    viewMode={viewMode}
                    onInsertQuestion={handleInsertQuestion}
                    messages={chatMessages}
                  />
                </div>
              ) : (
                <div id="chat-panel">
                  <ChatPanel 
                    scenario={scenario} 
                    messages={chatMessages} 
                    onChatUpdate={handleChatUpdate}
                    viewMode={viewMode}
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
                    learningMode={learningMode}
                    viewMode={viewMode}
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
                      onChatUpdate={handleChatUpdate}
                      viewMode={viewMode}
                      onTermClick={handleTermClick}
                      onTermSave={handleTermSave}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeSection === 'exam' && (
        <PhysicalExamPanel 
          sections={scenario.physicalExam} 
          viewedSections={viewedExamSections}
          onSectionsViewed={handleExamSectionsViewed}
          viewMode={viewMode}
          onTermClick={handleTermClick}
          onTermSave={handleTermSave}
        />
      )}

      {activeSection === 'tests' && (
        <TestsPanel 
          scenario={scenario} 
          orderedTests={orderedTests}
          onTestsOrdered={handleTestsOrdered}
          viewMode={viewMode}
          onTermClick={handleTermClick}
          onTermSave={handleTermSave}
        />
      )}

      {activeSection === 'diagnosis' && (
        <DiagnosisPanel 
          scenario={scenario} 
          differential={differential}
          finalDxId={finalDiagnosisId}
          onDifferentialUpdate={handleDifferentialUpdate}
          onFinalDxUpdate={handleFinalDxUpdate}
          onSubmit={handleDiagnosisSubmit}
          viewMode={viewMode}
          onTermClick={handleTermClick}
          onTermSave={handleTermSave}
        />
      )}

      {activeSection === 'debrief' && (
        <>
          {isLoadingAssessment ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">Generating your assessment...</p>
            </div>
          ) : assessment ? (
            <SummaryPanel 
              scenario={scenario} 
              assessment={assessment}
              viewMode={viewMode}
              clickedTerms={clickedTerms}
              savedTerms={savedTerms}
              onTermClick={handleTermClick}
              onTermSave={handleTermSave}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600">No assessment available yet.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
