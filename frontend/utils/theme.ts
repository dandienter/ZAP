"use client";

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const THEME_STORAGE_KEY = "zap_theme";

/**
 * Resolves system preference
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Reads stored theme from localStorage safely
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === "dark" || saved === "light" || saved === "system") {
      return saved;
    }
  } catch (err) {
    console.warn("Gagal membaca tema dari localStorage:", err);
  }
  return "dark";
}

/**
 * Applies the theme to the <html> document root element
 */
export function applyTheme(theme: ThemeMode): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  const resolved = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent("zap_theme_change", { detail: { theme, resolved } }));
  } catch (err) {
    console.warn("Gagal menyimpan tema:", err);
  }

  return resolved;
}

/**
 * Hook to manage theme state across components
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    // Initial read
    const initial = getStoredTheme();
    setThemeState(initial);
    const resolved = applyTheme(initial);
    setResolvedTheme(resolved);

    // Listener for system preference changes when in 'system' mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const current = getStoredTheme();
      if (current === "system") {
        const nextResolved = applyTheme("system");
        setResolvedTheme(nextResolved);
      }
    };

    // Listener for custom theme change events in same or other components
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode; resolved: ResolvedTheme }>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail.theme);
        setResolvedTheme(customEvent.detail.resolved);
      }
    };

    // Listener for cross-window / cross-tab changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const next = e.newValue as ThemeMode;
        if (next === "dark" || next === "light" || next === "system") {
          setThemeState(next);
          const resolved = applyTheme(next);
          setResolvedTheme(resolved);
        }
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener("zap_theme_change", handleThemeChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("zap_theme_change", handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    const resolved = applyTheme(newTheme);
    setResolvedTheme(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark",
    isLight: resolvedTheme === "light",
  };
}
