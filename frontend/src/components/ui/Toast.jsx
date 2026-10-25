import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
const EXIT_MS = 180;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    const entry = timers.current.get(id) || {};
    if (entry.hide) clearTimeout(entry.hide);
    entry.remove = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, EXIT_MS);
    timers.current.set(id, entry);
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);

    if (duration > 0) {
      const hide = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, { hide });
    }
  }, [dismissToast]);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error'), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast }}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => {
          let Icon = Info;
          let borderColor = 'var(--info-border)';
          let iconColor = 'var(--info-text)';

          if (toast.type === 'success') {
            Icon = CheckCircle2;
            borderColor = 'var(--success-border)';
            iconColor = 'var(--success-text)';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            borderColor = 'var(--danger-border)';
            iconColor = 'var(--danger-text)';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            borderColor = 'var(--warning-border)';
            iconColor = 'var(--warning-text)';
          }

          return (
            <div
              key={toast.id}
              className={`toast-item ${toast.exiting ? 'is-leaving' : ''}`}
              style={{ border: `1.5px solid ${borderColor}` }}
            >
              <Icon size={19} color={iconColor} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
