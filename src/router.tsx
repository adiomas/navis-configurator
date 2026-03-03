/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import AuthGuard from '@/components/layout/AuthGuard'
import DashboardLayout from '@/components/layout/DashboardLayout'

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const BoatsListPage = lazy(() => import('@/pages/boats/BoatsListPage'))
const ConfiguratorPage = lazy(() => import('@/pages/configurator/ConfiguratorPage'))
const ClientsListPage = lazy(() => import('@/pages/clients/ClientsListPage'))
const ClientDetailPage = lazy(() => import('@/pages/clients/ClientDetailPage'))
const QuotesListPage = lazy(() => import('@/pages/quotes/QuotesListPage'))
const QuoteDetailPage = lazy(() => import('@/pages/quotes/QuoteDetailPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const TemplateGroupsPage = lazy(() => import('@/pages/settings/TemplateGroupsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

// Redirect old /boats/:id and /boats/:id/equipment to /boats?boat=:id
function BoatRedirect() {
  const { id } = useParams()
  return <Navigate to={`/boats?boat=${id}`} replace />
}

export const router = createBrowserRouter([
  {
    path: '/auth/login',
    element: (
      <SuspenseWrapper>
        <LoginPage />
      </SuspenseWrapper>
    ),
  },
  {
    path: '/',
    element: <AuthGuard />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },
          { path: 'boats', element: <SuspenseWrapper><BoatsListPage /></SuspenseWrapper> },
          { path: 'boats/new', element: <Navigate to="/boats" replace /> },
          { path: 'boats/:id', element: <BoatRedirect /> },
          { path: 'boats/:id/equipment', element: <BoatRedirect /> },
          { path: 'configurator', element: <SuspenseWrapper><ConfiguratorPage /></SuspenseWrapper> },
          { path: 'clients', element: <SuspenseWrapper><ClientsListPage /></SuspenseWrapper> },
          { path: 'clients/:id', element: <SuspenseWrapper><ClientDetailPage /></SuspenseWrapper> },
          { path: 'quotes', element: <SuspenseWrapper><QuotesListPage /></SuspenseWrapper> },
          { path: 'quotes/:id', element: <SuspenseWrapper><QuoteDetailPage /></SuspenseWrapper> },
          { path: 'templates', element: <AuthGuard requiredRole="admin"><SuspenseWrapper><TemplateGroupsPage /></SuspenseWrapper></AuthGuard> },
          { path: 'settings', element: <AuthGuard requiredRole="admin"><SuspenseWrapper><SettingsPage /></SuspenseWrapper></AuthGuard> },
          { path: 'settings/template-groups', element: <Navigate to="/templates" replace /> },
          { path: 'settings/users', element: <Navigate to="/settings" replace /> },
          { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper>,
  },
])
