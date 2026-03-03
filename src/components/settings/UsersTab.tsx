import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Users, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useUsers, useInviteUser, useUpdateUser, useToggleUserActive } from '@/hooks/useUsers'
import { inviteUserSchema, updateUserSchema } from '@/lib/validators'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import type { Profile, UserRole } from '@/types'
import type { InviteUserFormData, UpdateUserFormData } from '@/lib/validators'

export function UsersTab() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { data: users, isLoading } = useUsers()

  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<Profile | null>(null)

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('common.today') ?? 'Today'
    if (diffDays === 1) return t('common.yesterday') ?? 'Yesterday'
    if (diffDays < 7) return `${diffDays}d`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
    return `${Math.floor(diffDays / 30)}m`
  }

  if (isLoading) return <TableSkeleton />

  return (
    <div className="space-y-3">
      {/* Invite button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowInviteDialog(true)}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
        >
          <Plus className="h-4 w-4" />
          {t('users.inviteUser')}
        </button>
      </div>

      {/* Content */}
      {!users || users.length === 0 ? (
        <div className={ds.empty.container}>
          <div className="mb-4 rounded-full bg-muted p-4">
            <Users className={ds.empty.icon} />
          </div>
          <p className={ds.empty.title}>{t('users.noUsers')}</p>
        </div>
      ) : (
        <div className={cn(ds.table.wrapper, ds.card.base)}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/50">
                <th className={cn(ds.table.headerCell, 'text-left')}>
                  {t('users.fullName')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left sm:table-cell')}>
                  {t('users.email')}
                </th>
                <th className={cn(ds.table.headerCell, 'text-left')}>
                  {t('users.role')}
                </th>
                <th className={cn(ds.table.headerCell, 'text-left')}>
                  {t('users.status')}
                </th>
                <th className={cn(ds.table.headerCell, 'hidden text-left md:table-cell')}>
                  {t('users.lastActivity')}
                </th>
                <th className={cn(ds.table.headerCell, 'text-right')}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((profile) => {
                const isSelf = profile.id === currentUser?.id
                return (
                  <tr key={profile.id} className={ds.table.row}>
                    <td className={ds.table.cell}>
                      <span className="font-medium text-navy">
                        {profile.full_name ?? '—'}
                      </span>
                      {isSelf && (
                        <span className="ml-1 text-[10px] text-muted-foreground">(you)</span>
                      )}
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground sm:hidden">
                        {profile.email}
                      </span>
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-muted-foreground sm:table-cell')}>
                      {profile.email}
                    </td>
                    <td className={ds.table.cell}>
                      <RoleBadge role={profile.role as UserRole} />
                    </td>
                    <td className={ds.table.cell}>
                      <div className="flex items-center gap-2">
                        <ActiveToggle
                          profile={profile}
                          isSelf={isSelf}
                          onDeactivate={() => setDeactivatingUser(profile)}
                        />
                        <span className="text-[10px] text-muted-foreground sm:hidden">
                          {profile.is_active ? t('common.active') ?? 'Active' : t('common.inactive') ?? 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className={cn(ds.table.cell, 'hidden text-muted-foreground md:table-cell')}>
                      {profile.updated_at ? formatRelativeTime(profile.updated_at) : '—'}
                    </td>
                    <td className={ds.table.cell}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingUser(profile)}
                          className={cn(ds.btn.base, ds.btn.icon)}
                          title={t('users.editUser')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <InviteDialog onClose={() => setShowInviteDialog(false)} />
      )}

      {/* Edit Dialog */}
      {editingUser && (
        <EditDialog
          profile={editingUser}
          isSelf={editingUser.id === currentUser?.id}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Deactivate Confirm */}
      <ConfirmDialog
        isOpen={!!deactivatingUser}
        title={t('users.status')}
        description={t('users.confirmDeactivate')}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        isDangerous
        onConfirm={async () => {
          if (!deactivatingUser) return
          const { error } = await supabase
            .from('profiles')
            .update({ is_active: false })
            .eq('id', deactivatingUser.id)
          if (error) {
            toast.error(t('users.updateError'))
          } else {
            toast.success(t('users.deactivateSuccess'))
            queryClient.invalidateQueries({ queryKey: ['users'] })
          }
          setDeactivatingUser(null)
        }}
        onCancel={() => setDeactivatingUser(null)}
      />
    </div>
  )
}

// --- Sub-components ---

function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        ds.badge.base,
        role === 'admin'
          ? 'bg-navy/10 text-navy'
          : ds.badge.primary
      )}
    >
      {t(`users.${role}`)}
    </span>
  )
}

function ActiveToggle({
  profile,
  isSelf,
  onDeactivate,
}: {
  profile: Profile
  isSelf: boolean
  onDeactivate: () => void
}) {
  const { t } = useTranslation()
  const toggleActive = useToggleUserActive(profile.id)

  const handleToggle = () => {
    if (isSelf) {
      toast.error(t('users.cannotDeactivateSelf'))
      return
    }

    if (profile.is_active) {
      onDeactivate()
    } else {
      toggleActive.mutate(true, {
        onSuccess: () => toast.success(t('users.activateSuccess')),
        onError: () => toast.error(t('users.updateError')),
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={toggleActive.isPending}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
      style={{ backgroundColor: profile.is_active ? '#10b981' : '#d1d5db' }}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white transition-transform',
          profile.is_active ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const inviteUser = useInviteUser()
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { role: 'sales' },
  })

  const onSubmit = (data: InviteUserFormData) => {
    inviteUser.mutate(data, {
      onSuccess: (result) => {
        setTempPassword(result.temporary_password)
        toast.success(t('users.inviteSuccess'))
      },
      onError: () => {
        toast.error(t('users.inviteError'))
      },
    })
  }

  const handleCopyPassword = async () => {
    if (!tempPassword) return
    await navigator.clipboard.writeText(tempPassword)
    setCopied(true)
    toast.success(t('users.passwordCopied'))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => { if (!open) onClose() }}
      title={t('users.inviteUser')}
      size="sm"
    >
      {tempPassword ? (
        <div className="space-y-4">
          <div>
            <label className={ds.input.label}>
              {t('users.temporaryPassword')}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                {tempPassword}
              </code>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="rounded-lg border border-border p-2 transition-colors hover:bg-muted"
                title={t('users.copyPassword')}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {t('users.passwordNote')}
            </p>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className={cn(ds.btn.base, ds.btn.sm, 'bg-navy text-white hover:bg-navy-light')}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className={ds.input.group}>
            <label className={ds.input.label}>{t('users.email')}</label>
            <input type="email" {...register('email')} className={ds.input.base} />
            {errors.email && <p className={ds.input.error}>{errors.email.message}</p>}
          </div>
          <div className={ds.input.group}>
            <label className={ds.input.label}>{t('users.fullName')}</label>
            <input type="text" {...register('full_name')} className={ds.input.base} />
            {errors.full_name && <p className={ds.input.error}>{errors.full_name.message}</p>}
          </div>
          <div className={ds.input.group}>
            <label className={ds.input.label}>{t('users.role')}</label>
            <select {...register('role')} className={ds.input.select}>
              <option value="sales">{t('users.sales')}</option>
              <option value="admin">{t('users.admin')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button type="button" onClick={onClose} className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary)}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={inviteUser.isPending}
              className={cn(ds.btn.base, ds.btn.sm, 'bg-navy text-white hover:bg-navy-light disabled:opacity-50')}
            >
              {inviteUser.isPending ? '...' : t('users.inviteUser')}
            </button>
          </div>
        </form>
      )}
    </ResponsiveModal>
  )
}

function EditDialog({
  profile,
  isSelf,
  onClose,
}: {
  profile: Profile
  isSelf: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const updateUser = useUpdateUser(profile.id)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: profile.full_name ?? '',
      role: profile.role as 'admin' | 'sales',
    },
  })

  const onSubmit = (data: UpdateUserFormData) => {
    if (isSelf && data.role !== profile.role) {
      toast.error(t('users.cannotChangeOwnRole'))
      return
    }

    updateUser.mutate(data, {
      onSuccess: () => {
        toast.success(t('users.updateSuccess'))
        onClose()
      },
      onError: () => {
        toast.error(t('users.updateError'))
      },
    })
  }

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => { if (!open) onClose() }}
      title={t('users.editUser')}
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className={cn(ds.input.label, 'text-muted-foreground')}>{t('users.email')}</label>
          <p className="text-xs text-foreground">{profile.email}</p>
        </div>
        <div className={ds.input.group}>
          <label className={ds.input.label}>{t('users.fullName')}</label>
          <input type="text" {...register('full_name')} className={ds.input.base} />
          {errors.full_name && <p className={ds.input.error}>{errors.full_name.message}</p>}
        </div>
        <div className={ds.input.group}>
          <label className={ds.input.label}>{t('users.role')}</label>
          <select {...register('role')} disabled={isSelf} className={cn(ds.input.select, 'disabled:opacity-50')}>
            <option value="sales">{t('users.sales')}</option>
            <option value="admin">{t('users.admin')}</option>
          </select>
          {isSelf && (
            <p className="text-[11px] text-muted-foreground">{t('users.cannotChangeOwnRole')}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <button type="button" onClick={onClose} className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary)}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={updateUser.isPending}
            className={cn(ds.btn.base, ds.btn.sm, 'bg-navy text-white hover:bg-navy-light disabled:opacity-50')}
          >
            {updateUser.isPending ? '...' : t('common.save')}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  )
}

function TableSkeleton() {
  return (
    <div className={cn('overflow-hidden', ds.card.base)}>
      <div className="border-b border-border/60 bg-muted/50 px-3 py-2">
        <div className={cn(ds.skeleton.line, 'w-48')} />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 border-b border-border/30 px-3 py-2 last:border-0"
        >
          <div className="space-y-1">
            <div className={cn(ds.skeleton.line, 'w-32')} />
            <div className={cn(ds.skeleton.line, 'h-3 w-24 sm:hidden')} />
          </div>
          <div className={cn(ds.skeleton.line, 'hidden w-40 sm:block')} />
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-11 animate-pulse rounded-full bg-muted" />
          <div className={cn(ds.skeleton.line, 'ml-auto w-8')} />
        </div>
      ))}
    </div>
  )
}
