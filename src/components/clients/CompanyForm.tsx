import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Building2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { companySchema, type CompanyFormData } from '@/lib/validators'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

interface CompanyFormProps {
  isOpen: boolean
  onClose: () => void
  defaultValues?: Partial<CompanyFormData>
  onSubmit: (data: CompanyFormData) => void
  isLoading?: boolean
}

const leadSources = ['fair', 'referral', 'website', 'cold', 'other'] as const

export const CompanyForm = ({
  isOpen,
  onClose,
  defaultValues,
  onSubmit,
  isLoading = false,
}: CompanyFormProps) => {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      client_type: 'company',
      client_category: 'prospect',
      preferred_language: 'hr',
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        client_type: 'company',
        client_category: 'prospect',
        preferred_language: 'hr',
        ...defaultValues,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const clientType = watch('client_type')
  const isIndividual = clientType === 'individual'
  const isEdit = !!defaultValues?.name

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
        className={cn(ds.btn.base, ds.btn.md, 'bg-navy text-white hover:bg-navy-light disabled:opacity-50')}
      >
        {isLoading ? t('common.loading') : t('common.save')}
      </button>
    </>
  )

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={isEdit ? t('clients.editCompany') : t('clients.addCompany')}
      size="lg"
      footer={footerContent}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={ds.form.spacing}>
        {/* Client type toggle */}
        <div>
          <label className={ds.input.label}>
            {t('clients.clientType')}
          </label>
          <div className="flex overflow-hidden rounded-lg border border-input">
            <button
              type="button"
              onClick={() => setValue('client_type', 'company')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 py-2 text-xs font-medium transition-colors',
                !isIndividual
                  ? 'bg-navy text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <Building2 className="h-3.5 w-3.5" />
              {t('clients.clientTypeCompany')}
            </button>
            <button
              type="button"
              onClick={() => setValue('client_type', 'individual')}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 py-2 text-xs font-medium transition-colors',
                isIndividual
                  ? 'bg-navy text-white'
                  : 'bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              <User className="h-3.5 w-3.5" />
              {t('clients.clientTypeIndividual')}
            </button>
          </div>
        </div>

        {/* Row 1: Name + ID */}
        <div className={ds.form.grid}>
          <div>
            <label className={ds.input.label}>
              {isIndividual ? t('clients.fullName') : t('clients.companyName')} *
            </label>
            <input {...register('name')} className={ds.input.base} />
            {errors.name && (
              <p className={ds.input.error}>{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className={ds.input.label}>
              {isIndividual ? t('clients.personalId') : t('clients.registrationNumber')}
            </label>
            <input {...register('registration_number')} className={ds.input.base} />
          </div>
        </div>

        {/* Row 2: Address + City */}
        <div className={ds.form.grid}>
          <div>
            <label className={ds.input.label}>
              {t('clients.address')}
            </label>
            <input {...register('address')} className={ds.input.base} />
          </div>
          <div>
            <label className={ds.input.label}>
              {t('clients.city')}
            </label>
            <input {...register('city')} className={ds.input.base} />
          </div>
        </div>

        {/* Row 4: Postal + Country */}
        <div className={ds.form.grid}>
          <div>
            <label className={ds.input.label}>
              {t('clients.postalCode')}
            </label>
            <input {...register('postal_code')} className={ds.input.base} />
          </div>
          <div>
            <label className={ds.input.label}>
              {t('clients.country')}
            </label>
            <input {...register('country')} className={ds.input.base} />
          </div>
        </div>

        {/* Row 5: Phone + Email */}
        <div className={ds.form.grid}>
          <div>
            <label className={ds.input.label}>
              {t('clients.phone')}
            </label>
            <input {...register('phone')} className={ds.input.base} />
          </div>
          <div>
            <label className={ds.input.label}>
              {t('clients.email')}
            </label>
            <input type="email" {...register('email')} className={ds.input.base} />
            {errors.email && (
              <p className={ds.input.error}>{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Row 6: Website (companies only) */}
        {!isIndividual && (
          <div>
            <label className={ds.input.label}>
              {t('clients.website')}
            </label>
            <input
              {...register('website')}
              placeholder="https://"
              className={ds.input.base}
            />
            {errors.website && (
              <p className={ds.input.error}>{errors.website.message}</p>
            )}
          </div>
        )}

        {/* Row 7: Category + Lead Source */}
        <div className={ds.form.grid}>
          <div>
            <label className={ds.input.label}>
              {t('clients.category')}
            </label>
            <select {...register('client_category')} className={ds.input.select}>
              <option value="prospect">{t('clients.prospect')}</option>
              <option value="regular">{t('clients.regular')}</option>
              <option value="vip">{t('clients.vip')}</option>
            </select>
          </div>
          <div>
            <label className={ds.input.label}>
              {t('clients.leadSource')}
            </label>
            <select {...register('lead_source')} className={ds.input.select}>
              <option value="">&mdash;</option>
              {leadSources.map((src) => (
                <option key={src} value={src}>
                  {t(`clients.leadSource${src.charAt(0).toUpperCase() + src.slice(1)}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 8: Preferred Language */}
        <div>
          <label className={ds.input.label}>
            {t('clients.preferredLanguage')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="radio"
                value="hr"
                {...register('preferred_language')}
                className="h-3.5 w-3.5 border-border text-primary focus:ring-primary"
              />
              {t('clients.languageHr')}
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="radio"
                value="en"
                {...register('preferred_language')}
                className="h-3.5 w-3.5 border-border text-primary focus:ring-primary"
              />
              {t('clients.languageEn')}
            </label>
          </div>
        </div>

        {/* Row 9: Notes */}
        <div>
          <label className={ds.input.label}>
            {t('clients.notes')}
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className={ds.input.textarea}
          />
        </div>
      </form>
    </ResponsiveModal>
  )
}
