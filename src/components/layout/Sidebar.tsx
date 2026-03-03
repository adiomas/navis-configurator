import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Ship,
  Sliders,
  Users,
  FileText,
  Gift,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/boats', icon: Ship, labelKey: 'nav.boats' },
  { path: '/configurator', icon: Sliders, labelKey: 'nav.configurator' },
  { path: '/clients', icon: Users, labelKey: 'nav.clients' },
  { path: '/quotes', icon: FileText, labelKey: 'nav.quotes' },
  { path: '/templates', icon: Gift, labelKey: 'nav.templates', adminOnly: true },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings', adminOnly: true },
] as const

function SidebarContent({
  onClose,
  isCollapsed,
  onToggleCollapse,
}: {
  onClose: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, isAdmin } = useAuth()

  const filteredNavItems = navItems.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || isAdmin
  )

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-sidebar transition-[width] duration-200',
        isCollapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-12 items-center border-b border-white/10',
          isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-4'
        )}
      >
        <Ship className="h-6 w-6 shrink-0 text-primary" />
        {!isCollapsed && (
          <span className="text-sm font-semibold text-white">Navis Marine</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3" aria-label="Main navigation">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={isCollapsed ? t(item.labelKey) : undefined}
              className={cn(
                'flex items-center rounded-md py-1.5 text-[13px] font-medium transition-colors',
                isCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3',
                isActive
                  ? 'border-l-2 border-primary bg-white/[0.08] text-white'
                  : 'border-l-2 border-transparent text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && t(item.labelKey)}
            </NavLink>
          )
        })}
      </nav>

      {/* User info */}
      <div
        className={cn(
          'border-t border-white/10',
          isCollapsed ? 'flex justify-center p-2' : 'p-3'
        )}
      >
        {isCollapsed ? (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
            title={user?.full_name ?? 'User'}
          >
            {initials}
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {user?.full_name ?? 'User'}
              </p>
              <p className="text-[11px] capitalize text-sidebar-muted">
                {user?.role ?? 'sales'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggleCollapse}
        className="hidden border-t border-white/10 py-2 text-sidebar-foreground hover:bg-sidebar-accent md:flex md:items-center md:justify-center"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden md:flex">
        <SidebarContent
          onClose={onClose}
          isCollapsed={isCollapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Sidebar panel — always expanded on mobile */}
          <aside className="fixed inset-y-0 left-0 animate-slide-in">
            <button
              onClick={onClose}
              className="absolute right-2 top-4 rounded-lg p-1 text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              onClose={onClose}
              isCollapsed={false}
              onToggleCollapse={onToggleCollapse}
            />
          </aside>
        </div>
      )}
    </>
  )
}
