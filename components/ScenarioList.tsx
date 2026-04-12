'use client'

import { useState, useMemo } from 'react'
import { Scenario, ScenarioDifficulty } from '@/data/scenarios'
import ScenarioCard from './ScenarioCard'
import SimulatorHelpButton from './simulator/SimulatorHelpButton'

export type ScenarioProgressInfo = {
  status: string
  bestScore: number | null
  lastAttemptScore: number | null
}

type Props = {
  scenarios: Scenario[]
  progressByScenario?: Record<string, ScenarioProgressInfo>
}

export default function ScenarioList({ scenarios, progressByScenario = {} }: Props) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<ScenarioDifficulty | 'all'>('all')

  const specialties = useMemo(() => {
    const unique = Array.from(new Set(scenarios.map(s => s.specialty)))
    return unique.sort()
  }, [scenarios])

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      const specialtyMatch = selectedSpecialty === 'all' || scenario.specialty === selectedSpecialty
      const difficultyMatch = selectedDifficulty === 'all' || scenario.difficulty === selectedDifficulty
      return specialtyMatch && difficultyMatch
    })
  }, [scenarios, selectedSpecialty, selectedDifficulty])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SimulatorHelpButton libraryPage />

      <div className="mb-8">
        <p className="text-sm font-semibold text-primary-700 mb-2">Case library</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🧩 Choose a Patient Case</h1>
        <p className="text-lg text-slate-700 mb-2 max-w-2xl">Pick a scenario to start diagnosing.</p>
        <p className="text-sm text-slate-600 mb-8 max-w-2xl">
          You&apos;ll ask questions, gather clues, order tests, and make the call — then see how you did.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
              Specialty
            </label>
            <select
              id="specialty"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as ScenarioDifficulty | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All difficulties</option>
              <option value="Beginner">Easy (Beginner)</option>
              <option value="Intermediate">Medium (Intermediate)</option>
              <option value="Advanced">Hard (Advanced)</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Showing {filteredScenarios.length} of {scenarios.length} scenarios
        </p>
      </div>

      {filteredScenarios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No cases match these filters. Try widening specialty or difficulty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScenarios.map(scenario => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              progress={progressByScenario[scenario.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

