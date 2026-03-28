import { useEffect } from 'react';

export function useAutoDismissMessage(
  message: string | null | undefined,
  onClear: () => void,
  delayMs = 3000,
) {
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      onClear();
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [delayMs, message, onClear]);
}
