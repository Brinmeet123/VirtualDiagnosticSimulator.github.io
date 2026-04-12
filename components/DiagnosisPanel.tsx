'use client'

import { useState, useMemo, useEffect } from 'react'
import { Scenario } from '@/data/scenarios'
import { diagnosisCatalog, DxCategory } from '@/data/diagnosisCatalog'
import { resolveDx, checkMissingMustNotMiss } from '@/lib/dxEngine'
import VocabText from './VocabText'

type DifferentialItem = {
  dxId: string
  rank: number
  confidence: 'High' | 'Medium' | 'Low'
  note?: string
}

type Props = {
  scenario: Scenario
  differential?: DifferentialItem[]
  finalDxId?: string | null
  onDifferentialUpdate?: (differential: DifferentialItem[]) => void
  onFinalDxUpdate?: (finalDxId: string | null) => void
  onSubmit: (data: {
    differentialDetailed: DifferentialItem[]
    finalDxId: string | null
    missingMustNotMiss: string[]
  }) => void
  onTermClick?: (term: string) => void
  onTermSave?: (term: string) => void
}

export default function DiagnosisPanel({ 
  scenario, 
  differential: initialDifferential = [],
  finalDxId: initialFinalDxId = null,
  onDifferentialUpdate,
  onFinalDxUpdate,
  onSubmit,
  onTermClick,
  onTermSave
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<DxCategory | 'All'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [commonOnly, setCommonOnly] = useState(false)
  const [differential, setDifferential] = useState<DifferentialItem[]>(initialDifferential)
  const [finalDxId, setFinalDxId] = useState<string | null>(initialFinalDxId)

  // Sync with parent when initial values change
  useEffect(() => {
    setDifferential(initialDifferential)
  }, [initialDifferential])

  useEffect(() => {
    setFinalDxId(initialFinalDxId)
  }, [initialFinalDxId])

  const categories: DxCategory[] = [
    'Cardiac', 'Pulmonary', 'Neurology', 'GI', 'Infectious',
    'Endocrine', 'Renal', 'Hematology', 'Psych', 'MSK', 'Other'
  ]

  const filteredDiagnoses = useMemo(() => {
    return diagnosisCatalog.filter(dx => {
      const categoryMatch = selectedCategory === 'All' || dx.category === selectedCategory
      const searchMatch = searchQuery === '' || 
        dx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dx.brief.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dx.typicalClues.some(clue => clue.toLowerCase().includes(searchQuery.toLowerCase()))
      const commonMatch = !commonOnly || dx.common
      const notInDifferential = !differential.find(d => d.dxId === dx.id)
      
      return categoryMatch && searchMatch && commonMatch && notInDifferential
    })
  }, [selectedCategory, searchQuery, commonOnly, differential])

  const handleAddToDifferential = (dxId: string) => {
    const newRank = differential.length + 1
    const newDifferential = [...differential, {
      dxId,
      rank: newRank,
      confidence: 'Medium' as const,
      note: ''
    }]
    setDifferential(newDifferential)
    onDifferentialUpdate?.(newDifferential)
  }

  const handleRemoveFromDifferential = (dxId: string) => {
    const filtered = differential.filter(d => d.dxId !== dxId)
    // Re-rank
    const reRanked = filtered.map((d, idx) => ({ ...d, rank: idx + 1 }))
    setDifferential(reRanked)
    onDifferentialUpdate?.(reRanked)
    if (finalDxId === dxId) {
      setFinalDxId(null)
      onFinalDxUpdate?.(null)
    }
  }

  const handleMoveRank = (dxId: string, direction: 'up' | 'down') => {
    const index = differential.findIndex(d => d.dxId === dxId)
    if (index === -1) return
    
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= differential.length) return
    
    const newDifferential = [...differential]
    ;[newDifferential[index], newDifferential[newIndex]] = [newDifferential[newIndex], newDifferential[index]]
    
    // Re-rank
    const reRanked = newDifferential.map((d, idx) => ({ ...d, rank: idx + 1 }))
    setDifferential(reRanked)
    onDifferentialUpdate?.(reRanked)
  }

  const handleUpdateConfidence = (dxId: string, confidence: 'High' | 'Medium' | 'Low') => {
    const updated = differential.map(d => d.dxId === dxId ? { ...d, confidence } : d)
    setDifferential(updated)
    onDifferentialUpdate?.(updated)
  }

  const handleUpdateNote = (dxId: string, note: string) => {
    const updated = differential.map(d => d.dxId === dxId ? { ...d, note } : d)
    setDifferential(updated)
    onDifferentialUpdate?.(updated)
  }

  const handleSubmit = () => {
    if (finalDxId) {
      const missingMustNotMiss = checkMissingMustNotMiss(
        differential.map(d => d.dxId),
        scenario.requiredMustNotMiss
      )
      
      onSubmit({
        differentialDetailed: differential,
        finalDxId,
        missingMustNotMiss,
      })
    }
  }

  const sortedDifferential = [...differential].sort((a, b) => a.rank - b.rank)
  const missingMustNotMiss = checkMissingMustNotMiss(
    differential.map(d => d.dxId),
    scenario.requiredMustNotMiss
  )

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <p className="mb-4 text-sm text-slate-600 leading-relaxed">
        Build a ranked differential, then choose one final diagnosis. Your picks shape the feedback you&apos;ll see
        next.
      </p>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">Make your diagnosis</h2>
      
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

        {/* Diagnosis List */}
        <div className="flex-1">
          <div className="mb-4">
            <input
              type="text"
              placeholder="(e.g., Myocardial Infarction) — search diagnoses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto mb-6">
            {filteredDiagnoses.map((dx) => {
              const resolved = resolveDx(scenario, dx.id)
              
              return (
                <div
                  key={dx.id}
                  className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{dx.name}</h3>
                        {dx.common && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Common
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <VocabText 
                          text={dx.brief} 
                          onTermClick={onTermClick}
                          onTermSave={onTermSave}
                        />
                      </p>
                      <p className="text-xs text-gray-500">
                        Clues: {dx.typicalClues.join(', ')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddToDifferential(dx.id)}
                      className="ml-4 px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 whitespace-nowrap"
                    >
                      Add to DDx
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredDiagnoses.length === 0 && (
            <div className="text-center py-8 text-gray-500 mb-6">
              No diagnoses match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Differential Diagnosis Builder */}
      {differential.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Your Differential Diagnosis (Ranked)</h3>
          
          {missingMustNotMiss.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-1">Must-not-miss to consider:</p>
              <p className="text-xs text-yellow-700 mb-2">
                These are dangerous diagnoses that should be considered in your differential, even if you rule them out. Good clinical practice requires evaluating them for chest pain cases.
              </p>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                {missingMustNotMiss.map(dxId => {
                  const dx = diagnosisCatalog.find(d => d.id === dxId)
                  return <li key={dxId}>{dx?.name || dxId}</li>
                })}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {sortedDifferential.map((item) => {
              const dx = diagnosisCatalog.find(d => d.id === item.dxId)
              const resolved = resolveDx(scenario, item.dxId)
              
              return (
                <div
                  key={item.dxId}
                  className={`border-2 rounded-lg p-4 ${
                    resolved.yield === 'correct' ? 'border-green-300 bg-green-50' :
                    resolved.yield === 'reasonable' ? 'border-blue-300 bg-blue-50' :
                    resolved.yield === 'dangerous-miss' ? 'border-red-300 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-700">#{item.rank}</span>
                        <span className="font-medium text-gray-900">{dx?.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        <VocabText 
                          text={resolved.explanation} 
                          onTermClick={onTermClick}
                          onTermSave={onTermSave}
                        />
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveRank(item.dxId, 'up')}
                        disabled={item.rank === 1}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveRank(item.dxId, 'down')}
                        disabled={item.rank === differential.length}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleRemoveFromDifferential(item.dxId)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Confidence</label>
                      <select
                        value={item.confidence}
                        onChange={(e) => handleUpdateConfidence(item.dxId, e.target.value as 'High' | 'Medium' | 'Low')}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Reasoning Note (optional)</label>
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleUpdateNote(item.dxId, e.target.value)}
                        placeholder="(e.g., Chest pain radiating to arm, elevated troponin)"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Final Diagnosis */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <h3 className="text-md font-semibold text-gray-900 mb-4">Final diagnosis</h3>
        {differential.length === 0 ? (
          <p className="text-sm text-gray-500">Add diagnoses to the differential first.</p>
        ) : (
          <div className="space-y-2">
            {sortedDifferential.map((item) => {
              const dx = diagnosisCatalog.find(d => d.id === item.dxId)
              return (
                <label
                  key={item.dxId}
                  className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="final-diagnosis"
                    checked={finalDxId === item.dxId}
                    onChange={() => {
                      setFinalDxId(item.dxId)
                      onFinalDxUpdate?.(item.dxId)
                    }}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-gray-900 font-medium">#{item.rank} - {dx?.name}</span>
                    {item.confidence && (
                      <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        {item.confidence} confidence
                      </span>
                    )}
                    {item.note && (
                      <p className="text-xs text-gray-600 mt-1">Note: {item.note}</p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!finalDxId || differential.length === 0}
        className="btn-press w-full mt-6 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
      >
        Submit Diagnosis
      </button>
    </div>
  )
}
