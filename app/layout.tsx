import type { Metadata } from 'next'
import './styles/globals.css'
import SafeLayoutContent from '@/components/SafeLayoutContent'

export const metadata: Metadata = {
  title: 'Virtual Diagnostic Simulator',
  description: 'Step into the role of a doctor. Interview AI patients, choose tests, and practice clinical reasoning — safely and fictionally.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <SafeLayoutContent>{children}</SafeLayoutContent>
      </body>
    </html>
  )
}

