import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { boatSchema, type BoatFormData } from '@/lib/validators'
import { useBoatBrands } from '@/hooks/useBoats'

interface BoatFormProps {
  defaultValues?: Partial<BoatFormData>
  onSubmit: (data: BoatFormData) => void
  isLoading?: boolean
  submitLabel?: string
  onCancel?: () => void
}

export const BoatForm = ({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel,
  onCancel,
}: BoatFormProps) => {
  const { t } = useTranslation()
  const [descLang, setDescLang] = useState<'hr' | 'en'>('hr')
  const [showNewBrand, setShowNewBrand] = useState(false)
  const { data: existingBrands } = useBoatBrands()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BoatFormData>({
    resolver: zodResolver(boatSchema),
    defaultValues: {
      brand: 'Azimut',
      category: 'new',
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={ds.form.spacing}>
      {/* Row 1: Name + Brand */}
      <div className={ds.form.grid}>
        <div>
          <label className={ds.input.label}>
            {t('boats.name')} *
          </label>
          <input
            {...register('name')}
            className={ds.input.base}
          />
          {errors.name && (
            <p className={ds.input.error}>{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className={ds.input.label}>
            {t('boats.brand')}
          </label>
          {showNewBrand ? (
            <div className="flex gap-1.5">
              <input
                {...register('brand')}
                className={cn(ds.input.base, 'flex-1')}
                autoFocus
                placeholder={t('boats.addNewBrand')}
              />
              <button
                type="button"
                onClick={() => setShowNewBrand(false)}
                className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'shrink-0')}
              >
                {t('common.cancel')}
              </button>
            </div>
          ) : (
            <select
              value={watch('brand') ?? ''}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setValue('brand', '')
                  setShowNewBrand(true)
                } else {
                  setValue('brand', e.target.value)
                }
              }}
              className={ds.input.select}
            >
              <option value="">{t('boats.selectBrand')}</option>
              {(existingBrands ?? []).map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
              <option value="__new__">{t('boats.addNewBrand')}</option>
            </select>
          )}
        </div>
      </div>

      {/* Row 2: Model + Year */}
      <div className={ds.form.grid}>
        <div>
          <label className={ds.input.label}>
            {t('boats.model')}
          </label>
          <input
            {...register('model')}
            className={ds.input.base}
          />
        </div>
        <div>
          <label className={ds.input.label}>
            {t('boats.year')}
          </label>
          <input
            type="number"
            {...register('year', { valueAsNumber: true })}
            className={ds.input.base}
          />
          {errors.year && (
            <p className={ds.input.error}>{errors.year.message}</p>
          )}
        </div>
      </div>

      {/* Row 3: Category + Base Price */}
      <div className={ds.form.grid}>
        <div>
          <label className={ds.input.label}>
            {t('boats.category')}
          </label>
          <select
            {...register('category')}
            className={ds.input.select}
          >
            <option value="new">{t('boats.new')}</option>
            <option value="used">{t('boats.used')}</option>
          </select>
        </div>
        <div>
          <label className={ds.input.label}>
            {t('boats.basePrice')} *
          </label>
          <input
            type="number"
            step="0.01"
            {...register('base_price', { valueAsNumber: true })}
            className={ds.input.base}
          />
          {errors.base_price && (
            <p className={ds.input.error}>
              {errors.base_price.message}
            </p>
          )}
        </div>
      </div>

      {/* Description with language tabs */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">
            {t('boats.description')} *
          </label>
          <div className="flex rounded-md border border-border">
            <button
              type="button"
              onClick={() => setDescLang('hr')}
              className={cn(
                ds.form.langTab,
                descLang === 'hr'
                  ? ds.form.langTabActive
                  : ds.form.langTabInactive,
                errors.description_hr && 'ring-2 ring-red-400'
              )}
            >
              HR
            </button>
            <button
              type="button"
              onClick={() => setDescLang('en')}
              className={cn(
                ds.form.langTab,
                descLang === 'en'
                  ? ds.form.langTabActive
                  : ds.form.langTabInactive,
                errors.description_en && 'ring-2 ring-red-400'
              )}
            >
              EN
            </button>
          </div>
        </div>
        <textarea
          {...register('description_hr')}
          rows={3}
          className={cn(
            ds.input.textarea,
            descLang !== 'hr' && 'hidden',
            errors.description_hr && 'border-red-400'
          )}
          placeholder={t('boats.descriptionHr')}
        />
        {descLang === 'hr' && errors.description_hr && (
          <p className={ds.input.error}>{errors.description_hr.message}</p>
        )}
        <textarea
          {...register('description_en')}
          rows={3}
          className={cn(
            ds.input.textarea,
            descLang !== 'en' && 'hidden',
            errors.description_en && 'border-red-400'
          )}
          placeholder={t('boats.descriptionEn')}
        />
        {descLang === 'en' && errors.description_en && (
          <p className={ds.input.error}>{errors.description_en.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t border-border pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(ds.btn.base, ds.btn.sm, ds.btn.secondary, 'disabled:opacity-50')}
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(ds.btn.base, ds.btn.sm, 'bg-navy text-white hover:bg-navy-light disabled:opacity-50')}
        >
          {isLoading ? t('common.loading') : submitLabel ?? t('common.save')}
        </button>
      </div>
    </form>
  )
}
