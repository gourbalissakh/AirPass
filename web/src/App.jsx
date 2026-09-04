import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { api, jetonCourant } from './api'
import { useTheme } from './theme'
import Layout from './composants/Layout'
import ConsoleLayout from './composants/ConsoleLayout'
import Accueil from './pages/passager/Accueil'
import Enregistrement from './pages/passager/Enregistrement'
import CartePage from './pages/passager/CartePage'
import StatutVol from './pages/passager/StatutVol'
import Connexion from './pages/personnel/Connexion'
import Guichet from './pages/agent/Guichet'
import TableauBord from './pages/admin/TableauBord'
import Vols from './pages/admin/Vols'

/** Écrans servis dans la coquille d'exploitation plutôt que sur le site public. */
const ROUTES_CONSOLE = ['/guichet', '/admin']

export default function App() {
  const { theme, basculer } = useTheme()
  const { pathname } = useLocation()
  const [utilisateur, setUtilisateur] = useState(null)
  const [pret, setPret] = useState(false)

  // Restaure la session du personnel au rechargement de la page.
  useEffect(() => {
    if (!jetonCourant()) { setPret(true); return }
    api.get('/auth/moi')
      .then((r) => setUtilisateur(r.data.utilisateur))
      .catch(() => setUtilisateur(null))
      .finally(() => setPret(true))
  }, [])

  if (!pret) return null

  const estAgent = utilisateur?.role === 'agent' || utilisateur?.role === 'admin'
  const estAdmin = utilisateur?.role === 'admin'

  const enConsole = utilisateur && ROUTES_CONSOLE.some((r) => pathname.startsWith(r))
  const Coquille = enConsole ? ConsoleLayout : Layout

  return (
    <Coquille
      utilisateur={utilisateur}
      surDeconnexion={() => setUtilisateur(null)}
      theme={theme}
      surBascule={basculer}
    >
      <HautDePage />
      <Routes>
        {/* Parcours passager — aucun compte requis (EF-1.3). */}
        <Route path="/" element={<Accueil />} />
        <Route path="/enregistrement/:jeton" element={<Enregistrement />} />
        <Route path="/carte/:jeton" element={<CartePage />} />
        <Route path="/vol" element={<StatutVol />} />

        {/* Espace du personnel Air Burkina. */}
        <Route
          path="/personnel"
          element={<Connexion surConnexion={setUtilisateur} utilisateur={utilisateur} />}
        />
        <Route path="/guichet" element={estAgent ? <Guichet /> : <Navigate to="/personnel" replace />} />
        <Route path="/admin" element={estAdmin ? <TableauBord /> : <Navigate to="/personnel" replace />} />
        <Route path="/admin/vols" element={estAdmin ? <Vols /> : <Navigate to="/personnel" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Coquille>
  )
}

/** Remet la page en haut à chaque navigation. */
function HautDePage() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}
