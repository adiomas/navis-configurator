# Session 2: Layout + Navigation

## Prerequisites
- Session 1 complete (scaffold, dependencies, types)

## Goal
Complete app shell with sidebar, header, routing — all routes render placeholder content within a professional dashboard layout.

## Detailed Steps

### 1. Create React Router configuration (`src/router.tsx`)
Replace placeholder router with full nested routing:
```
/ → redirect to /dashboard
/auth/login → LoginPage (no layout)
/dashboard → DashboardPage (inside DashboardLayout)
/boats → BoatsListPage
/boats/new → BoatCreatePage
/boats/:id → BoatDetailPage
/boats/:id/equipment → BoatEquipmentPage
/configurator → ConfiguratorPage
/clients → ClientsListPage
/clients/:id → ClientDetailPage
/quotes → QuotesListPage
/quotes/:id → QuoteDetailPage
/settings → SettingsPage
/settings/users → UsersPage
```

### 2. Create `DashboardLayout.tsx` (`src/components/layout/DashboardLayout.tsx`)
- Wrapper component with sidebar + header + main content area
- Sidebar: left, fixed width (256px desktop)
- Main content: `<Outlet />` with padding and scroll
- Mobile: sidebar hidden by default, toggled by hamburger

### 3. Create `Sidebar.tsx` (`src/components/layout/Sidebar.tsx`)
- **Background:** navy `#1a1a2e`
- **Top:** Navis Marine logo (from URL: `https://navis-marine.com/wp-content/uploads/2024/07/Navis-Marine-Logo.svg`)
- **Nav items** (with Lucide icons):
  - Dashboard (`LayoutDashboard`)
  - Boats (`Ship`)
  - Configurator (`Sliders`)
  - Clients (`Users`)
  - Quotes (`FileText`)
  - Settings (`Settings`) — admin only (hide for 'sales' role, for now always show)
- **Bottom:** User avatar (placeholder circle) + name + role
- **Active state:** Primary blue background (`bg-primary/20`) + white text + left border accent
- **Hover state:** Subtle lighter navy background

### 4. Create `Header.tsx` (`src/components/layout/Header.tsx`)
- **Left:** Hamburger button (mobile only, below `md` breakpoint) + Breadcrumb
- **Breadcrumb:** Auto-generated from current route path (e.g., "Boats > Grande 120")
- **Right:** Search input (desktop only) + User dropdown (avatar + name, with Logout option)

### 5. Mobile sidebar behavior
- Below `md` breakpoint: sidebar is hidden off-screen
- Hamburger button in header toggles sidebar visibility
- Sidebar slides in from left with `animate-slide-in`
- Dark backdrop overlay (click to close)
- Clicking a nav item also closes sidebar
- Body scroll locked when sidebar open

### 6. Placeholder page components
Create actual page files in `src/pages/` (each just renders the page title for now):
- `src/pages/auth/LoginPage.tsx`
- `src/pages/dashboard/DashboardPage.tsx`
- `src/pages/boats/BoatsListPage.tsx`
- `src/pages/boats/BoatDetailPage.tsx`
- `src/pages/boats/BoatCreatePage.tsx`
- `src/pages/boats/BoatEquipmentPage.tsx`
- `src/pages/configurator/ConfiguratorPage.tsx`
- `src/pages/clients/ClientsListPage.tsx`
- `src/pages/clients/ClientDetailPage.tsx`
- `src/pages/quotes/QuotesListPage.tsx`
- `src/pages/quotes/QuoteDetailPage.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/settings/UsersPage.tsx`

Each placeholder:
```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-semibold text-navy">Dashboard</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  )
}
```

### 7. Create `AuthGuard.tsx` (placeholder)
`src/components/layout/AuthGuard.tsx` — for now, just renders children. Will add auth check in Session 3.

## Verification Checklist
- [ ] All routes navigate correctly via sidebar links
- [ ] Sidebar collapses on mobile (< 768px)
- [ ] Hamburger button shows/hides mobile sidebar
- [ ] Click outside mobile sidebar closes it
- [ ] Breadcrumb updates per route
- [ ] Active nav item highlighted with primary blue
- [ ] Desktop: sidebar fixed, content scrolls independently
- [ ] Navis logo loads in sidebar top
- [ ] `npm run build` still succeeds

## Files Created/Modified
- `src/router.tsx` — full nested routing with layout
- `src/components/layout/DashboardLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/AuthGuard.tsx` (placeholder)
- `src/pages/auth/LoginPage.tsx`
- `src/pages/dashboard/DashboardPage.tsx`
- `src/pages/boats/BoatsListPage.tsx`
- `src/pages/boats/BoatDetailPage.tsx`
- `src/pages/boats/BoatCreatePage.tsx`
- `src/pages/boats/BoatEquipmentPage.tsx`
- `src/pages/configurator/ConfiguratorPage.tsx`
- `src/pages/clients/ClientsListPage.tsx`
- `src/pages/clients/ClientDetailPage.tsx`
- `src/pages/quotes/QuotesListPage.tsx`
- `src/pages/quotes/QuoteDetailPage.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/pages/settings/UsersPage.tsx`
