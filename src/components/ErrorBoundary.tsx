'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center" style={{ background: '#FFF9F5' }}>
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #EF4444, #F97316)', boxShadow: '0 8px 30px rgba(239, 68, 68, 0.25)' }}
          >
            <span className="text-3xl">😵</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">哎呀，出了點問題</h1>
          <p className="text-text-secondary text-sm mb-6 max-w-xs">
            別擔心，你的資料不會遺失。試試看重新整理頁面。
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="btn-secondary !w-auto !px-6 text-sm"
            >
              🔄 重試
            </button>
            <button
              onClick={this.handleReload}
              className="btn-primary !w-auto !px-6 text-sm"
            >
              🏠 回首頁
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left w-full max-w-md">
              <summary className="text-xs text-text-secondary cursor-pointer">錯誤詳情</summary>
              <pre className="mt-2 p-3 rounded-xl text-xs overflow-auto" style={{ background: 'rgba(0,0,0,0.05)' }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
