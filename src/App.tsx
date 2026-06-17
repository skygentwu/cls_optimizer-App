import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import LoginPage from '@/pages/login/LoginPage';
import AppShell from '@/components/AppShell';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import { SkeletonCard } from '@/components/common/SkeletonCard';

const ComparePage = lazy(() => import('@/pages/compare/ComparePage'));
const TrendsPage = lazy(() => import('@/pages/trends/TrendsPage'));
const InsightsPage = lazy(() => import('@/pages/insights/InsightsPage'));
const BacktestPage = lazy(() => import('@/pages/backtest/BacktestPage'));
const ForecastPage = lazy(() => import('@/pages/forecast/ForecastPage'));
const MarginPage = lazy(() => import('@/pages/margin/MarginPage'));
const ReportPage = lazy(() => import('@/pages/report/ReportPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const ManualPage = lazy(() => import('@/pages/manual/ManualPage'));
const RecommendationPage = lazy(() => import('@/pages/recommendation/RecommendationPage'));

function App() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            isLoggedIn ? (
              <AppShell>
                <Suspense fallback={<div style={{ padding: 24 }}><SkeletonCard rows={4} /></div>}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/compare" element={<ComparePage />} />
                    <Route path="/trends" element={<TrendsPage />} />
                    <Route path="/insights" element={<InsightsPage />} />
                    <Route path="/backtest" element={<BacktestPage />} />
                    <Route path="/forecast" element={<ForecastPage />} />
                    <Route path="/margin" element={<MarginPage />} />
                    <Route path="/report" element={<ReportPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/manual" element={<ManualPage />} />
                    <Route path="/recommendation" element={<RecommendationPage />} />
                  </Routes>
                </Suspense>
              </AppShell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
