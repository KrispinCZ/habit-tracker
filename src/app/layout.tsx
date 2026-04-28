import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Sleduj své zvyky',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-xl font-semibold tracking-tight text-white">Habit Tracker</h1>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
