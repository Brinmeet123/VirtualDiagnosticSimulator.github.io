'use client'

import { useState, useEffect } from 'react'
import { PhysicalExamSection } from '@/data/scenarios'
import VocabText from './VocabText'
import VocabContextBlock from './VocabContextBlock'

type ViewMode = 'simple' | 'clinical'

type Props = {
  sections: PhysicalExamSection[]
  scenarioId?: string
  viewedSections?: string[]
  onSectionsViewed: (sectionIds: string[]) => void
  viewMode?: ViewMode
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
}

export default function PhysicalExamPanel({ sections, scenarioId, viewedSections: initialViewedSections = [], onSectionsViewed, viewMode = 'simple', onTermClick, onTermSave }: Props) {
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set(initialViewedSections))
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Sync with parent when initial viewed sections change
  useEffect(() => {
    setViewedSections(new Set(initialViewedSections))
  }, [initialViewedSections])

  const handleSectionClick = (sectionId: string) => {
    const newViewed = new Set(viewedSections)
    newViewed.add(sectionId)
    setViewedSections(newViewed)
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
    onSectionsViewed(Array.from(newViewed))
  }

  const examContextText = sections.map((s) => `${s.summary}\n${s.details}`).join('\n')

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Physical Examination</h2>
      <VocabContextBlock source="exam" scenarioId={scenarioId} text={examContextText}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sections.map((section) => {
          const isViewed = viewedSections.has(section.id)
          const isExpanded = expandedSection === section.id
          
          return (
            <div key={section.id}>
              <button
                onClick={() => handleSectionClick(section.id)}
                className={`w-full px-4 py-3 rounded-lg border-2 transition ${
                  isViewed
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                }`}
              >
                <p className="font-medium text-sm">{section.label}</p>
                {isViewed && (
                  <p className="text-xs text-primary-600 mt-1">✓ Viewed</p>
                )}
              </button>
              {isExpanded && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-medium text-gray-900 mb-1">Summary:</p>
                  <p className="text-sm text-gray-700 mb-2">
                    <VocabText 
                      text={section.summary} 
                      viewMode={viewMode}
                      onTermClick={onTermClick}
                      onTermSave={onTermSave}
                    />
                  </p>
                  <p className="text-sm font-medium text-gray-900 mb-1">Details:</p>
                  <p className="text-sm text-gray-700">
                    <VocabText 
                      text={section.details} 
                      viewMode={viewMode}
                      onTermClick={onTermClick}
                      onTermSave={onTermSave}
                    />
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      </VocabContextBlock>
    </div>
  )
}

