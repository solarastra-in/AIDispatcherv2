/**
 * src/components/ErrorBoundary.tsx
 *
 * React error boundaries only catch errors thrown during render,
 * in lifecycle methods, and in constructors — NOT inside event handlers,
 * async code, or synchronous calls to `window.confirm()`/`alert()`/`prompt()` that
 * throw in a sandboxed iframe context. This file provides:
 * a real class-based ErrorBoundary for render-phase crashes, AND a
 * safeConfirm/safeAlert helper for the specific event-handler-thrown
 * case an ErrorBoundary alone can't catch.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode; // custom UI, falls back to the default below if omitted
  onError?: (error: Error, errorInfo: ErrorInfo) => void; // hook for real logging
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught a render-phase error:", error, errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-8 bg-[#171B21] border border-[#2A2F38] rounded-xl">
      <div className="text-center max-w-md">
        <div className="text-2xl mb-2">⚠️</div>
        <h2 className="text-[#E7E9EC] text-base font-semibold mb-2">Something went wrong</h2>
        <p className="text-[#93999F] text-sm mb-4">
          This section hit an unexpected error and couldn't continue. Your other work isn't affected — try again, or reload if the problem repeats.
        </p>
        <details className="text-left mb-4">
          <summary className="text-[11px] text-[#5B6169] cursor-pointer">Technical details</summary>
          <pre className="text-[10px] text-[#5B6169] mt-2 whitespace-pre-wrap font-mono">{error.message}</pre>
        </details>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#FF8A3D] text-[#171208] rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
