import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { X, Pencil, Trash2, Camera, Plus, Check, Copy, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { formatPrice } from '@/lib/formatters'
import {
  useBoats,
  useBoat,
  useBoatEquipment,
  useUpdateBoat,
  useDeleteBoat,
  useUploadBoatImage,
  useCreateBoat,
  useCreateBoatSpec,
  useUpdateBoatSpec,
  useDeleteBoatSpec,
  useCopySpecs,
} from '@/hooks/useBoats'
import { useAuth } from '@/hooks/useAuth'
import { BoatForm } from '@/components/boats/BoatForm'
import { BoatEquipmentTab } from '@/components/boats/BoatEquipmentTab'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { BoatSpec } from '@/types'
import type { BoatFormData } from '@/lib/validators'

type Tab = 'info' | 'specs' | 'equipment'

interface BoatDetailPanelProps {
  boatId: string | null
  mode: 'view' | 'edit' | 'create'
  onClose: () => void
  onModeChange: (mode: 'view' | 'edit' | 'create') => void
  onBoatCreated: (id: string) => void
}

export const BoatDetailPanel = ({
  boatId,
  mode,
  onClose,
  onModeChange,
  onBoatCreated,
}: BoatDetailPanelProps) => {
  const { t, i18n } = useTranslation()
  const { isAdmin } = useAuth()
  const lang = i18n.language as 'hr' | 'en'

  const effectiveId = mode !== 'create' ? (boatId ?? undefined) : undefined
  const { data: boat, isLoading } = useBoat(effectiveId)
  const { data: boatEquipment } = useBoatEquipment(effectiveId)
  const updateBoat = useUpdateBoat(boatId ?? '')
  const deleteBoat = useDeleteBoat(boatId ?? '')
  const uploadImage = useUploadBoatImage(boatId ?? '')
  const createBoat = useCreateBoat()
  const heroFileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleUpdate = (data: BoatFormData) => {
    updateBoat.mutate(data, {
      onSuccess: () => {
        toast.success(t('boats.updateSuccess'))
        onModeChange('view')
      },
      onError: () => toast.error(t('boats.updateError')),
    })
  }

  const handleCreate = (data: BoatFormData) => {
    createBoat.mutate(data, {
      onSuccess: (newBoat) => {
        toast.success(t('boats.createSuccess'))
        onBoatCreated(newBoat.id)
      },
      onError: () => toast.error(t('boats.createError')),
    })
  }

  const handleDelete = () => {
    deleteBoat.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('boats.deleteSuccess'))
        onClose()
      },
      onError: () => toast.error(t('boats.deleteError')),
    })
  }

  const handleHeroUpload = (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB')
      return
    }
    uploadImage.mutate(file, {
      onSuccess: () => toast.success(t('boats.uploadSuccess')),
      onError: () => toast.error(t('boats.uploadError')),
    })
  }

  // Create mode
  if (mode === 'create') {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader title={t('boats.addBoat')} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-4">
          <BoatForm
            onSubmit={handleCreate}
            isLoading={createBoat.isPending}
            submitLabel={t('common.create')}
            onCancel={onClose}
          />
        </div>
      </div>
    )
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader title="" onClose={onClose} />
        <PanelSkeleton />
      </div>
    )
  }

  // Not found
  if (!boat) {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader title="" onClose={onClose} />
        <div className={cn(ds.empty.container, 'flex-1')}>
          <p className={ds.empty.title}>Boat not found</p>
        </div>
      </div>
    )
  }

  // Edit mode
  if (mode === 'edit') {
    return (
      <div className="flex h-full flex-col">
        <PanelHeader title={t('boats.editBoat')} onClose={() => onModeChange('view')} />
        <div className="flex-1 overflow-y-auto p-4">
          <BoatForm
            defaultValues={{
              name: boat.name,
              brand: boat.brand ?? 'Azimut',
              model: boat.model ?? undefined,
              year: boat.year ?? undefined,
              category: (boat.category as 'new' | 'used') ?? 'new',
              base_price: boat.base_price,
              description_hr: boat.description_hr ?? undefined,
              description_en: boat.description_en ?? undefined,
            }}
            onSubmit={handleUpdate}
            isLoading={updateBoat.isPending}
            submitLabel={t('common.save')}
            onCancel={() => onModeChange('view')}
          />
        </div>
      </div>
    )
  }

  // View mode
  const tabs: { value: Tab; label: string }[] = [
    { value: 'info', label: 'Info' },
    { value: 'specs', label: t('boats.specifications') },
    { value: 'equipment', label: t('boats.equipment') },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="truncate text-base font-semibold text-navy">{boat.name}</h2>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => onModeChange('edit')}
                className={cn(ds.btn.base, ds.btn.icon, 'p-1.5')}
                title={t('common.edit')}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className={cn(ds.btn.base, ds.btn.icon, 'p-1.5 hover:bg-red-50 hover:text-red-600')}
                title={t('common.delete')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className={cn(ds.btn.base, ds.btn.icon, 'p-1.5')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero image */}
        <div className="group relative">
          {boat.hero_image_url ? (
            <img
              src={boat.hero_image_url}
              alt={boat.name}
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center bg-muted">
              <span className="text-sm text-muted-foreground">No image</span>
            </div>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                title={t('boats.uploadImage')}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={heroFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleHeroUpload(e.target.files)}
              />
            </>
          )}
        </div>

        {/* Info summary */}
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{boat.brand}</span>
            <span>&middot;</span>
            <span>{boat.year}</span>
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-semibold uppercase',
                boat.category === 'new'
                  ? 'bg-success/10 text-success'
                  : 'bg-warning/10 text-warning'
              )}
            >
              {t(`boats.${boat.category}`)}
            </span>
          </div>
          <p className="mt-1 font-display text-xl font-semibold text-gold">
            {formatPrice(boat.base_price)}
          </p>
        </div>

        {/* Tab navigation */}
        <div className="border-b border-border px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'relative px-3 py-2 text-xs font-medium transition-colors',
                  activeTab === tab.value
                    ? 'text-navy'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {activeTab === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4">
          {activeTab === 'info' && (
            <InfoTab boat={boat} lang={lang} />
          )}
          {activeTab === 'specs' && (
            <SpecificationsTab
              specs={boat.specs}
              lang={lang}
              boatId={boat.id}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === 'equipment' && (
            <BoatEquipmentTab boatId={boat.id} equipmentCategories={boatEquipment ?? []} isAdmin={isAdmin} />
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title={t('boats.deleteTitle')}
        description={t('boats.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteBoat.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

// --- Sub-components ---

function PanelHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <h2 className="truncate text-base font-semibold text-navy">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className={cn(ds.btn.base, ds.btn.icon, 'p-1.5')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function InfoTab({ boat, lang }: { boat: { description_hr: string | null; description_en: string | null; model: string | null }; lang: 'hr' | 'en' }) {
  const { t } = useTranslation()
  const description = lang === 'hr' ? boat.description_hr : boat.description_en

  return (
    <div className="space-y-4">
      {boat.model && (
        <div>
          <p className={ds.text.label}>{t('boats.model')}</p>
          <p className="text-sm text-foreground">{boat.model}</p>
        </div>
      )}
      {description && (
        <div>
          <p className={ds.text.label}>{t('boats.description')}</p>
          <p className="text-sm leading-relaxed text-foreground">{description}</p>
        </div>
      )}
      {!boat.model && !description && (
        <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
      )}
    </div>
  )
}

function SpecificationsTab({
  specs,
  lang,
  boatId,
  isAdmin,
}: {
  specs: BoatSpec[]
  lang: 'hr' | 'en'
  boatId: string
  isAdmin: boolean
}) {
  const { t } = useTranslation()
  const [editingSpec, setEditingSpec] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ label_hr: '', label_en: '', value: '' })
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null)
  const [newSpec, setNewSpec] = useState({ label_hr: '', label_en: '', value: '' })
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showDeleteSpec, setShowDeleteSpec] = useState<string | null>(null)

  const [showCopyConfirm, setShowCopyConfirm] = useState(false)
  const [copySourceBoatId, setCopySourceBoatId] = useState<string | null>(null)

  const copySpecs = useCopySpecs(boatId)
  const { data: allBoats } = useBoats()
  const { data: sourceBoat } = useBoat(copySourceBoatId ?? undefined)

  const otherBoats = useMemo(
    () => (allBoats ?? []).filter((b) => b.id !== boatId),
    [allBoats, boatId]
  )

  const createSpec = useCreateBoatSpec(boatId)
  const updateSpec = useUpdateBoatSpec(boatId)
  const deleteSpec = useDeleteBoatSpec(boatId)

  const groups = specs.reduce<Record<string, BoatSpec[]>>((acc, spec) => {
    const cat = spec.category ?? 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(spec)
    return acc
  }, {})

  const startEdit = (spec: BoatSpec) => {
    setEditingSpec(spec.id)
    setEditValues({
      label_hr: spec.label_hr ?? '',
      label_en: spec.label_en ?? '',
      value: spec.value ?? '',
    })
  }

  const saveEdit = (specId: string) => {
    updateSpec.mutate(
      { specId, data: editValues },
      { onSuccess: () => setEditingSpec(null) }
    )
  }

  const handleAddSpec = (category: string) => {
    const maxOrder = Math.max(0, ...specs.filter((s) => s.category === category).map((s) => s.sort_order))
    createSpec.mutate(
      { ...newSpec, category, sort_order: maxOrder + 1 },
      {
        onSuccess: () => {
          setAddingToCategory(null)
          setNewSpec({ label_hr: '', label_en: '', value: '' })
        },
      }
    )
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return
    createSpec.mutate(
      {
        label_hr: 'New spec',
        label_en: 'New spec',
        value: '-',
        category: newCategoryName.trim(),
        sort_order: 0,
      },
      {
        onSuccess: () => {
          setAddingCategory(false)
          setNewCategoryName('')
        },
      }
    )
  }

  const handleDeleteSpec = () => {
    if (!showDeleteSpec) return
    deleteSpec.mutate(showDeleteSpec, {
      onSuccess: () => setShowDeleteSpec(null),
    })
  }

  const handleCopySelect = (sourceId: string) => {
    setCopySourceBoatId(sourceId)
    setShowCopyConfirm(true)
  }

  const handleCopyConfirm = () => {
    if (!copySourceBoatId) return
    copySpecs.mutate(copySourceBoatId, {
      onSuccess: (result) => {
        toast.success(t('boats.copySpecsSuccess', { count: result.specs }))
        setCopySourceBoatId(null)
        setShowCopyConfirm(false)
      },
      onError: () => toast.error(t('common.error')),
    })
  }

  return (
    <div className="space-y-6">
      {isAdmin && otherBoats.length > 0 && (
        <div className="relative mb-4">
          <select
            onChange={(e) => {
              if (e.target.value) handleCopySelect(e.target.value)
              e.target.value = ''
            }}
            defaultValue=""
            className="h-8 w-full appearance-none rounded-md border border-border bg-white px-2 pr-7 text-xs font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
          >
            <option value="" disabled>{t('boats.copySpecsFrom')}</option>
            {otherBoats.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <Copy className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}

      {Object.entries(groups).map(([category, items]) => (
        <div key={category}>
          <h3 className={cn(ds.card.title, 'mb-3')}>{category}</h3>
          <div className="space-y-1">
            {items
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((spec) =>
                editingSpec === spec.id ? (
                  <div key={spec.id} className="flex items-center gap-2 py-1">
                    <input
                      value={lang === 'hr' ? editValues.label_hr : editValues.label_en}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [lang === 'hr' ? 'label_hr' : 'label_en']: e.target.value,
                        }))
                      }
                      className="flex-1 rounded border border-border px-2 py-1 text-xs"
                    />
                    <input
                      value={editValues.value}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, value: e.target.value }))
                      }
                      className="w-24 rounded border border-border px-2 py-1 text-xs"
                    />
                    <button type="button" onClick={() => saveEdit(spec.id)} className="text-green-600 hover:text-green-700">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingSpec(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={spec.id}
                    className={cn(
                      'group flex items-center justify-between border-b border-border/50 py-1.5',
                      spec.show_in_pdf === false && 'opacity-50',
                    )}
                  >
                    <span className="text-xs text-muted-foreground">
                      {lang === 'hr' ? spec.label_hr : spec.label_en}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground">{spec.value}</span>
                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              updateSpec.mutate({
                                specId: spec.id,
                                data: { show_in_pdf: spec.show_in_pdf === false },
                              })
                            }
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            title={spec.show_in_pdf === false ? t('boats.showInPdf') : t('boats.hideFromPdf')}
                          >
                            {spec.show_in_pdf === false ? (
                              <EyeOff className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            ) : (
                              <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(spec)}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteSpec(spec.id)}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              )}
          </div>

          {/* Add spec to this category */}
          {isAdmin && (
            <>
              {addingToCategory === category ? (
                <div className="mt-2 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      value={newSpec.label_hr}
                      onChange={(e) => setNewSpec((p) => ({ ...p, label_hr: e.target.value }))}
                      placeholder="Label HR"
                      className="rounded border border-border px-2 py-1 text-xs"
                    />
                    <input
                      value={newSpec.label_en}
                      onChange={(e) => setNewSpec((p) => ({ ...p, label_en: e.target.value }))}
                      placeholder="Label EN"
                      className="rounded border border-border px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      value={newSpec.value}
                      onChange={(e) => setNewSpec((p) => ({ ...p, value: e.target.value }))}
                      placeholder="Value"
                      className="flex-1 rounded border border-border px-2 py-1 text-xs"
                    />
                    <button type="button" onClick={() => handleAddSpec(category)} className="text-green-600 hover:text-green-700">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setAddingToCategory(null)} className="text-muted-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingToCategory(category)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  {t('boats.addSpec')}
                </button>
              )}
            </>
          )}
        </div>
      ))}

      {/* Add new category */}
      {isAdmin && (
        <>
          {addingCategory ? (
            <div className="flex items-center gap-2">
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="rounded border border-border px-2 py-1 text-xs"
              />
              <button type="button" onClick={handleAddCategory} className="text-green-600 hover:text-green-700">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setAddingCategory(false)} className="text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('boats.addCategory')}
            </button>
          )}
        </>
      )}

      {/* Delete spec confirm */}
      <ConfirmDialog
        isOpen={!!showDeleteSpec}
        title={t('common.delete')}
        description={t('boats.deleteImageConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isDangerous
        isLoading={deleteSpec.isPending}
        onConfirm={handleDeleteSpec}
        onCancel={() => setShowDeleteSpec(null)}
      />

      {/* Copy specs confirm */}
      <ConfirmDialog
        isOpen={showCopyConfirm && !!sourceBoat}
        title={t('boats.copySpecsTitle')}
        description={
          sourceBoat
            ? t('boats.copySpecsConfirm', {
                count: sourceBoat.specs.length,
                name: allBoats?.find((b) => b.id === copySourceBoatId)?.name ?? '',
              })
            : ''
        }
        confirmText={t('boats.copySpecsTitle')}
        cancelText={t('common.cancel')}
        isLoading={copySpecs.isPending}
        onConfirm={handleCopyConfirm}
        onCancel={() => {
          setShowCopyConfirm(false)
          setCopySourceBoatId(null)
        }}
      />
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="flex-1 animate-pulse p-4 space-y-4">
      <div className={cn(ds.skeleton.base, 'h-40 w-full')} />
      <div className={cn(ds.skeleton.line, 'h-5 w-3/4')} />
      <div className={cn(ds.skeleton.line, 'h-4 w-1/2')} />
      <div className="flex gap-2">
        <div className={cn(ds.skeleton.line, 'h-6 w-16')} />
        <div className={cn(ds.skeleton.line, 'h-6 w-16')} />
        <div className={cn(ds.skeleton.line, 'h-6 w-16')} />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn(ds.skeleton.line, 'h-4')} />
        ))}
      </div>
    </div>
  )
}
