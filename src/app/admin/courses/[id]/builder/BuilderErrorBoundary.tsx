'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class BuilderErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Builder Error Boundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center flex-col gap-6 p-8">
          <div className="text-center max-w-md">
            <div className="text-[28px] font-semibold text-[#1C1814] mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Builder fout
            </div>
            <div className="text-[14px] text-[#7A7268] mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Er ging iets mis bij het laden van de course builder. Probeer opnieuw of ga terug naar het overzicht.
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 rounded-full bg-[#C4A265] text-[#1C1814] text-[13px] font-medium hover:bg-[#DFC08A] transition cursor-pointer"
              >
                Opnieuw proberen
              </button>
              <a
                href="/admin/courses"
                className="px-5 py-2.5 rounded-full border border-[rgba(30,26,20,0.15)] text-[#46403A] text-[13px] font-medium hover:bg-[#F0EDE6] transition"
              >
                ← Terug naar cursussen
              </a>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-[12px] text-[#A09A93] cursor-pointer">Technische details</summary>
                <pre className="mt-2 text-[11px] text-[#A09A93] bg-[#F0EDE6] p-3 rounded-lg overflow-auto max-h-[200px]">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
