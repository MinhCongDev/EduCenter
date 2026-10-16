import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { Toast, ToastType } from '../types';

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, opts?: { title?: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: '#10b981', border: '#059669', icon: '#fff' },
  error: { bg: '#ef4444', border: '#dc2626', icon: '#fff' },
  warning: { bg: '#f59e0b', border: '#d97706', icon: '#fff' },
  info: { bg: '#3b82f6', border: '#2563eb', icon: '#fff' },
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, opts?: { title?: string; duration?: number }) => {
      const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = opts?.duration ?? 3500;
      setToasts((prev) => [...prev, { id, type, message, title: opts?.title, duration }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
    },
    [remove]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast('success', message, { title }),
    [showToast]
  );
  const error = useCallback(
    (message: string, title?: string) => showToast('error', message, { title }),
    [showToast]
  );
  const warning = useCallback(
    (message: string, title?: string) => showToast('warning', message, { title }),
    [showToast]
  );
  const info = useCallback(
    (message: string, title?: string) => showToast('info', message, { title }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, remove }}>
      {children}
      <ToastContainer toasts={toasts} remove={remove} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; remove: (id: string) => void }> = ({
  toasts,
  remove,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '400px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const c = COLORS[toast.type];

  return (
    <div
      role="alert"
      style={{
        pointerEvents: 'auto',
        background: 'white',
        borderLeft: `4px solid ${c.bg}`,
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: '0.85rem 1rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
        minWidth: '280px',
        maxWidth: '400px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(20px)',
        transition: 'all 0.25s ease',
      }}
    >
      <div
        style={{
          background: c.bg,
          color: c.icon,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.95rem',
          flexShrink: 0,
        }}
      >
        {ICONS[toast.type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '0.15rem' }}>
            {toast.title}
          </div>
        )}
        <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.4 }}>{toast.message}</div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '1.1rem',
          lineHeight: 1,
          padding: 0,
        }}
        aria-label="Đóng"
      >
        ✕
      </button>
    </div>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
