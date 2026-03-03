import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { templateGroupSchema, type TemplateGroupFormData } from '@/lib/validators'
import { useTemplateGroup } from '@/hooks/useTemplateGroups'
import { TemplateGroupBoatSelector } from './TemplateGroupBoatSelector'
import { TemplateGroupEquipmentSelector } from './TemplateGroupEquipmentSelector'
import { TemplateGroupDiscountEditor } from './TemplateGroupDiscountEditor'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

interface BoatSelection {
  boat_id: string
  special_price: number | null
}

interface EquipmentSelection {
  boat_id: string
  equipment_item_id: string
  special_price: number | null
}

interface DiscountRow {
  discount_level: string
  discount_type: string
  value: number
  description: string
}

export interface TemplateGroupFormResult {
  group: TemplateGroupFormData
  boats: BoatSelection[]
  equipment: EquipmentSelection[]
  discounts: DiscountRow[]
}

interface TemplateGroupFormProps {
  groupId?: string
  isLoading?: boolean
  onSave: (data: TemplateGroupFormResult) => void
  onClose: () => void
}

type Tab = 'basic' | 'boats' | 'equipment' | 'discounts'

export function TemplateGroupForm({ groupId, isLoading, onSave, onClose }: TemplateGroupFormProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('basic')

  const { data: existingGroup } = useTemplateGroup(groupId)

  const populatedRef = useRef(false)

  const [boats, setBoats] = useState<BoatSelection[]>([])
  const [equipment, setEquipment] = useState<EquipmentSelection[]>([])
  const [discounts, setDiscounts] = useState<DiscountRow[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateGroupFormData>({
    resolver: zodResolver(templateGroupSchema),
    defaultValues: {
      name: '',
      description: '',
      valid_from: '',
      valid_until: '',
      is_active: true,
    },
  })

  // Populate form when editing - synchronizing external data (Supabase) into local state
  useEffect(() => {
    if (!existingGroup || populatedRef.current) return
    populatedRef.current = true

    reset({
      name: existingGroup.name,
      description: existingGroup.description ?? '',
      valid_from: existingGroup.valid_from ?? '',
      valid_until: existingGroup.valid_until ?? '',
      is_active: existingGroup.is_active,
    })

    setBoats( // eslint-disable-line react-hooks/set-state-in-effect -- sync from external data
      existingGroup.boats.map((b) => ({
        boat_id: b.boat_id,
        special_price: b.special_price,
      }))
    )

    setEquipment(
      existingGroup.equipment.map((e) => ({
        boat_id: e.boat_id,
        equipment_item_id: e.equipment_item_id,
        special_price: e.special_price,
      }))
    )

    setDiscounts(
      existingGroup.discounts.map((d) => ({
        discount_level: d.discount_level,
        discount_type: d.discount_type,
        value: d.value,
        description: d.description ?? '',
      }))
    )
  }, [existingGroup, reset])

  const onSubmit = (formData: TemplateGroupFormData) => {
    onSave({
      group: formData,
      boats,
      equipment,
      discounts: discounts.filter((d) => d.value > 0),
    })
  }

  const tabs: { value: Tab; label: string }[] = [
    { value: 'basic', label: t('templateGroups.basicInfo') },
    { value: 'boats', label: t('templateGroups.boats') },
    { value: 'equipment', label: t('templateGroups.equipment') },
    { value: 'discounts', label: t('templateGroups.discounts') },
  ]

  const boatIds = boats.map((b) => b.boat_id)

  const footerContent = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary, 'disabled:opacity-50')}
      >
        {t('common.cancel')}
      </button>
      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading}
        className={cn(ds.btn.base, ds.btn.md, ds.btn.primary, 'disabled:opacity-50')}
      >
        {isLoading ? '...' : t('common.save')}
      </button>
    </>
  )

  return (
    <ResponsiveModal
      open
      onOpenChange={(open) => !open && onClose()}
      title={groupId ? t('templateGroups.editGroup') : t('templateGroups.addGroup')}
      size="lg"
      footer={footerContent}
    >
      {/* Tabs */}
      <div className="-mx-5 -mt-5 flex border-b border-border px-5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            {tab.value === 'boats' && boats.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs">
                {boats.length}
              </span>
            )}
            {tab.value === 'equipment' && equipment.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs">
                {equipment.length}
              </span>
            )}
            {tab.value === 'discounts' && discounts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs">
                {discounts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-4">
        {activeTab === 'basic' && (
          <div className={ds.form.spacing}>
            <div>
              <label className={ds.input.label}>
                {t('templateGroups.name')} *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Boot Düsseldorf 2025"
                className={ds.input.base}
              />
              {errors.name && (
                <p className={ds.input.error}>{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className={ds.input.label}>
                {t('templateGroups.description')}
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className={ds.input.textarea}
              />
            </div>

            <div className={ds.form.grid}>
              <div>
                <label className={ds.input.label}>
                  {t('templateGroups.validFrom')} *
                </label>
                <input
                  type="date"
                  {...register('valid_from')}
                  className={ds.input.base}
                />
                {errors.valid_from && (
                  <p className={ds.input.error}>{errors.valid_from.message}</p>
                )}
              </div>
              <div>
                <label className={ds.input.label}>
                  {t('templateGroups.validTo')} *
                </label>
                <input
                  type="date"
                  {...register('valid_until')}
                  className={ds.input.base}
                />
                {errors.valid_until && (
                  <p className={ds.input.error}>{errors.valid_until.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className={ds.input.checkbox}
              />
              <label htmlFor="is_active" className="text-xs font-medium text-foreground">
                {t('templateGroups.isActive')}
              </label>
            </div>
          </div>
        )}

        {activeTab === 'boats' && (
          <TemplateGroupBoatSelector value={boats} onChange={setBoats} />
        )}

        {activeTab === 'equipment' && (
          <TemplateGroupEquipmentSelector
            boatIds={boatIds}
            value={equipment}
            onChange={setEquipment}
          />
        )}

        {activeTab === 'discounts' && (
          <TemplateGroupDiscountEditor value={discounts} onChange={setDiscounts} />
        )}
      </div>
    </ResponsiveModal>
  )
}
