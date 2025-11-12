import { useEffect, useState } from 'react';

export default function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) return JSON.parse(stored);
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.warn('useLocalStorageState: no se pudo leer localStorage', error);
      }
    }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      if (import.meta.env?.DEV) {
        console.warn('useLocalStorageState: no se pudo escribir localStorage', error);
      }
    }
  }, [key, state]);

  return [state, setState];
}
