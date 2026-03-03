import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import type { UserRole } from '@/types'

interface AuthGuardProps {
  children?: React.ReactNode
  requiredRole?: UserRole
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading, logout } = useAuth()
  const { t } = useTranslation()

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!user.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-navy">
            {t('users.accountDeactivated')}
          </h2>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-6 rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-light"
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>
    )
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children ?? <Outlet />
}
