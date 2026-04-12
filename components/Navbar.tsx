'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/scenarios', label: 'Scenarios' },
  { href: '/vocab', label: 'Vocab' },
  { href: '/about', label: 'About' },
] as const

export default function Navbar() {
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-primary-600 hover:text-primary-700 shrink-0">
            Virtual Diagnostic Simulator
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition"
              >
                {label}
              </Link>
            ))}

            {status === 'loading' ? (
              <span className="text-sm text-gray-400 px-2" aria-live="polite">
                Loading
              </span>
            ) : session?.user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-teal-800 hover:text-teal-900 max-w-[140px] truncate"
                  title={session.user.email ?? ''}
                >
                  {session.user.name ?? session.user.username ?? 'Profile'}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800 px-3 py-2 rounded-md border border-teal-200 bg-teal-50/80"
              >
                Login / Sign Up
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="btn-press p-2 rounded-md text-gray-700 hover:bg-gray-100 border border-gray-200"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div
            id="mobile-nav"
            className="md:hidden border-t border-gray-200 py-3 space-y-1 pb-4"
          >
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            {status === 'loading' ? (
              <p className="px-3 py-2 text-sm text-gray-400">Loading</p>
            ) : session?.user ? (
              <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-sm font-medium text-teal-800"
                  onClick={() => setMobileOpen(false)}
                >
                  {session.user.name ?? session.user.username ?? 'Profile'}
                </Link>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600"
                  onClick={() => {
                    setMobileOpen(false)
                    void signOut({ callbackUrl: '/' })
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block mt-2 mx-3 py-2.5 text-center text-sm font-semibold text-teal-700 rounded-md border border-teal-200 bg-teal-50/80"
                onClick={() => setMobileOpen(false)}
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
