import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Menu, ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'nav.dashboard',
  boats: 'nav.boats',
  new: 'boats.addBoat',
  equipment: 'boats.equipment',
  configurator: 'nav.configurator',
  clients: 'nav.clients',
  quotes: 'nav.quotes',
  settings: 'nav.settings',
  users: 'nav.users',
}

function useCurrentTime(): string {
  const [time, setTime] = useState(() => formatTime())
  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 60_000)
    return () => clearInterval(id)
  }, [])
  return time
}

function formatTime(): string {
  const now = new Date()
  return now.toLocaleDateString('hr-HR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + '  ' + now.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const currentTime = useCurrentTime()

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments
    .map((segment) => {
      const labelKey = breadcrumbLabels[segment]
      return labelKey ? t(labelKey) : null
    })
    .filter(Boolean) as string[]

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-4 border-b border-border/60 bg-white px-4">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="min-w-0 flex items-center gap-0.5 overflow-hidden text-xs">
        {breadcrumbs.map((crumb, index) => (
          <span key={index} className="flex items-center gap-0.5">
            {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <span
              className={cn(
                'truncate',
                index === breadcrumbs.length - 1
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Current date/time */}
      <span className="hidden text-xs text-muted-foreground md:block">{currentTime}</span>

      {/* User menu */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
            {initials}
          </div>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-white py-2 shadow-lg">
            <div className="border-b border-border px-4 pb-2">
              <p className="text-sm font-medium text-foreground">{user?.full_name ?? 'User'}</p>
              <span className={cn(
                'mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                user?.role === 'admin'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}>
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Sales'}
              </span>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
