import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect 
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme, Theme } from '@/constants/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  // Persist theme preference
  // Use AsyncStorage (not localStorage since this is React Native):
  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      const saved = await AsyncStorage.getItem('theme');
      if (saved) setIsDark(saved === 'dark');
    } catch {}
  }

  async function toggleTheme() {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('theme', newVal ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{
      theme: isDark ? darkTheme : lightTheme,
      isDark,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
