"use client";

import { useEffect, useState, useCallback } from "react";

export type ThemeMode = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const THEME_STORAGE_KEY = "zap_theme_v2";

/**
 * Resolves system preference (defaults to light on SSR)
 */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Reads stored theme from localStorage safely (defaults to light mode)
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (saved === "dark" || saved === "light" || saved === "system") {
      return saved;
    }
  } catch (err) {
    console.warn("Gagal membaca tema dari localStorage:", err);
  }
  return "light";
}

/**
 * Applies the theme to the <html> document root element
 */
export function applyTheme(theme: ThemeMode): ResolvedTheme {
  if (typeof window === "undefined") return "light";
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
    window.dispatchEvent(new CustomEvent("zap_theme_change", { detail: { theme, resolved } }));
  } catch (err) {
    console.warn("Gagal menyimpan tema:", err);
  }

  return resolved;
}

/**
 * Hook to manage theme state across components (default: light)
 */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    const resolved = applyTheme(initial);
    setResolvedTheme(resolved);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const current = getStoredTheme();
      if (current === "system") {
        const nextResolved = applyTheme("system");
        setResolvedTheme(nextResolved);
      }
    };

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: ThemeMode; resolved: ResolvedTheme }>;
      if (customEvent.detail) {
        setThemeState(customEvent.detail.theme);
        setResolvedTheme(customEvent.detail.resolved);
      }
    };

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
