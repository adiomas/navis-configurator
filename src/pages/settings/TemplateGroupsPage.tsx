import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Pencil, Trash2, Calendar, Ship, Zap, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatDate } from '@/lib/formatters'
import {
  useTemplateGroups,
  useCreateTemplateGroup,
  useUpdateTemplateGroup,
  useDeleteTemplateGroup,
} from '@/hooks/useTemplateGroups'
import { TemplateGroupForm, type TemplateGroupFormResult } from '@/components/settings/TemplateGroupForm'
import { useTemplateGroupQuoteCounts } from '@/hooks/useQuotes'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { QuickQuoteModal } from '@/components/templates/QuickQuoteModal'
import type { QuoteTemplateGroup } from '@/types'

export default function TemplateGroupsPage() {
  const { t } = useTranslation()
  const { data: groups, isLoading } = useTemplateGroups()
  const { data: quoteCounts } = useTemplateGroupQuoteCounts()
  const deleteMutation = useDeleteTemplateGroup()

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<QuoteTemplateGroup | null>(null)
  const [quickQuoteGroupId, setQuickQuoteGroupId] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingId(undefined)
    setFormOpen(true)
  }

  const handleEdit = (group: QuoteTemplateGroup) => {
    setEditingId(group.id)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditingId(undefined)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const getStatusBadge = (group: QuoteTemplateGroup) => {
    if (!group.is_active) {
      return (
        <span className={cn(ds.badge.base, ds.badge.muted)}>
          {t('common.inactive')}
        </span>
      )
    }

    const today = new Date().toISOString().split('T')[0]
    const isExpired = group.valid_until && group.valid_until < today
    const isNotStarted = group.valid_from && group.valid_from > today

    if (isExpired) {
      return (
        <span className={cn(ds.badge.base, ds.badge.danger)}>
          {t('templateGroups.templateExpired')}
        </span>
      )
    }
    if (isNotStarted) {
      return (
        <span className={cn(ds.badge.base, ds.badge.warning)}>
          {formatDate(group.valid_from!)}
        </span>
      )
    }
    return (
      <span className={cn(ds.badge.base, ds.badge.success)}>
        {t('templateGroups.templateActive')}
      </span>
    )
  }

  const formatDateRange = (from: string | null, until: string | null) => {
    if (!from || !until) return '—'
    return `${formatDate(from)} → ${formatDate(until)}`
  }

  return (
    <div className={ds.page.spacing}>
      {/* Header */}
      <div className={ds.page.header}>
        <h1 className={ds.page.title}>
          {t('templateGroups.title')}
        </h1>
        <button
          type="button"
          onClick={handleCreate}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
        >
          <Plus className="h-4 w-4" />
          {t('templateGroups.addGroup')}
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn(ds.skeleton.base, 'h-16')} />
          ))}
        </div>
      ) : !groups?.length ? (
        <EmptyState message={t('templateGroups.noGroups')} onAdd={handleCreate} addLabel={t('templateGroups.addGroup')} />
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const boatCount = (group as unknown as { boats: unknown[] }).boats?.length ?? 0
            const gc = quoteCounts?.[group.id]

            return (
              <div
                key={group.id}
                className={cn(ds.card.base, 'px-4 py-3 transition-colors hover:bg-muted/30')}
              >
                {/* Row 1: Name + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{group.name}</h3>
                    {getStatusBadge(group)}
                  </div>
                  <div className="hidden items-center gap-1 sm:flex">
                    <button
                      type="button"
                      onClick={() => setQuickQuoteGroupId(group.id)}
                      className="flex h-8 items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      {t('templateGroups.quickQuote')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(group)}
                      className={cn(ds.btn.base, ds.btn.icon)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(group)}
                      className={cn(ds.btn.base, ds.btn.icon, 'hover:bg-red-50 hover:text-red-600')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Date range | Boat count | Quotes link */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateRange(group.valid_from, group.valid_until)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Ship className="h-3 w-3" />
                    {boatCount} {t('templateGroups.boats').toLowerCase()}
                  </span>
                  {gc && gc.total > 0 && (
                    <Link
                      to={`/quotes?template=${group.id}`}
                      className="flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary-dark"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileText className="h-3 w-3" />
                      {gc.total} {t('nav.quotes').toLowerCase()}
                      {gc.accepted > 0 && (
                        <span className="text-success">&middot; {gc.accepted} ✓</span>
                      )}
                    </Link>
                  )}
                </div>

                {/* Row 3: Mobile-only actions */}
                <div className="mt-2 flex items-center gap-1.5 sm:hidden">
                  <button
                    type="button"
                    onClick={() => setQuickQuoteGroupId(group.id)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {t('templateGroups.quickQuote')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(group)}
                    className={cn(ds.btn.base, 'h-10 rounded-lg px-3 text-xs', ds.btn.secondary)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(group)}
                    className={cn(ds.btn.base, 'h-10 rounded-lg px-3 text-xs text-red-600 hover:bg-red-50')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <TemplateGroupFormWrapper
          groupId={editingId}
          onClose={handleCloseForm}
        />
      )}

      {/* Quick Quote modal */}
      {quickQuoteGroupId && (
        <QuickQuoteModal
          open={!!quickQuoteGroupId}
          onOpenChange={(open) => { if (!open) setQuickQuoteGroupId(null) }}
          templateGroupId={quickQuoteGroupId}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={t('templateGroups.confirmDeleteTitle')}
        description={t('templateGroups.confirmDelete', { name: deleteTarget?.name ?? '' })}
        confirmText={t('common.delete')}
        isDangerous
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function TemplateGroupFormWrapper({
  groupId,
  onClose,
}: {
  groupId?: string
  onClose: () => void
}) {
  const createMutation = useCreateTemplateGroup()
  const updateMutation = useUpdateTemplateGroup(groupId ?? '')

  const mutation = groupId ? updateMutation : createMutation
  const isLoading = mutation.isPending

  const handleSave = (data: TemplateGroupFormResult) => {
    mutation.mutate(data, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  return (
    <TemplateGroupForm
      groupId={groupId}
      isLoading={isLoading}
      onSave={handleSave}
      onClose={onClose}
    />
  )
}

function EmptyState({ message, onAdd, addLabel }: { message: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10">
      <Calendar className={ds.empty.icon} />
      <p className={cn(ds.empty.title, 'mb-4')}>{message}</p>
      <button
        type="button"
        onClick={onAdd}
        className={cn(ds.btn.base, ds.btn.md, ds.btn.primary)}
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  )
}
