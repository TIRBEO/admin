'use client';

import React, { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '400px', padding: '24px', textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--color-error-surface, rgba(255, 82, 82, 0.12))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', fontSize: '24px',
          }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text, #fff)', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary, #888)', marginBottom: '24px', maxWidth: '400px' }}>
            An unexpected error occurred. Please try again.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={this.handleRetry} style={{
              padding: '10px 20px', background: 'var(--color-accent, #fff)',
              color: 'var(--color-on-accent, #000)', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}>Try again</button>
            <button onClick={() => window.location.reload()} style={{
              padding: '10px 20px', background: 'transparent',
              color: 'var(--color-text, #fff)', border: '1px solid var(--color-border, #333)',
              borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}>Reload page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
