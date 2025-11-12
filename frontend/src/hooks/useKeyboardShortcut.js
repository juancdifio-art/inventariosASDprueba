import { useEffect, useMemo } from 'react';

export default function useKeyboardShortcut(keys, handler, options = {}) {
  const {
    enabled = true,
    eventType = 'keydown',
    preventDefault = false,
    target,
  } = options;

  const normalizedKeys = useMemo(() => {
    const list = Array.isArray(keys) ? keys : [keys];
    return new Set(
      list
        .filter(Boolean)
        .map((key) => String(key).toLowerCase())
    );
  }, [Array.isArray(keys) ? keys.join('|') : keys]);

  useEffect(() => {
    if (!enabled || typeof handler !== 'function' || normalizedKeys.size === 0) return undefined;
    const element = target ?? (typeof window !== 'undefined' ? window : undefined);
    if (!element || !element.addEventListener) return undefined;

    const listener = (event) => {
      const key = event.key ? event.key.toLowerCase() : '';
      if (!normalizedKeys.has(key)) return;
      if (preventDefault) event.preventDefault();
      handler(event);
    };

    element.addEventListener(eventType, listener);
    return () => {
      element.removeEventListener(eventType, listener);
    };
  }, [enabled, handler, eventType, preventDefault, normalizedKeys, target]);
}
