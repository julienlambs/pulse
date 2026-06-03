// ── Système de thèmes Leeroy ──────────────────────────────────────────────────
// Usage : applyTheme(THEMES['leeroy-dark'])
// mode: 'dark' | 'light'

export const THEMES = {

  // ── Leeroy Dark — violet tech, fond quasi-noir (défaut) ──────────────────
  'leeroy-dark': {
    mode: 'dark',
    vars: {
      '--bg':          '#0D0D14',
      '--card':        '#13131F',
      '--card-2':      '#171725',
      '--accent':      '#6050DC',
      '--accent-soft': 'rgba(96,80,220,0.14)',
      '--accent-rgb':  '96,80,220',
      '--text':        '#FFFFFF',
      '--muted':       '#8888AA',
      '--border':      '#1E1E30',
      '--border-hi':   '#2A2A42',
      '--hi':          '#FF7A6B',
      '--md':          '#E0B96B',
      '--lo':          '#6BCB9C',
      '--header-bg':   'rgba(13,13,20,0.92)',
    },
  },

  // ── Leeroy Light — fond crème, même identité violet ──────────────────────
  'leeroy-light': {
    mode: 'light',
    vars: {
      '--bg':          '#F5F5F0',
      '--card':        '#EEEEE8',
      '--card-2':      '#E4E4DC',
      '--accent':      '#4A3CC8',
      '--accent-soft': 'rgba(74,60,200,0.10)',
      '--accent-rgb':  '74,60,200',
      '--text':        '#1A1A18',
      '--muted':       '#70708A',
      '--border':      'rgba(0,0,0,0.09)',
      '--border-hi':   'rgba(0,0,0,0.14)',
      '--hi':          '#C0392B',
      '--md':          '#A0720A',
      '--lo':          '#2D8A5A',
      '--header-bg':   'rgba(245,245,240,0.92)',
    },
  },
}

// Résout la clé thème depuis le mode
export function resolveThemeKey(mode) {
  return mode === 'dark' ? 'leeroy-dark' : 'leeroy-light'
}

// Applique un thème sur le :root
export function applyTheme(theme) {
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

// Hook simplifié — persisté en localStorage
// Usage : const { themeKey, toggle } = useTheme('leeroy')
import { useState, useEffect } from 'react'

export function useTheme() {
  const stored = localStorage.getItem('leeroy_theme_mode') || 'dark'
  const [mode, setMode] = useState(stored)

  useEffect(() => {
    applyTheme(THEMES[resolveThemeKey(mode)])
    localStorage.setItem('leeroy_theme_mode', mode)
  }, [mode])

  return {
    mode,
    themeKey: resolveThemeKey(mode),
    toggle: () => setMode(m => m === 'dark' ? 'light' : 'dark'),
  }
}
