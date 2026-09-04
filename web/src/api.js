import axios from 'axios'

/**
 * Client HTTP unique de l'application.
 *
 * En développement, Vite proxifie /api vers le back-end ; en production,
 * VITE_API_URL pointe vers l'API déployée.
 */
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? '') + '/api',
  headers: { Accept: 'application/json' },
})

const CLE_JETON = 'envol.jeton'

export function definirJeton(jeton) {
  if (jeton) localStorage.setItem(CLE_JETON, jeton)
  else localStorage.removeItem(CLE_JETON)
}

export function jetonCourant() {
  return localStorage.getItem(CLE_JETON)
}

api.interceptors.request.use((config) => {
  const jeton = jetonCourant()
  if (jeton) config.headers.Authorization = 'Bearer ' + jeton
  return config
})

/** Extrait un message affichable de n'importe quelle erreur de l'API. */
export function messageErreur(erreur) {
  const donnees = erreur?.response?.data
  if (!donnees) return "Le service est momentanément indisponible. Réessayez."
  if (donnees.message && !donnees.errors) return donnees.message
  if (donnees.errors) return Object.values(donnees.errors).flat().join(' ')
  return "Une erreur est survenue."
}
