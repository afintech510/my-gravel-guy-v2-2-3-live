
import { useEffect, useRef } from 'react';

interface UseFlashingTitleOptions {
  flashText?: string;
  interval?: number;
  enabled?: boolean;
}

export const useFlashingTitle = ({
  flashText = '🚛 FREE Delivery Nationwide!',
  interval = 2000,
  enabled = true
}: UseFlashingTitleOptions = {}) => {
  const originalTitleRef = useRef<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFlashingRef = useRef<boolean>(false);

  useEffect(() => {
    // Store the original title on mount
    originalTitleRef.current = document.title;

    if (!enabled) {
      return;
    }

    const flashTitle = () => {
      if (isFlashingRef.current) {
        // Switch back to original title
        document.title = originalTitleRef.current;
        isFlashingRef.current = false;
      } else {
        // Switch to flash text
        document.title = flashText;
        isFlashingRef.current = true;
      }
    };

    // Start the flashing interval
    intervalRef.current = setInterval(flashTitle, interval);

    return () => {
      // Cleanup: clear interval and restore original title
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.title = originalTitleRef.current;
    };
  }, [flashText, interval, enabled]);

  // Return a function to manually stop flashing and restore title
  const stopFlashing = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    document.title = originalTitleRef.current;
    isFlashingRef.current = false;
  };

  return { stopFlashing };
};
