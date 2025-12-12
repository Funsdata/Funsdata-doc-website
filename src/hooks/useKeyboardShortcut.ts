import { useEffect, useMemo } from 'react';

export const useKeyboardShortcut = (keys: string[], handler: () => void) => {
  const comboSignature = useMemo(() => keys.map((key) => key.toLowerCase()).sort().join('+'), [keys]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const pressed: string[] = [];
      if (event.metaKey || event.ctrlKey) {
        pressed.push('mod');
      }
      if (event.shiftKey) {
        pressed.push('shift');
      }
      const key = event.key.toLowerCase();
      if (!['meta', 'shift', 'control', 'alt'].includes(key)) {
        pressed.push(key);
      }
      const pressedSignature = pressed.sort().join('+');
      if (pressedSignature === comboSignature) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handler, comboSignature]);
};
