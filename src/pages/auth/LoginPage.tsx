import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Ship, Mail, Eye, EyeOff } from 'lucide-react'
import { loginSchema, type LoginFormData } from '@/lib/validators'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isLoading: authLoading, login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already logged in
  if (user && !authLoading) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setAuthError(null)
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch {
      setAuthError(t('auth.invalidCredentials'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md rounded-xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Ship className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h1 className="text-center font-display text-2xl font-semibold text-navy">
          {t('auth.loginTitle')}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t('auth.loginSubtitle')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" autoComplete="on">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              {t('auth.email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                {...register('email')}
                className={cn(
                  'w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-base md:text-sm outline-none transition-colors',
                  'focus:border-primary focus:ring-1 focus:ring-primary',
                  errors.email ? 'border-red-500' : 'border-border'
                )}
                placeholder="name@navis-marine.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className={cn(
                  'w-full rounded-lg border bg-white py-2.5 pl-3 pr-10 text-base md:text-sm outline-none transition-colors',
                  'focus:border-primary focus:ring-1 focus:ring-primary',
                  errors.password ? 'border-red-500' : 'border-border'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground">
              {t('auth.rememberMe')}
            </label>
          </div>

          {/* Auth error */}
          {authError && (
            <p className="text-center text-sm text-red-500">{authError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors',
              'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isSubmitting ? t('common.loading') : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  )
}
