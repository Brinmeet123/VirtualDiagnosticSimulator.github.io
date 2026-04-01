'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useVocabStore } from '@/lib/useVocabStore'

export default function VocabPage() {
  const { list, remove, setMastered, count, masteredCount, stats, isLoaded } = useVocabStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [viewMode, setViewMode] = useState<'simple' | 'clinical'>('simple')

  const savedItems = list()

  const filteredTerms = useMemo(() => {
    return savedItems.filter(({ saved, term }) => {
      const label = term?.term ?? saved.termId
      const defShort = term?.shortDefinition ?? ''
      const defLong = term?.definition ?? ''
      const cat = term?.category ?? ''

      const searchMatch =
        searchQuery === '' ||
        label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        defShort.toLowerCase().includes(searchQuery.toLowerCase()) ||
        defLong.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.toLowerCase().includes(searchQuery.toLowerCase())

      const tagMatch = selectedCategory === 'All' || cat === selectedCategory

      return searchMatch && tagMatch
    })
  }, [savedItems, searchQuery, selectedCategory])

  const categories = useMemo(() => {
    const s = new Set<string>()
    savedItems.forEach(({ term }) => {
      if (term?.category) s.add(term.category)
    })
    return Array.from(s).sort()
  }, [savedItems])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Vocabulary</h1>
        <p className="text-gray-600">Terms you saved from scenarios — stored on this device only.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Saved terms</p>
          <p className="text-3xl font-bold text-blue-900">{isLoaded ? count : '—'}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 mb-1">Marked mastered</p>
          <p className="text-3xl font-bold text-green-900">{isLoaded ? masteredCount : '—'}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <Link href="/vocab/quiz" className="block text-center">
            <p className="text-sm text-purple-700 mb-1">Practice</p>
            <p className="text-lg font-bold text-purple-900">Take quiz →</p>
          </Link>
        </div>
      </div>

      {stats?.quizAttempts != null && stats.quizAttempts > 0 && (
        <p className="text-sm text-gray-500 mb-4">Quiz attempts (this device): {stats.quizAttempts}</p>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search saved terms…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                type="button"
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1 text-sm font-medium rounded transition ${
                  viewMode === 'simple' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setViewMode('clinical')}
                className={`px-3 py-1 text-sm font-medium rounded transition ${
                  viewMode === 'clinical' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Clinical
              </button>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1 rounded-md text-sm transition ${
                selectedCategory === 'All' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All categories
            </button>
            {categories.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedCategory(tag)}
                className={`px-3 py-1 rounded-md text-sm transition ${
                  selectedCategory === tag ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredTerms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          {savedItems.length === 0 ? (
            <>
              <p className="text-gray-600 mb-4">You have not saved any terms yet.</p>
              <p className="text-sm text-gray-500">
                Highlight a word or phrase in a scenario and tap <strong>Save to Vocab</strong>.
              </p>
            </>
          ) : (
            <p className="text-gray-600">No terms match your search or filter.</p>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredTerms.map(({ saved, term }) => {
            const title = term?.term ?? saved.termId
            const definition =
              term != null
                ? viewMode === 'simple'
                  ? term.shortDefinition
                  : term.definition
                : 'Definition not found — term may have been removed from the local dictionary.'

            return (
              <div key={saved.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-primary-900">{title}</h3>
                    {term && (
                      <p className="text-xs font-medium text-primary-600 mt-0.5">{term.category}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(saved.id)}
                    className="text-gray-400 hover:text-red-600 transition shrink-0"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>

                <p className="text-sm text-gray-700 mb-3">{definition}</p>

                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setMastered(saved.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                      saved.mastered ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {saved.mastered ? '✓ Mastered' : 'Mark mastered'}
                  </button>
                  <Link
                    href="/vocab/quiz"
                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition"
                  >
                    Practice
                  </Link>
                </div>

                {term && term.relatedTerms.length > 0 && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                    <span className="font-medium text-gray-600">Related: </span>
                    {term.relatedTerms.join(', ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
