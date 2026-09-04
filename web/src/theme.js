import { useCallback, useEffect, useState } from 'react'

const CLE = 'airpass.theme'

function themeInitial() {
  try {
    const enregistre = localStorage.getItem(CLE)
    if (enregistre) return enregistre
  } catch { /* stockage indisponible */ }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'clair' : 'sombre'
}

/**
 * Thème clair / sombre, appliqué sur <html data-theme> et retenu d'une
 * visite à l'autre. La couleur de la barre d'adresse du mobile suit.
 */
export function useTheme() {
  const [theme, setTheme] = useState(themeInitial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name=theme-color]')
      ?.setAttribute('content', theme === 'clair' ? '#f7f5f1' : '#070b18')

    try { localStorage.setItem(CLE, theme) } catch { /* stockage indisponible */ }
  }, [theme])

  const basculer = useCallback(
    () => setTheme((t) => (t === 'clair' ? 'sombre' : 'clair')),
    [],
  )

  return { theme, basculer }
}
