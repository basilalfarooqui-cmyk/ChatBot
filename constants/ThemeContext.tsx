import React, { createContext, useContext } from 'react';
import theme from './theme';

type ThemeContextType = {
  colors: typeof theme.colors;
  radius: typeof theme.radius;
  spacing: typeof theme.spacing;
  typography: typeof theme.typography;
};

const ThemeContext = createContext<ThemeContextType>({
  colors: theme.colors,
  radius: theme.radius,
  spacing: theme.spacing,
  typography: theme.typography,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider
      value={{
        colors: theme.colors,
        radius: theme.radius,
        spacing: theme.spacing,
        typography: theme.typography,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
