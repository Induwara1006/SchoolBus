import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console only in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo
    });

    // In production, you might want to send error to logging service
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '80px auto',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            😕
          </div>
          <h2 style={{ 
            color: '#dc2626',
            marginBottom: '16px'
          }}>
            Oops! Something went wrong
          </h2>
          <p style={{ 
            color: '#6b7280',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Refresh Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Go Home
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginTop: '32px',
              padding: '16px',
              backgroundColor: '#fee',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '14px'
            }}>
              <summary style={{ 
                cursor: 'pointer',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                overflow: 'auto',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
