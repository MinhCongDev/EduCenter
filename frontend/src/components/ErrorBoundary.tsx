import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleLogout = () => {
    localStorage.removeItem('educenter_token');
    localStorage.removeItem('educenter_user');
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            padding: '2rem',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '2.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #334155',
              textAlign: 'center',
              color: '#f8fafc',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              ⚠️
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#ffffff' }}>
              Đã xảy ra sự cố hiển thị giao diện
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
              Hệ thống vừa ghi nhận một lỗi hiển thị. Bạn có thể tải lại trang hoặc đăng xuất để làm mới phiên làm việc.
            </p>

            {this.state.error && (
              <div
                style={{
                  backgroundColor: '#090d16',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid #1e293b',
                }}
              >
                <div style={{ color: '#ef4444', fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 600 }}>
                  {this.state.error.name}: {this.state.error.message}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                🔄 Tải lại trang
              </button>
              <button
                type="button"
                onClick={this.handleLogout}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  backgroundColor: 'transparent',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                🚪 Đăng xuất & Đăng nhập lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
