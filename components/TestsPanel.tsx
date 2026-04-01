'use client'

import { useState, useMemo, useEffect } from 'react'
import { Scenario } from '@/data/scenarios'
import { testCatalog, TestCategory, TestKind } from '@/data/testCatalog'
import { resolveTest } from '@/lib/testEngine'
import VocabText from './VocabText'
import VocabContextBlock from './VocabContextBlock'

type ViewMode = 'simple' | 'clinical'

type Props = {
  scenario: Scenario
  orderedTests?: Map<string, OrderedTest>
  onTestsOrdered: (tests: Map<string, OrderedTest>) => void
  viewMode?: ViewMode
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
}

type OrderedTest = {
  testId: string
  result: string
}

export default function TestsPanel({ scenario, orderedTests: initialOrderedTests, onTestsOrdered, viewMode = 'simple', onTermClick, onTermSave }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | 'All'>('All')
  const [selectedKind, setSelectedKind] = useState<TestKind | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [commonOnly, setCommonOnly] = useState(false)
  const [orderedTests, setOrderedTests] = useState<Map<string, OrderedTest>>(initialOrderedTests || new Map())

  // Sync with parent when initial ordered tests change
  useEffect(() => {
    if (initialOrderedTests) {
      setOrderedTests(initialOrderedTests)
    }
  }, [initialOrderedTests])

  const categories: TestCategory[] = [
    'Cardiac', 'Pulmonary', 'Neurology', 'GI', 'Renal',
    'Endocrine', 'Infectious', 'Hematology', 'MSK', 'Imaging', 'Other'
  ]

  const testsVocabText = useMemo(() => {
    const lines: string[] = []
    orderedTests.forEach((o) => lines.push(o.result))
    return lines.join('\n')
  }, [orderedTests])

  const filteredTests = useMemo(() => {
    return testCatalog.filter(test => {
      const categoryMatch = selectedCategory === 'All' || test.category === selectedCategory
      const kindMatch = selectedKind === 'All' || test.kind === selectedKind
      const searchMatch = searchQuery === '' || 
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.description.toLowerCase().includes(searchQuery.toLowerCase())
      const commonMatch = !commonOnly || test.common
      
      return categoryMatch && kindMatch && searchMatch && commonMatch
    })
  }, [selectedCategory, selectedKind, searchQuery, commonOnly])

  const handleOrderTest = (testId: string) => {
    if (orderedTests.has(testId)) return

    const resolved = resolveTest(scenario, testId)
    const newOrdered = new Map(orderedTests)
    newOrdered.set(testId, {
      testId,
      result: resolved.result,
    })
    setOrderedTests(newOrdered)
    onTestsOrdered(newOrdered)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Diagnostic Tests</h2>

      <VocabContextBlock source="tests" scenarioId={scenario.id} text={testsVocabText}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Category Sidebar */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedCategory === 'All' ? 'bg-primary-100 text-primary-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedCategory === cat ? 'bg-primary-100 text-primary-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Kind</label>
            <div className="space-y-1">
              {(['All', 'Lab', 'Imaging', 'Bedside', 'Procedure'] as const).map(kind => (
                <button
                  key={kind}
                  onClick={() => setSelectedKind(kind as TestKind | 'All')}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    selectedKind === kind ? 'bg-primary-100 text-primary-800 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={commonOnly}
                onChange={(e) => setCommonOnly(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Common only</span>
            </label>
          </div>
        </div>

        {/* Test List */}
        <div className="flex-1">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredTests.map((test) => {
              const isOrdered = orderedTests.has(test.id)

              return (
                <div
                  key={test.id}
                  className={`border-2 rounded-lg p-4 ${
                    isOrdered
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{test.name}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                          {test.kind}
                        </span>
                        {test.common && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Common
                          </span>
                        )}
                        {isOrdered && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Ordered
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <VocabText 
                          text={test.description} 
                          viewMode={viewMode}
                          onTermClick={onTermClick}
                          onTermSave={onTermSave}
                        />
                      </p>
                      {test.typicalUses.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Typical uses: {test.typicalUses.join(', ')}
                        </p>
                      )}
                    </div>
                    {!isOrdered && (
                      <button
                        onClick={() => handleOrderTest(test.id)}
                        className="ml-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition text-sm whitespace-nowrap"
                      >
                        Order
                      </button>
                    )}
                  </div>
                  {isOrdered && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-900 mb-1">Result:</p>
                      <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                        <VocabText 
                          text={orderedTests.get(test.id)?.result || ''} 
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

          {filteredTests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tests match your filters.
            </div>
          )}
        </div>
      </div>
      </VocabContextBlock>
    </div>
  )
}
