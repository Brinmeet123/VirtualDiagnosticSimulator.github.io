import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
      <p className="text-gray-600">The page you are looking for does not exist.</p>
      <Link
        href="/"
        className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Back to home
      </Link>
    </div>
  )
}
