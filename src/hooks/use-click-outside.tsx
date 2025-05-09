
import { useEffect, useRef } from 'react';

export const useClickOutside = (
  handler: () => void,
  ref?: React.RefObject<HTMLElement>
) => {
  const innerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Use the provided ref or the inner ref
      const elementRef = ref || innerRef;
      
      if (
        elementRef.current &&
        event.target instanceof Node &&
        !elementRef.current.contains(event.target)
      ) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handler, ref]);

  return innerRef;
};
