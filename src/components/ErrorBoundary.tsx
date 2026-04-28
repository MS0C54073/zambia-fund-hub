import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/errorLog";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level boundary that catches render-time crashes so a single broken
 * component doesn't take the whole app down. Errors are forwarded to the
 * error_logs table for admin visibility.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(error, {
      category: "render",
      source: "ErrorBoundary",
      context: { componentStack: info.componentStack?.slice(0, 2000) },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The page hit an unexpected error. The team has been notified.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs text-left bg-muted p-3 rounded overflow-auto max-h-40">
              {this.state.error.message}
            </pre>
          )}
          <Button onClick={this.handleReset}>Reload</Button>
        </div>
      </div>
    );
  }
}
