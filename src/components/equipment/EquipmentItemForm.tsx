import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { equipmentItemSchema, type EquipmentItemFormData } from '@/lib/validators'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

function formatPriceDisplay(value: number): string {
  if (value === 0) return ''
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function parsePriceInput(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

interface EquipmentItemFormProps {
  isOpen: boolean
  defaultValues?: Partial<EquipmentItemFormData>
  onSubmit: (data: EquipmentItemFormData) => void
  isLoading?: boolean
  onCancel: () => void
}

export const EquipmentItemForm = ({
  isOpen,
  defaultValues,
  onSubmit,
  isLoading = false,
  onCancel,
}: EquipmentItemFormProps) => {
  const { t } = useTranslation()
  const [lang, setLang] = useState<'hr' | 'en'>('hr')
  const [priceFocused, setPriceFocused] = useState(false)
  const [priceRawInput, setPriceRawInput] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<EquipmentItemFormData>({
    resolver: zodResolver(equipmentItemSchema),
    defaultValues: { price: 0, is_standard: false, ...defaultValues },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ price: 0, is_standard: false, ...defaultValues })
    }
  }, [isOpen, defaultValues, reset])

  const isEdit = !!defaultValues

  const footerContent = (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'disabled:opacity-50')}
      >
        {t('common.cancel')}
      </button>
      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        disabled={isLoading}
        className={cn(ds.btn.base, ds.btn.sm, 'bg-navy text-white hover:bg-navy-light disabled:opacity-50')}
      >
        {isLoading ? t('common.loading') : t('common.save')}
      </button>
    </>
  )

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onCancel()}
      title={isEdit ? t('equipment.editItem') : t('equipment.addItem')}
      size="md"
      footer={footerContent}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={ds.form.spacing}>
        {/* Bilingual tabs for name */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={ds.input.label}>
              {t('equipment.itemName')} *
            </label>
            <div className="flex rounded-md border border-border">
              <button
                type="button"
                onClick={() => setLang('hr')}
                className={cn(
                  ds.form.langTab,
                  lang === 'hr'
                    ? ds.form.langTabActive
                    : ds.form.langTabInactive,
                  errors.name_hr && 'ring-2 ring-red-400'
                )}
              >
                HR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={cn(
                  ds.form.langTab,
                  lang === 'en'
                    ? ds.form.langTabActive
                    : ds.form.langTabInactive,
                  errors.name_en && 'ring-2 ring-red-400'
                )}
              >
                EN
              </button>
            </div>
          </div>
          <input
            {...register('name_hr')}
            placeholder={t('equipment.nameHr')}
            className={cn(
              ds.input.base,
              lang !== 'hr' && 'hidden'
            )}
          />
          <input
            {...register('name_en')}
            placeholder={t('equipment.nameEn')}
            className={cn(
              ds.input.base,
              lang !== 'en' && 'hidden'
            )}
          />
          {(errors.name_hr || errors.name_en) && (
            <p className={ds.input.error}>
              {errors.name_hr?.message || errors.name_en?.message}
            </p>
          )}
        </div>

        {/* Bilingual description */}
        <div>
          <label className={ds.input.label}>
            {t('equipment.description')}
          </label>
          <textarea
            {...register('description_hr')}
            rows={2}
            placeholder={t('equipment.descriptionHr')}
            className={cn(
              ds.input.textarea,
              lang !== 'hr' && 'hidden'
            )}
          />
          <textarea
            {...register('description_en')}
            rows={2}
            placeholder={t('equipment.descriptionEn')}
            className={cn(
              ds.input.textarea,
              lang !== 'en' && 'hidden'
            )}
          />
        </div>

        {/* Price + Standard toggle */}
        <div className={ds.form.grid}>
          <div>
            <label className={ds.input.label}>
              {t('equipment.price')} (EUR)
            </label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceFocused ? priceRawInput : formatPriceDisplay(field.value)}
                  onFocus={() => {
                    setPriceFocused(true)
                    setPriceRawInput(field.value > 0 ? String(field.value) : '')
                  }}
                  onBlur={() => {
                    setPriceFocused(false)
                  }}
                  onChange={(e) => {
                    const raw = e.target.value
                    setPriceRawInput(raw)
                    field.onChange(parsePriceInput(raw))
                  }}
                  className={ds.input.base}
                />
              )}
            />
            {errors.price && (
              <p className={ds.input.error}>{errors.price.message}</p>
            )}
          </div>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                {...register('is_standard')}
                className={ds.input.checkbox}
              />
              <span className="text-xs text-foreground">
                {t('equipment.isStandard')}
              </span>
            </label>
          </div>
        </div>
      </form>
    </ResponsiveModal>
  )
}
