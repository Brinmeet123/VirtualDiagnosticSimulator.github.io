'use client'

import { useState, useEffect, useMemo } from 'react'
import { vocab, VocabTerm } from '@/data/vocab'
import Link from 'next/link'
import { useVocabStore } from '@/lib/useVocabStore'
import { medicalTermToLegacyVocabTerm } from '@/src/lib/medicalTermAdapters'
type QuizQuestion = {
  term: VocabTerm
  options: string[]
  correctIndex: number
}

export default function QuizPage() {
  const { list, recordQuizComplete, isLoaded } = useVocabStore()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [quizComplete, setQuizComplete] = useState(false)
  const [viewMode, setViewMode] = useState<'simple' | 'clinical'>('simple')

  const savedVocabTerms = useMemo((): VocabTerm[] => {
    return list()
      .filter((row) => row.term != null)
      .map((row) => medicalTermToLegacyVocabTerm(row.term!))
  }, [list])

  const generateQuiz = () => {
    if (savedVocabTerms.length === 0) return

    const shuffled = [...savedVocabTerms].sort(() => Math.random() - 0.5).slice(0, 10)

    const quizQuestions: QuizQuestion[] = shuffled.map((term) => {
      const wrongAnswers = vocab
        .filter((t) => t.term !== term.term)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((t) => (viewMode === 'simple' ? t.definitionSimple : t.definitionClinical))

      const correctAnswer = viewMode === 'simple' ? term.definitionSimple : term.definitionClinical
      const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
      const correctIndex = allOptions.indexOf(correctAnswer)

      return { term, options: allOptions, correctIndex }
    })

    setQuestions(quizQuestions)
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setQuizComplete(false)
  }

  useEffect(() => {
    if (!isLoaded) return
    if (savedVocabTerms.length > 0) {
      generateQuiz()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, isLoaded, savedVocabTerms.length])

  const handleAnswerSelect = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    const question = questions[currentQuestion]
    const isCorrect = selectedAnswer === question.correctIndex
    if (isCorrect) {
      setScore((s) => s + 1)
    }
    setShowResult(true)
  }

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizComplete(true)
      recordQuizComplete()
    }
  }

  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Loading…</p>
      </div>
    )
  }

  if (savedVocabTerms.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vocabulary Quiz</h1>
          <p className="text-gray-600 mb-6">Save a few terms from scenarios first, then come back to practice.</p>
          <Link href="/vocab" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
            Go to My Vocabulary
          </Link>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vocabulary Quiz</h1>
          <p className="text-gray-600 mb-6">Preparing questions…</p>
        </div>
      </div>
    )
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz complete</h1>
          <div className="mb-6">
            <p className="text-5xl font-bold text-primary-600 mb-2">{percentage}%</p>
            <p className="text-lg text-gray-700">
              You got {score} out of {questions.length} correct.
            </p>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              type="button"
              onClick={() => generateQuiz()}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              New quiz
            </button>
            <Link href="/vocab" className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
              Back to vocabulary
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Vocabulary quiz</h1>
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

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-gray-700">
            Score: {score} / {currentQuestion + (showResult ? 1 : 0)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary-900 mb-4">
            What best matches <span className="text-primary-600">{question.term.display}</span>?
          </h2>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Why it matters:</strong> {question.term.whyItMatters}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrect = index === question.correctIndex
            const showCorrect = showResult && isCorrect
            const showIncorrect = showResult && isSelected && !isCorrect

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  showCorrect
                    ? 'border-green-500 bg-green-50'
                    : showIncorrect
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-gray-50'
                } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      showCorrect
                        ? 'border-green-500 bg-green-500 text-white'
                        : showIncorrect
                          ? 'border-red-500 bg-red-500 text-white'
                          : isSelected
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-gray-300'
                    }`}
                  >
                    {showCorrect ? '✓' : showIncorrect ? '×' : String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {showResult && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              selectedAnswer === question.correctIndex ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`font-medium ${
                selectedAnswer === question.correctIndex ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {selectedAnswer === question.correctIndex
                ? 'Correct.'
                : `Incorrect. Correct: ${question.options[question.correctIndex]}`}
            </p>
            {question.term.exampleSimple && (
              <p className="text-sm text-gray-700 mt-2 italic">Example: {question.term.exampleSimple}</p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          {!showResult ? (
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              {currentQuestion < questions.length - 1 ? 'Next' : 'Finish'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
