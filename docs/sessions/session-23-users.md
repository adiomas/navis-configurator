# Session 23: User Management

## Prerequisites
- Session 22 complete (settings page working)

## Goal
Admin user management with invite, role change, activate/deactivate, and comprehensive role enforcement throughout the app.

## Detailed Steps

### 1. Create `UsersPage.tsx` (`src/pages/settings/UsersPage.tsx`)
Admin only page (route guarded):
- **User table:**
  - Name (full_name)
  - Email
  - Role badge (Admin = navy, Sales = blue)
  - Status (Active = green, Inactive = gray)
  - Last login (from auth.users if available, or updated_at)
  - Actions
- **"Invite User" button** (top right)
- **Sort:** By name, email, role

### 2. Invite user flow
- Click "Invite User" → opens dialog modal
- **Form fields:**
  - Email (required)
  - Full Name (required)
  - Role (select: Admin / Sales)
- **On submit:**
  - Option A: Use Supabase `supabase.auth.admin.createUser()` (requires service role key — not ideal for client-side)
  - Option B: Use Supabase invitation: `supabase.auth.admin.inviteUserByEmail()` (sends invitation email)
  - Option C: Create user with temporary password, show it in dialog (user must change on first login)
  - **Recommended:** Use Supabase invite email (Option B) if Supabase email is configured, otherwise Option C with displayed temporary password
- Create profile record with role
- Toast: "Invitation sent to {email}"

### 3. Edit user
- Click edit icon → dialog modal
- **Editable fields:**
  - Full Name
  - Role (Admin ↔ Sales) — cannot change own role
- **Save:** Update profiles table
- Toast: "User updated"

### 4. Activate/Deactivate user
- Toggle switch or button per user
- **Deactivate:**
  - Set `is_active = false` in profiles
  - On next login attempt: AuthGuard checks `is_active`, shows "Account deactivated" message
  - Alternatively: disable the Supabase Auth user
- **Reactivate:**
  - Set `is_active = true`
  - Re-enable auth user if needed
- Cannot deactivate yourself
- Toast: "User deactivated" / "User reactivated"

### 5. Comprehensive role enforcement audit
Go through every page and component to enforce roles:

**Sidebar (`Sidebar.tsx`):**
- Settings visible only for admin

**Boats:**
- "Add Boat" button: admin only
- Edit/Delete buttons on detail: admin only
- "Manage Equipment" link: admin only
- Sales users see read-only boat catalog

**Equipment:**
- BoatEquipmentPage: admin can CRUD, sales sees read-only
- Add/Edit/Delete category buttons: admin only
- Add/Edit/Delete item buttons: admin only

**Configurator:**
- All users can create quotes (both admin and sales)

**Quotes:**
- All users can view all quotes
- Edit/Copy: creator or admin
- Delete: admin only (if implemented)
- Status change: creator or admin

**Clients:**
- All users can view
- Create: all users
- Edit/Delete: creator or admin

**Template Groups:**
- Admin only (create, edit, delete)

**Settings:**
- Admin only (entire section)

**Users:**
- Admin only (entire page)

### 6. "Created by" display
- Quotes list: show "Created by" column with user name
- Quote detail: show creator name
- Client detail: show who added the client

### 7. Hooks
```typescript
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')
      return data
    }
  })
}
export function useInviteUser() { ... }
export function useUpdateUser() { ... }
export function useToggleUserActive() { ... }
```

## Verification Checklist
- [ ] Users page shows all users with correct roles and status
- [ ] Admin creates new user → user can login
- [ ] Change role: Admin → Sales → admin-only features hidden for that user
- [ ] Deactivate user → cannot login (shows "Account deactivated")
- [ ] Reactivate → can login again
- [ ] Cannot deactivate yourself
- [ ] Sales user: no Settings in sidebar
- [ ] Sales user: no Edit/Delete on boats
- [ ] Sales user: no equipment management
- [ ] Sales user: can create quotes, view all quotes
- [ ] Quote shows "Created by: {name}" everywhere
- [ ] `npm run build` succeeds

## Files Created/Modified
- `src/pages/settings/UsersPage.tsx` — full implementation
- `src/hooks/useUsers.ts` — new
- `src/components/layout/Sidebar.tsx` — verify role checks
- `src/components/layout/AuthGuard.tsx` — check is_active
- Multiple pages: verify admin-only buttons/actions are hidden for sales
