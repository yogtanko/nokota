"use client"

import { Component } from "react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <p className="text-lg font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground h-9 px-4 text-sm font-medium hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
