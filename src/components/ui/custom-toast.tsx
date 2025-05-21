
import React from 'react';
import { Toast, ToastProps } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface CustomToastProps extends React.ComponentPropsWithoutRef<typeof Toast> {
  glowing?: boolean;
}

export const CustomToast = React.forwardRef<
  React.ElementRef<typeof Toast>,
  CustomToastProps
>(({ className, glowing = true, ...props }, ref) => {
  return (
    <Toast
      ref={ref}
      className={cn(
        glowing && "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]",
        className
      )}
      {...props}
    />
  );
});
CustomToast.displayName = "CustomToast";
