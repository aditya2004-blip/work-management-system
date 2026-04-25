import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    // Apply/remove dark class on root element
    document.documentElement.classList.toggle('dark', darkMode);

    // Persist theme preference
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Toggle theme
  const toggleDark = useCallback(() => setDarkMode((prev) => !prev), []);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to access theme context
export const useTheme = () => {
  const ctx = useContext(ThemeContext);

  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');

  return ctx;
};