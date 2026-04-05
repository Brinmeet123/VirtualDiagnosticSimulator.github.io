'use client'

import { useState } from 'react'

type Props = {
  onItemComplete?: (item: string) => void
}

type ChecklistItem = {
  id: string
  label: string
  description: string
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'onset',
    label: 'Onset',
    description: 'When did this start? Was it sudden or gradual?',
  },
  {
    id: 'location',
    label: 'Location',
    description: 'Where exactly is the problem? Can you point to it?',
  },
  {
    id: 'quality',
    label: 'Quality',
    description: 'What does it feel like? Sharp, dull, pressure, burning?',
  },
  {
    id: 'severity',
    label: 'Severity',
    description: 'How bad is it on a scale of 0-10?',
  },
  {
    id: 'radiation',
    label: 'Radiation',
    description: 'Does the pain or problem move anywhere else?',
  },
  {
    id: 'timing',
    label: 'Timing',
    description: 'Is it constant or does it come and go? When does it happen?',
  },
  {
    id: 'aggravating',
    label: 'What makes it worse?',
    description: 'What activities or positions make it worse?',
  },
  {
    id: 'alleviating',
    label: 'What makes it better?',
    description: 'What helps relieve the problem?',
  },
  {
    id: 'associated',
    label: 'Other symptoms',
    description: 'Do you have any other symptoms like nausea, sweating, or shortness of breath?',
  },
  {
    id: 'pmh',
    label: 'Past medical history',
    description: 'What medical conditions do you have?',
  },
  {
    id: 'meds',
    label: 'Medications',
    description: 'What medications are you currently taking?',
  },
  {
    id: 'allergies',
    label: 'Allergies',
    description: 'Do you have any allergies to medications or other things?',
  },
]

export default function GuidedChecklist({ onItemComplete }: Props) {
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  const handleToggle = (id: string) => {
    const newCompleted = new Set(completed)
    if (newCompleted.has(id)) {
      newCompleted.delete(id)
    } else {
      newCompleted.add(id)
      if (onItemComplete) {
        onItemComplete(id)
      }
    }
    setCompleted(newCompleted)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-3">
        📋 History Checklist (OPQRST + More)
      </h3>
      <p className="text-sm text-blue-700 mb-4">
        Use this checklist to make sure you ask about all the important areas. Check off items as you cover them.
      </p>

      <div className="space-y-2">
        {checklistItems.map((item) => {
          const isCompleted = completed.has(item.id)

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-2 rounded transition ${
                isCompleted ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'
              }`}
            >
              <input
                type="checkbox"
                id={item.id}
                checked={isCompleted}
                onChange={() => handleToggle(item.id)}
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor={item.id} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isCompleted ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
              </label>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600">
          Progress: {completed.size} / {checklistItems.length} completed
        </p>
      </div>
    </div>
  )
}
