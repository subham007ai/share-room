import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected runtime error',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App runtime crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
          <div className="max-w-lg text-center space-y-3 text-white">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-white/70 text-sm">
              The app crashed while rendering this page. Please refresh to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md border border-white/30 hover:bg-white/10 text-sm"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
