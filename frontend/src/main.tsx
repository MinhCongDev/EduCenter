import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ===========================
// Global Error Boundary
// ===========================
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '800px',
          fontFamily: 'monospace',
          background: '#fee2e2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          color: '#7f1d1d'
        }}>
          <h1 style={{ color: '#dc2626' }}>❌ Lỗi ứng dụng</h1>
          <h2>{this.state.error?.name || 'Unknown Error'}</h2>
          <pre style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.85rem'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🔄 Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
