import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";
import { Link } from "wouter";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging (always log errors, even in production)
    // Consider sending to error tracking service in production
    logger.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
              aria-hidden="true"
            />

            <h1 className="text-2xl font-bold mb-2">An unexpected error occurred</h1>
            <p className="text-muted-foreground mb-6 text-center">
              We're sorry for the inconvenience. You can try reloading the page or return to the homepage.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="p-4 w-full rounded bg-muted overflow-auto mb-6">
                <summary className="cursor-pointer text-sm font-semibold mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-muted-foreground whitespace-break-spaces mt-2">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  {this.state.errorInfo && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={this.handleReset}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer transition-opacity",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
                aria-label="Try again"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Try Again
              </button>
              <Link href="/">
                <button
                  className={cn(
                    "flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                    "bg-secondary text-secondary-foreground border border-border",
                    "hover:bg-secondary/80 cursor-pointer transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  )}
                  aria-label="Go to homepage"
                >
                  <Home size={16} aria-hidden="true" />
                  Go to Homepage
                </button>
              </Link>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-lg",
                  "bg-outline text-foreground border border-border",
                  "hover:bg-accent cursor-pointer transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                )}
                aria-label="Reload page"
              >
                <RotateCcw size={16} aria-hidden="true" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
