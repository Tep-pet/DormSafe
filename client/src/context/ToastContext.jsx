import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ToastContainer } from '../components/common/Toast';

const ToastContext = createContext(null);

let toastCount = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((payload, defaultType = 'info') => {
    const id = `toast-${++toastCount}-${Date.now()}`;

    let toastObj = {};
    if (typeof payload === 'string') {
      toastObj = {
        id,
        type: defaultType,
        message: payload,
        duration: 4000,
      };
    } else if (typeof payload === 'object' && payload !== null) {
      toastObj = {
        id,
        type: payload.type || defaultType,
        title: payload.title,
        message: payload.message || payload.text || '',
        duration: payload.duration !== undefined ? payload.duration : 4000,
      };
    }

    setToasts((prev) => [...prev, toastObj]);
    return id;
  }, []);

  const toastMethods = useMemo(
    () => ({
      success: (payload) => addToast(payload, 'success'),
      error: (payload) => addToast(payload, 'error'),
      warning: (payload) => addToast(payload, 'warning'),
      info: (payload) => addToast(payload, 'info'),
      custom: (payload) => addToast(payload, payload.type || 'info'),
      dismiss,
    }),
    [addToast, dismiss]
  );

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return { toast: context };
}
