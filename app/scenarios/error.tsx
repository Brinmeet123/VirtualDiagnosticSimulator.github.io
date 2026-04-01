'use client'

export default function ScenariosError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h2 className="text-xl font-semibold text-gray-900">Could not load scenarios</h2>
      <p className="text-sm text-gray-600">{error.message || 'An unexpected error occurred.'}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Try again
        </button>
        <a href="/" className="text-sm text-primary-600 underline">
          Home
        </a>
      </div>
    </div>
  )
}
