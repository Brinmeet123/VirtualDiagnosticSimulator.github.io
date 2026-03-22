'use client'

import React from 'react'
import HighlightProvider from './HighlightProvider'
import Navbar from './Navbar'
import Footer from './Footer'

type Props = { children: React.ReactNode }

class LayoutErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Layout error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50">
          <nav className="bg-white shadow border-b px-4 py-3">
            <a href="/" className="font-bold text-gray-800">Virtual Diagnostic Simulator</a>
          </nav>
          <main className="flex-1 p-6">
            <p className="text-gray-600 mb-4">Part of the app failed to load. Try refreshing the page.</p>
            <a href="/" className="text-blue-600 underline">Go home</a>
          </main>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Wraps layout content in an error boundary so one failing component doesn’t hide the whole UI.
 */
export default function SafeLayoutContent({ children }: Props) {
  return (
    <LayoutErrorBoundary>
      <HighlightProvider>
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </HighlightProvider>
    </LayoutErrorBoundary>
  )
}
