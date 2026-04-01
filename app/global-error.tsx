'use client'

/**
 * Root-level error UI. Must define <html> and <body> (replaces root layout when active).
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-6">{error.message || 'Please refresh the page.'}</p>
          {error.digest ? (
            <p className="text-xs text-gray-400 mb-4">Reference: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try again
          </button>
          <p className="mt-6 text-sm text-gray-500">
            <a href="/" className="text-blue-600 underline">
              Go home
            </a>
          </p>
        </div>
      </body>
    </html>
  )
}
