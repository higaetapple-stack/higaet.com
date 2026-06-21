// React error boundary that captures unhandled render errors,
// forwards them to Sentry (if DSN set) AND to the system_errors table.
import { Component, type ReactNode } from "react";
import { ingestClientError } from "@/lib/observability.functions";
import { captureError as captureBrowserError } from "@/lib/observability/sentry-browser";

interface Props {
  children: ReactNode;
  fallback?: (err: Error, reset: () => void) => ReactNode;
  boundary?: string;
}

interface State {
  error: Error | null;
}

export class ObservabilityErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    captureBrowserError(error, {
      boundary: this.props.boundary,
      componentStack: info.componentStack,
    });
    // Fire-and-forget durable record.
    void ingestClientError({
      data: {
        message: error.message,
        name: error.name,
        stack: error.stack ?? info.componentStack ?? null,
        url: typeof window !== "undefined" ? window.location.href : null,
        route:
          typeof window !== "undefined" ? window.location.pathname : null,
        level: "error",
        context: { boundary: this.props.boundary ?? "react" },
      },
    }).catch(() => {});
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="flex min-h-[200px] items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <h2 className="text-lg font-medium text-ink">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We've logged the error. You can try again or refresh the page.
            </p>
            <button
              onClick={this.reset}
              className="mt-4 inline-flex items-center justify-center rounded-md bg-ink px-4 py-2 text-sm font-medium text-surface transition-colors hover:bg-ink/90"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
