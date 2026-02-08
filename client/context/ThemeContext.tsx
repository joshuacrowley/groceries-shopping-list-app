import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useColorScheme as useSystemColorScheme, Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type ThemePreference = "system" | "light" | "dark";
export type EffectiveTheme = "light" | "dark";

const THEME_STORAGE_KEY = "app_theme_preference";

interface ThemeContextValue {
  /** The user's preference: system, light, or dark */
  themePreference: ThemePreference;
  /** The resolved theme based on preference (always light or dark) */
  effectiveTheme: EffectiveTheme;
  /** Update the theme preference */
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themePreference: "system",
  effectiveTheme: "light",
  setThemePreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== "web") {
          const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
          if (stored === "light" || stored === "dark" || stored === "system") {
            setThemePreferenceState(stored);
          }
        }
      } catch (e) {
        console.warn("Failed to load theme preference:", e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    // Persist the preference
    if (Platform.OS !== "web") {
      SecureStore.setItemAsync(THEME_STORAGE_KEY, preference).catch((e) =>
        console.warn("Failed to save theme preference:", e)
      );
    }
    // Update the system appearance override so native UI elements match
    if (preference === "system") {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(preference);
    }
  }, []);

  // Also set the appearance override on initial load
  useEffect(() => {
    if (isLoaded && themePreference !== "system") {
      Appearance.setColorScheme(themePreference);
    }
  }, [isLoaded, themePreference]);

  const effectiveTheme: EffectiveTheme =
    themePreference === "system"
      ? (systemColorScheme ?? "light")
      : themePreference;

  return (
    <ThemeContext.Provider
      value={{ themePreference, effectiveTheme, setThemePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/** Get the full theme context (preference + setter) */
export function useThemePreference() {
  return useContext(ThemeContext);
}

/** Drop-in replacement for useColorScheme that respects user preference */
export function useAppColorScheme(): EffectiveTheme {
  const { effectiveTheme } = useContext(ThemeContext);
  return effectiveTheme;
}
