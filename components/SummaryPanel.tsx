'use client'

import { Scenario } from '@/data/scenarios'
import VocabText from './VocabText'
import VocabContextBlock from './VocabContextBlock'
import { vocab, getVocabTerm } from '@/data/vocab'

type ViewMode = 'simple' | 'clinical'

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
  assessment: AssessmentResult
  viewMode?: ViewMode
  clickedTerms?: string[]
  savedTerms?: string[]
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
}

const ratingColors: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-800 border-green-300',
  Good: 'bg-blue-100 text-blue-800 border-blue-300',
  'Needs Improvement': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  Poor: 'bg-red-100 text-red-800 border-red-300',
}

export default function SummaryPanel({ scenario, assessment, viewMode = 'simple', clickedTerms = [], savedTerms = [], onTermClick, onTermSave }: Props) {
  // Calculate badges based on behavior
  const badges: string[] = []
  
  // History Builder - asked about key areas
  if (assessment.strengths.some(s => s.toLowerCase().includes('history') || s.toLowerCase().includes('interview'))) {
    badges.push('History Builder')
  }
  
  // Red Flag Spotter - identified red flags
  if (assessment.strengths.some(s => s.toLowerCase().includes('red flag') || s.toLowerCase().includes('urgent'))) {
    badges.push('Red Flag Spotter')
  }
  
  // Smart Test Picker - ordered appropriate tests
  if (assessment.strengths.some(s => s.toLowerCase().includes('test') || s.toLowerCase().includes('diagnostic'))) {
    badges.push('Smart Test Picker')
  }
  
  // Differential Thinker - good differential diagnosis
  if (assessment.strengths.some(s => s.toLowerCase().includes('differential') || s.toLowerCase().includes('diagnosis'))) {
    badges.push('Differential Thinker')
  }
  
  // Clear Communicator - good communication
  if (assessment.strengths.some(s => s.toLowerCase().includes('communication') || s.toLowerCase().includes('rapport'))) {
    badges.push('Clear Communicator')
  }
  
  // New Terms Learned
  const newTermsCount = clickedTerms.length
  
  // Get recommended terms to review (from missed points or important terms in scenario)
  const recommendedTerms = vocab
    .filter(term => {
      // Terms related to missed history points
      const relatedToMissed = assessment.missedKeyHistoryPoints.some(point => 
        point.toLowerCase().includes(term.term.toLowerCase()) ||
        term.tags.some(tag => point.toLowerCase().includes(tag))
      )
      // Important terms for this scenario type
      const isImportant = term.tags.includes('red-flag') || term.tags.includes('cardiac')
      return (relatedToMissed || isImportant) && !savedTerms.includes(term.term)
    })
    .slice(0, 5)
    .map(term => term.term)

  const debriefContext =
    `${assessment.summary}\n${assessment.strengths.join('\n')}\n${assessment.areasForImprovement.join('\n')}\n${assessment.diagnosisFeedback}\n${assessment.testSelectionFeedback}\n${scenario.teachingPoints.join('\n')}`

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <VocabContextBlock source="debrief" scenarioId={scenario.id} text={debriefContext}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Assessment & Debrief</h2>
      
      {/* Badges Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border-2 border-primary-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">🏆 Badges Earned</h3>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium shadow-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Keep practicing to earn badges!</p>
        )}
      </div>

      {/* Vocabulary Learning Section */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">📚 Vocabulary Learning</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            <strong>New terms encountered:</strong> {newTermsCount} {newTermsCount === 1 ? 'term' : 'terms'}
          </p>
          {savedTerms.length > 0 && (
            <p className="text-sm text-gray-700">
              <strong>Terms saved:</strong> {savedTerms.length} {savedTerms.length === 1 ? 'term' : 'terms'}
            </p>
          )}
          {recommendedTerms.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-900 mb-2">Recommended terms to review:</p>
              <div className="flex flex-wrap gap-2">
                {recommendedTerms.map(term => {
                  const termData = getVocabTerm(term)
                  return termData ? (
                    <button
                      key={term}
                      onClick={() => onTermClick?.(term)}
                      className="px-3 py-1 bg-white border border-purple-300 text-purple-700 rounded-md hover:bg-purple-100 text-sm transition"
                    >
                      {termData.display}
                    </button>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overall Rating (no scores shown) */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${ratingColors[assessment.overallRating] || ratingColors.Good}`}>
        <p className="text-lg font-semibold">Overall Performance: {assessment.overallRating}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Summary</h3>
        <p className="text-gray-700">
          <VocabText 
            text={assessment.summary} 
            viewMode={viewMode}
            onTermClick={onTermClick}
            onTermSave={onTermSave}
          />
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-green-700 mb-2">✓ Strengths</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {assessment.strengths.map((strength, idx) => (
              <li key={idx}>
                <VocabText 
                  text={strength} 
                  viewMode={viewMode}
                  onTermClick={onTermClick}
                  onTermSave={onTermSave}
                />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-yellow-700 mb-2">Areas for Improvement</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {assessment.areasForImprovement.map((area, idx) => (
              <li key={idx}>
                <VocabText 
                  text={area} 
                  viewMode={viewMode}
                  onTermClick={onTermClick}
                  onTermSave={onTermSave}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnosis Feedback</h3>
        <p className="text-gray-700">
          <VocabText 
            text={assessment.diagnosisFeedback} 
            viewMode={viewMode}
            onTermClick={onTermClick}
            onTermSave={onTermSave}
          />
        </p>
      </div>

      {assessment.missedKeyHistoryPoints.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Missed Key History Points</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {assessment.missedKeyHistoryPoints.map((point, idx) => (
              <li key={idx}>
                <VocabText 
                  text={point} 
                  viewMode={viewMode}
                  onTermClick={onTermClick}
                  onTermSave={onTermSave}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Selection Feedback</h3>
        <p className="text-gray-700">
          <VocabText 
            text={assessment.testSelectionFeedback} 
            viewMode={viewMode}
            onTermClick={onTermClick}
            onTermSave={onTermSave}
          />
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Teaching Points</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          {scenario.teachingPoints.map((point, idx) => (
            <li key={idx}>
              <VocabText 
                text={point} 
                viewMode={viewMode}
                onTermClick={onTermClick}
                onTermSave={onTermSave}
              />
            </li>
          ))}
        </ul>
      </div>
      </VocabContextBlock>
    </div>
  )
}

