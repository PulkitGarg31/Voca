"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext({ theme: "light", mounted: false, toggleTheme: () => {}, setTheme: () => {} });

export const STORAGE_KEY = "voca-theme";

// Inline script (stringified) run before paint to set the `dark` class and
// avoid a flash of the wrong theme. Injected in app/layout.jsx <head>.
// Dark (Noir) is the default: everyone gets it unless they explicitly chose light.
export const themeInitScript = `(function(){var d=true;try{d=localStorage.getItem('${STORAGE_KEY}')!=='light';}catch(e){}if(d){document.documentElement.classList.add('dark');}})();`;

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Sync state with whatever the init script already applied. We only trust the
  // value after mount so theme-dependent UI doesn't mismatch the SSR output.
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
    setMounted(true);
  }, []);

  const apply = useCallback((next) => {
    setThemeState(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    apply(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [apply]);

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggleTheme, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
