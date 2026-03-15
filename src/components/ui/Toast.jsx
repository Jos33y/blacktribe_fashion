import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import '../../styles/ui/Toast.css';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  useEffect(() => {
    if (exiting) {
      const timer = setTimeout(onDismiss, 300);
      return () => clearTimeout(timer);
    }
  }, [exiting, onDismiss]);

  return (
    <div
      className={`toast toast--${toast.type} ${exiting ? 'toast--exit' : ''}`}
      role="status"
    >
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={() => setExiting(true)}
        aria-label="Dismiss"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
