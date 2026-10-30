import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastVariants = {
  initial: {
    opacity: 0,
    scale: 0.92,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
};

const VARIANT_CONFIGS = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-200/80',
    borderColor: 'border-emerald-200/80',
    accentBar: 'bg-emerald-500',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 border-rose-200/80',
    borderColor: 'border-rose-200/80',
    accentBar: 'bg-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-200/80',
    borderColor: 'border-amber-200/80',
    accentBar: 'bg-amber-500',
  },
  info: {
    icon: Info,
    iconColor: 'text-ateneo-blue',
    iconBg: 'bg-blue-50 border-blue-200/80',
    borderColor: 'border-blue-200/80',
    accentBar: 'bg-ateneo-blue',
  },
};

export function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const type = toast.type || 'info';
  const config = VARIANT_CONFIGS[type] || VARIANT_CONFIGS.info;
  const IconComponent = config.icon;

  useEffect(() => {
    if (toast.duration === 0 || isPaused) return;

    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, isPaused, onDismiss]);

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-2xl border ${config.borderColor} bg-white/95 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur-md transition-shadow duration-200 hover:shadow-2xl`}
      role="alert"
    >
      {/* Mini Accent Indicator Stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentBar}`} />

      {/* Semantic Icon Container */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${config.iconBg} ${config.iconColor}`}
      >
        <IconComponent size={16} strokeWidth={2.5} />
      </div>

      {/* Toast Content Area */}
      <div className="min-w-0 flex-1 pt-0.5">
        {toast.title && (
          <h4 className="text-xs font-bold text-slate-900 leading-tight">
            {toast.title}
          </h4>
        )}
        <p className={`text-xs text-slate-600 leading-relaxed ${toast.title ? 'mt-0.5' : ''}`}>
          {toast.message}
        </p>
      </div>

      {/* Manual Dismiss Button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Close notification"
      >
        <X size={13} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <aside
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </aside>
  );
}
