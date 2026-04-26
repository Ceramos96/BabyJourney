import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './config/navigation.js'
import AppShell from './components/layout/AppShell.jsx'
import AuthScreen from './screens/Auth/index.jsx'
import HomeScreen from './screens/Home/index.jsx'
import GrowthScreen from './screens/Growth/index.jsx'
import JournalScreen from './screens/Journal/index.jsx'
import HealthScreen from './screens/Health/index.jsx'
import FamilyScreen from './screens/Family/index.jsx'

export default function App() {
  return (
    <Routes>
      {/* Auth — outside AppShell (no nav chrome) */}
      <Route path={ROUTES.AUTH} element={<AuthScreen />} />
      <Route path={ROUTES.AUTH_INVITE} element={<AuthScreen isInvite />} />

      {/* Protected — inside AppShell (handles auth redirect) */}
      <Route element={<AppShell />}>
        <Route index element={<HomeScreen />} />
        <Route path={ROUTES.HOME} element={<HomeScreen />} />
        <Route path={ROUTES.GROWTH} element={<GrowthScreen />} />
        <Route path={ROUTES.JOURNAL} element={<Navigate to={ROUTES.JOURNAL_PHOTOS} replace />} />
        <Route path={ROUTES.JOURNAL_PHOTOS} element={<JournalScreen tab="photos" />} />
        <Route path={ROUTES.JOURNAL_MILESTONES} element={<JournalScreen tab="milestones" />} />
        <Route path={ROUTES.HEALTH} element={<Navigate to={ROUTES.HEALTH_NOTES} replace />} />
        <Route path={ROUTES.HEALTH_NOTES} element={<HealthScreen tab="notes" />} />
        <Route path={ROUTES.HEALTH_ALLERGIES} element={<HealthScreen tab="allergies_food" />} />
        <Route path={ROUTES.HEALTH_VACCINATIONS} element={<HealthScreen tab="vaccinations" />} />
        <Route path={ROUTES.FAMILY} element={<FamilyScreen />} />
      </Route>
    </Routes>
  )
}
