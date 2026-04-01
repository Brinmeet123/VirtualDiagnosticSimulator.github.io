'use client'

export default function ScenarioError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h2 className="text-xl font-semibold text-gray-900">Scenario failed to load</h2>
      <p className="text-sm text-gray-600">
        {error.message || 'Something went wrong while loading this case.'}
      </p>
      {error.digest ? (
        <p className="text-xs text-gray-400">Reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Try again
        </button>
        <a href="/scenarios" className="text-sm text-primary-600 underline hover:text-primary-800">
          All scenarios
        </a>
      </div>
    </div>
  )
}
