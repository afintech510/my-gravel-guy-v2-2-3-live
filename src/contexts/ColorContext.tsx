
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the color options
export const PRIMARY_COLORS = {
  YELLOW: { name: 'Yellow', value: '#F7CA18', hsl: '46 93% 53%' },
  ORANGE: { name: 'Orange', value: '#F97316', hsl: '24 95% 53%' },
  LIME_GREEN: { name: 'Lime Green', value: '#84CC16', hsl: '90 61% 44%' },
  LIME_YELLOW: { name: 'Lime Yellow', value: '#BEF264', hsl: '83 84% 67%' },
};

export const BACKGROUND_COLORS = {
  WHITE: { name: 'White', value: '#FFFFFF', hsl: '0 0% 100%' },
  LIGHT_GRAY: { name: 'Light Gray', value: '#E5E7EB', hsl: '220 13% 91%' },
  MEDIUM_GRAY: { name: 'Medium Gray', value: '#6B7280', hsl: '220 9% 46%' },
  DARK_GRAY: { name: 'Dark Gray', value: '#222222', hsl: '0 0% 13%' },
};

type PrimaryColorKey = keyof typeof PRIMARY_COLORS;
type BackgroundColorKey = keyof typeof BACKGROUND_COLORS;

interface ColorContextType {
  primaryColor: PrimaryColorKey;
  backgroundColor: BackgroundColorKey;
  setPrimaryColor: (color: PrimaryColorKey) => void;
  setBackgroundColor: (color: BackgroundColorKey) => void;
}

// Create the context with default values
const ColorContext = createContext<ColorContextType>({
  primaryColor: 'ORANGE',
  backgroundColor: 'WHITE',
  setPrimaryColor: () => {},
  setBackgroundColor: () => {},
});

export const useColorTheme = () => useContext(ColorContext);

export const ColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved preferences or use defaults
  const [primaryColor, setPrimaryColor] = useState<PrimaryColorKey>(() => {
    const saved = localStorage.getItem('primaryColor');
    return (saved as PrimaryColorKey) || 'ORANGE';
  });

  const [backgroundColor, setBackgroundColor] = useState<BackgroundColorKey>(() => {
    const saved = localStorage.getItem('backgroundColor');
    return (saved as BackgroundColorKey) || 'WHITE';
  });

  // Update CSS variables when colors change
  useEffect(() => {
    // Get the selected colors
    const primary = PRIMARY_COLORS[primaryColor];
    const background = BACKGROUND_COLORS[backgroundColor];
    
    // Update CSS variables
    document.documentElement.style.setProperty('--primary', primary.hsl);
    document.documentElement.style.setProperty('--background', background.hsl);
    
    // Adjust text colors for contrast
    if (['MEDIUM_GRAY', 'DARK_GRAY'].includes(backgroundColor)) {
      document.documentElement.style.setProperty('--foreground', '0 0% 98%');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.style.setProperty('--foreground', '240 10% 3.9%');
      document.documentElement.classList.remove('dark');
    }

    // Save preferences
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('backgroundColor', backgroundColor);
  }, [primaryColor, backgroundColor]);

  return (
    <ColorContext.Provider value={{ primaryColor, backgroundColor, setPrimaryColor, setBackgroundColor }}>
      {children}
    </ColorContext.Provider>
  );
};
