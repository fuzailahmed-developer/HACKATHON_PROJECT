import React from "react"
import { Button } from "@/components/ui/button"
import { AlertOctagon } from "lucide-react"

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = "/"
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-muted/20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 flex items-center justify-center mb-4">
            <AlertOctagon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
            An unexpected error occurred in the application rendering engine.
          </p>
          {this.state.error?.message && (
            <pre className="mt-4 p-3 bg-card border rounded text-xs font-mono text-destructive dark:text-red-400 text-left max-w-md overflow-x-auto w-full">
              {this.state.error.message}
            </pre>
          )}
          <Button onClick={this.handleReset} className="mt-6" size="sm">
            Restart Application
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
export default ErrorBoundary
