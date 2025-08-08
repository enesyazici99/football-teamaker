'use client';

import { useState, useCallback } from 'react';
import Toast, { Toast as ToastType } from './Toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const addToast = useCallback((toast: Omit<ToastType, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Global toast fonksiyonunu window objesine ekle
  if (typeof window !== 'undefined') {
    (window as { showToast?: (toast: Omit<ToastType, 'id'>) => void }).showToast = addToast;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
} 