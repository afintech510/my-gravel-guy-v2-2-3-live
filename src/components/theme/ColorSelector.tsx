
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { useColorTheme, PRIMARY_COLORS, BACKGROUND_COLORS } from '@/contexts/ColorContext';

interface ColorSelectorProps {
  variant?: 'default' | 'minimal';
}

const ColorSelector = ({ variant = 'default' }: ColorSelectorProps) => {
  const { primaryColor, backgroundColor, setPrimaryColor, setBackgroundColor } = useColorTheme();

  const primaryColorKeys = Object.keys(PRIMARY_COLORS) as Array<keyof typeof PRIMARY_COLORS>;
  const backgroundColorKeys = Object.keys(BACKGROUND_COLORS) as Array<keyof typeof BACKGROUND_COLORS>;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={variant === 'minimal' ? 'h-8 w-8' : ''}
        >
          <Palette 
            className="h-5 w-5" 
            style={{ 
              color: PRIMARY_COLORS[primaryColor].value
            }} 
          />
          <span className="sr-only">Change theme colors</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Theme Colors</h4>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Primary Color</div>
            <div className="grid grid-cols-5 gap-2">
              {primaryColorKeys.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className={`w-full h-8 rounded-md p-0 ${primaryColor === key ? 'ring-2 ring-ring' : ''}`}
                  style={{ backgroundColor: PRIMARY_COLORS[key].value }}
                  onClick={() => setPrimaryColor(key)}
                  title={PRIMARY_COLORS[key].name}
                >
                  <span className="sr-only">{PRIMARY_COLORS[key].name}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Background</div>
            <div className="grid grid-cols-4 gap-2">
              {backgroundColorKeys.map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className={`w-full h-8 rounded-md p-0 ${backgroundColor === key ? 'ring-2 ring-ring' : ''}`}
                  style={{ 
                    backgroundColor: BACKGROUND_COLORS[key].value,
                    border: key === 'WHITE' ? '1px solid #E5E7EB' : 'none'
                  }}
                  onClick={() => setBackgroundColor(key)}
                  title={BACKGROUND_COLORS[key].name}
                >
                  <span className="sr-only">{BACKGROUND_COLORS[key].name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorSelector;
