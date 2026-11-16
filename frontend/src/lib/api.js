// Événement émis quand l'API refuse le jeton (expiré ou invalide) : App.jsx renvoie à l'écran de connexion.
export const LOGOUT_EVENT = 'pulse:logout'

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('pulse_token')
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(url, { ...options, headers })
  if (response.status === 401) {
    localStorage.removeItem('pulse_token')
    window.dispatchEvent(new Event(LOGOUT_EVENT))
  }
  return response
}
