import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Standard Error Boundary for resilient component rendering.
 * Prevents subcomponent failures from crashing entire page.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={15} className="text-rose-500 shrink-0" />
            <span>Unable to render this section</span>
          </div>
          <p className="text-rose-600">
            {this.state.error?.message || 'A transient rendering error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 transition shadow-2xs"
          >
            <RefreshCw size={12} />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
