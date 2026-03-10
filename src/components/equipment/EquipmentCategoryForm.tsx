import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { equipmentCategorySchema, type EquipmentCategoryFormData } from '@/lib/validators'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

interface EquipmentCategoryFormProps {
  isOpen: boolean
  defaultValues?: Partial<EquipmentCategoryFormData>
  onSubmit: (data: EquipmentCategoryFormData) => void
  isLoading?: boolean
  onCancel: () => void
}

export const EquipmentCategoryForm = ({
  isOpen,
  defaultValues,
  onSubmit,
  isLoading = false,
  onCancel,
}: EquipmentCategoryFormProps) => {
  const { t } = useTranslation()
  const [lang, setLang] = useState<'hr' | 'en'>('hr')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EquipmentCategoryFormData>({
    resolver: zodResolver(equipmentCategorySchema),
    defaultValues,
  })

  useEffect(() => {
    if (isOpen) {
      reset(defaultValues)
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
      title={isEdit ? t('equipment.editCategory') : t('equipment.addCategory')}
      size="sm"
      footer={footerContent}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={ds.form.spacing}>
        {/* Bilingual tabs */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className={ds.input.label}>
              {t('equipment.categoryName')} *
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

        {/* Discountable toggle */}
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              {...register('is_discountable')}
              className={ds.input.checkbox}
            />
            <span className="text-xs text-foreground">
              {t('equipment.isDiscountable')}
            </span>
          </label>
        </div>
      </form>
    </ResponsiveModal>
  )
}
