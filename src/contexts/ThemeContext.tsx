import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';
type UISkin = 'default' | 'broadcast';

interface ThemeContextType {
  mode: ThemeMode;
  skin: UISkin;
  toggleMode: () => void;
  toggleSkin: () => void;
  setSkin: (skin: UISkin) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('rm-theme-mode');
    return (saved as ThemeMode) || 'light';
  });
  
  const [skin, setSkin] = useState<UISkin>(() => {
    const saved = localStorage.getItem('rm-ui-skin');
    return (saved as UISkin) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('rm-theme-mode', mode);
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('rm-ui-skin', skin);
    const root = document.documentElement;
    if (skin === 'broadcast') {
      root.classList.add('broadcast');
    } else {
      root.classList.remove('broadcast');
    }
  }, [skin]);

  const toggleMode = () => setMode(prev => prev === 'light' ? 'dark' : 'light');
  const toggleSkin = () => setSkin(prev => prev === 'default' ? 'broadcast' : 'default');

  return (
    <ThemeContext.Provider value={{ mode, skin, toggleMode, toggleSkin, setSkin, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
