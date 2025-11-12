import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children, autoHideDuration = 4000 }) {
  const [notifications, setNotifications] = useState([]);
  const counterRef = useRef(0);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback(
    (input) => {
      const normalized = typeof input === 'string'
        ? { message: input, variant: 'success', autoHide: true }
        : {
            message: input?.message,
            variant: input?.variant ?? input?.type ?? 'success',
            autoHide: input?.autoHide ?? true,
          };

      if (!normalized.message) return;

      const id = ++counterRef.current;
      setNotifications((prev) => [...prev, { id, message: normalized.message, variant: normalized.variant }]);
      if (normalized.autoHide) {
        setTimeout(() => removeNotification(id), autoHideDuration);
      }
    },
    [autoHideDuration, removeNotification]
  );

  const value = useMemo(() => ({ notifications, addNotification, removeNotification }), [notifications, addNotification, removeNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
