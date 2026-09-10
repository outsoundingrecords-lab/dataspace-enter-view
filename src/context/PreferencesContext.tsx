import React, { createContext, useContext, useState, useEffect } from 'react';

// 1. Accessibility Standards (WCAG 2.2 AA Compliance)
export type ColorBlindnessProfile = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

// 2. Interactive Response & Ergonomics
export type HapticIntensity = 'off' | 'subtle' | 'standard' | 'strong';
export type HoverDelay = 0 | 200 | 500;

// 3. Offline Engine & State Synchronization
export type NetworkMode = 'auto' | 'force-offline' | 'low-data';

// 4. Adaptive Hardware & Data Density Tiers
export type ScalingMode = 'auto' | 'low-power' | 'balanced' | 'high-density';

export interface Preferences {
  // Accessibility
  typeScale: number; // 85 to 150
  highContrast: boolean;
  colorBlindness: ColorBlindnessProfile;
  reduceMotion: boolean;
  touchTargetExpansion: boolean;
  stickyFocusRings: boolean;
  gestureSensitivity: number; // 0 to 100

  // Interactive Response
  hapticFeedback: HapticIntensity;
  targetRefreshRate: 'auto' | 60 | 120;
  hoverDelay: HoverDelay;

  // Offline Engine
  networkMode: NetworkMode;

  // Scaling & Density
  scalingMode: ScalingMode;
}

const DEFAULT_PREFERENCES: Preferences = {
  typeScale: 100,
  highContrast: false,
  colorBlindness: 'none',
  reduceMotion: false,
  touchTargetExpansion: false,
  stickyFocusRings: false,
  gestureSensitivity: 50,
  hapticFeedback: 'standard',
  targetRefreshRate: 'auto',
  hoverDelay: 200,
  networkMode: 'auto',
  scalingMode: 'auto',
};

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (updates: Partial<Preferences>) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = localStorage.getItem('app-preferences');
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load preferences from local storage:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('app-preferences', JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save preferences to local storage:', e);
    }
  }, [preferences]);

  // Apply visual side-effects of preferences to the document body/html
  useEffect(() => {
    const root = document.documentElement;
    
    // Type Scale
    root.style.fontSize = `${preferences.typeScale}%`;
    
    // High Contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    // Reduce Motion
    if (preferences.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Touch Target Expansion
    if (preferences.touchTargetExpansion) {
      root.classList.add('expanded-touch-targets');
    } else {
      root.classList.remove('expanded-touch-targets');
    }

    // Sticky Focus Rings
    if (preferences.stickyFocusRings) {
      root.classList.add('sticky-focus-rings');
    } else {
      root.classList.remove('sticky-focus-rings');
    }

    // Color blindness filter logic could be applied via SVG filters injected into the DOM
    const filterId = `cb-filter-${preferences.colorBlindness}`;
    const filterElement = document.getElementById('color-blindness-filters');
    
    if (preferences.colorBlindness !== 'none') {
      root.style.filter = `url(#${filterId})`;
    } else {
      root.style.filter = 'none';
    }

  }, [preferences]);

  const updatePreferences = (updates: Partial<Preferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, resetPreferences }}>
      {/* SVG Filters for Color Blindness */}
      <svg id="color-blindness-filters" className="hidden" style={{ display: 'none' }}>
        <defs>
          <filter id="cb-filter-protanopia">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0  0.558, 0.442, 0, 0, 0  0, 0.242, 0.758, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="cb-filter-deuteranopia">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0  0.7, 0.3, 0, 0, 0  0, 0.3, 0.7, 0, 0  0, 0, 0, 1, 0" />
          </filter>
          <filter id="cb-filter-tritanopia">
            <feColorMatrix type="matrix" values="0.95, 0.05, 0, 0, 0  0, 0.433, 0.567, 0, 0  0, 0.475, 0.525, 0, 0  0, 0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
