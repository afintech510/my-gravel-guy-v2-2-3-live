import React from 'react';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

interface FloatingCalculatorButtonProps {
  onClick: () => void;
}

export const FloatingCalculatorButton = ({ onClick }: FloatingCalculatorButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground z-50"
      size="icon"
    >
      <Calculator className="h-6 w-6" />
    </Button>
  );
};