import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { DevModeBadge } from '../components/DevModeBadge'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { SplashPage } from '../features/auth/SplashPage'
import { LoginPage } from '../features/auth/LoginPage'
import { ConsentPage } from '../features/auth/ConsentPage'
import { OnboardingPage } from '../features/auth/OnboardingPage'
import { OhangResultPage } from '../features/auth/OhangResultPage'
import { GardenPage } from '../features/garden/GardenPage'
import { CollectionPage } from '../features/collection/CollectionPage'
import { PlantDetailPage } from '../features/collection/PlantDetailPage'
import { MyPage } from '../features/my/MyPage'
import { useAuthStore } from '../stores/authStore'

function RequireConsent() {
  const isDevMode = useAuthStore((s) => s.isDevMode)
  const consent = useAuthStore((s) => s.consent)
  if (!isDevMode && !consent) return <Navigate to="/consent" replace />
  return <Outlet />
}

function RequireOnboarded() {
  const isOnboarded = useAuthStore((s) => s.isOnboarded)
  const isDevMode = useAuthStore((s) => s.isDevMode)
  if (!isOnboarded && !isDevMode) return <Navigate to="/" replace />
  return <Outlet />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <DevModeBadge />
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/consent" element={<ConsentPage />} />

        <Route element={<RequireConsent />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/onboarding/result" element={<OhangResultPage />} />

          <Route element={<RequireOnboarded />}>
            <Route element={<AppLayout />}>
              <Route path="/garden" element={<GardenPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/collection/:plantId" element={<PlantDetailPage />} />
              <Route path="/my" element={<MyPage />} />
              <Route path="/my/subscribe" element={<PlaceholderPage title="구독 안내" description="심층 해석 · 프리셋 무제한 · 프리미엄 사운드" />} />
              <Route path="/my/settings/*" element={<PlaceholderPage title="설정" />} />
            </Route>

            <Route path="/garden/insight" element={<PlaceholderPage title="심층 해석" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
