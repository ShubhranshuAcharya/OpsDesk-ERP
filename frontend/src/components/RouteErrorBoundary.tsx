import { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Label shown in "back" button. Defaults to "Go back". */
  backLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * RouteErrorBoundary — wraps a page-level route to catch any
 * render-time errors (e.g. accessing a property on undefined data
 * before a loading guard, or a React hooks violation) and shows a
 * user-friendly "Something went wrong" screen instead of a blank page.
 *
 * Usage:
 *   <RouteErrorBoundary>
 *     <ChallanDetail />
 *   </RouteErrorBoundary>
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Log to console so developers can still see the full stack in DevTools
    console.error('[RouteErrorBoundary] Caught render error:', error);
    console.error('[RouteErrorBoundary] Component stack:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-ops-danger" />
          </div>
          <h2 className="text-ops-xl font-semibold text-ops-text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-ops-sm text-ops-text-secondary max-w-md mb-6">
            This page encountered an unexpected error. You can try reloading, or go back to the previous page.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mb-6 text-left w-full max-w-xl text-xs bg-ops-bg-base border border-ops-border-default rounded-ops-sm p-4 overflow-auto text-red-600">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 h-9 px-4 text-ops-sm border border-ops-border-default rounded-ops-sm hover:bg-ops-bg-base transition-colors text-ops-text-secondary"
            >
              <ArrowLeft size={15} />
              {this.props.backLabel || 'Go back'}
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 h-9 px-4 text-ops-sm bg-ops-primary text-white rounded-ops-sm hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={15} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
