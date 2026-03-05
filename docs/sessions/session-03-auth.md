# Session 3: Authentication

## Prerequisites
- Session 2 complete (layout with sidebar, header, routing)

## Goal
Working login/logout with role-based access. Admin sees all nav items, Sales cannot access Settings.

## Detailed Steps

### 1. Create `useAuth.ts` hook (`src/hooks/useAuth.ts`)
```typescript
export function useAuth() {
  // Uses React Query to cache user profile
  // Returns: { user, isLoading, isAdmin, login, logout }
}
```
- `login(email, password)` → `supabase.auth.signInWithPassword()`
- `logout()` → `supabase.auth.signOut()`, redirect to `/auth/login`
- `user` → current Profile (from `profiles` table, fetched after auth)
- `isAdmin` → `user?.role === 'admin'`
- On mount: check `supabase.auth.getSession()`
- Subscribe to `supabase.auth.onAuthStateChange()` for session changes

### 2. Create `LoginPage.tsx` (`src/pages/auth/LoginPage.tsx`)
- **Layout:** Full-screen, centered card over blurred yacht background image
- **Background:** Use a yacht image URL with blur + dark overlay
- **Card:** White/semi-transparent, centered
  - Navis Marine logo (top, centered)
  - "Welcome Back" heading (Playfair Display)
  - "Sign in to Navis Marine Configurator" subtitle
  - Email input (react-hook-form + zod loginSchema)
  - Password input (with show/hide toggle)
  - "Remember me" checkbox
  - "Log In" button (primary blue, full width)
  - Error message display (red text below button)
- **Form:** Use `react-hook-form` with `zodResolver(loginSchema)` from `lib/validators.ts`
- **On submit:** Call `useAuth().login()`, on success redirect to `/dashboard`

### 3. Update `AuthGuard.tsx` (`src/components/layout/AuthGuard.tsx`)
```typescript
export function AuthGuard({ children, requiredRole }: { children: ReactNode; requiredRole?: UserRole }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/auth/login" replace />
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
```

### 4. Setup Supabase Auth trigger (SQL in Supabase dashboard)
```sql
-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Create test users in Supabase Auth dashboard
- `admin@navis-marine.com` / password: `admin123!` → role: admin
- `sales@navis-marine.com` / password: `sales123!` → role: sales

After creating via Supabase Auth, update profiles:
```sql
UPDATE profiles SET role = 'admin', full_name = 'Admin User' WHERE email = 'admin@navis-marine.com';
UPDATE profiles SET role = 'sales', full_name = 'Sales Agent' WHERE email = 'sales@navis-marine.com';
```

### 6. Role-based UI updates
- **Sidebar:** Settings nav item hidden when `user.role === 'sales'`
- **Router:** Settings and Users routes wrapped with `<AuthGuard requiredRole="admin">`
- **Header:** Show user name + role badge in dropdown

### 7. Integrate auth into DashboardLayout
- Wrap all protected routes with `<AuthGuard>`
- Pass user to Sidebar and Header via context or props

## Verification Checklist
- [ ] Login with admin → sees all nav items including Settings
- [ ] Login with sales → Settings nav item hidden
- [ ] Sales user navigating to `/settings` directly → redirected to dashboard
- [ ] Logout → redirected to login page
- [ ] Direct URL access while logged out → redirected to login
- [ ] Page refresh maintains session (no re-login needed)
- [ ] Invalid credentials → error message shown
- [ ] Loading spinner shown while checking auth state
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/hooks/useAuth.ts`
- `src/pages/auth/LoginPage.tsx` — full login UI
- `src/components/layout/AuthGuard.tsx` — auth + role guard
- `src/components/layout/Sidebar.tsx` — role-based nav items
- `src/components/layout/Header.tsx` — user info in dropdown
- `src/components/layout/DashboardLayout.tsx` — auth wrapper
- `src/router.tsx` — auth guards on routes
