import { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Upload, X, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { companySettingsSchema, type CompanySettingsFormData } from '@/lib/validators'
import { useUpdateCompanySettings, useUploadLogo, useRemoveLogo } from '@/hooks/useSettings'
import type { CompanySettings } from '@/types'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface CompanySettingsFormProps {
  initialData: CompanySettings | null
}

export const CompanySettingsForm = ({ initialData }: CompanySettingsFormProps) => {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const updateSettings = useUpdateCompanySettings()
  const uploadLogo = useUploadLogo()
  const removeLogo = useRemoveLogo()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      oib: initialData?.oib ?? '',
      address: initialData?.address ?? '',
      city: initialData?.city ?? '',
      postal_code: initialData?.postal_code ?? '',
      email: initialData?.email ?? '',
      phone: initialData?.phone ?? '',
      website: initialData?.website ?? '',
      iban: initialData?.iban ?? '',
      bic: initialData?.bic ?? '',
      bank_name: initialData?.bank_name ?? '',
      default_currency: initialData?.default_currency ?? 'EUR',
      default_language: (initialData?.default_language as 'hr' | 'en') ?? 'hr',
    },
  })

  const onSubmit = async (data: CompanySettingsFormData) => {
    try {
      await updateSettings.mutateAsync(data)
      toast.success(t('settings.saveSuccess'))
    } catch {
      toast.error(t('settings.saveError'))
    }
  }

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(t('settings.invalidFileType'))
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('settings.fileTooLarge'))
        return
      }
      try {
        await uploadLogo.mutateAsync(file)
        toast.success(t('settings.uploadSuccess'))
      } catch {
        toast.error(t('settings.uploadError'))
      }
    },
    [uploadLogo, t]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleRemoveLogo = async () => {
    try {
      await removeLogo.mutateAsync()
      toast.success(t('settings.removeLogoSuccess'))
    } catch {
      toast.error(t('settings.uploadError'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Company Details */}
      <section className="space-y-3">
        <h3 className={ds.card.title}>{t('settings.companyDetails')}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="settings-name" className={ds.input.label}>
              {t('settings.companyName')} *
            </label>
            <input id="settings-name" {...register('name')} className={ds.input.base} />
            {errors.name && <p className={ds.input.error}>{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="settings-oib" className={ds.input.label}>{t('settings.oib')}</label>
            <input id="settings-oib" {...register('oib')} className={ds.input.base} />
          </div>
          <div>
            <label htmlFor="settings-email" className={ds.input.label}>{t('settings.email')}</label>
            <input id="settings-email" {...register('email')} type="email" className={ds.input.base} />
            {errors.email && <p className={ds.input.error}>{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="settings-phone" className={ds.input.label}>{t('settings.phone')}</label>
            <input id="settings-phone" {...register('phone')} className={ds.input.base} />
          </div>
          <div>
            <label htmlFor="settings-address" className={ds.input.label}>{t('settings.address')}</label>
            <input id="settings-address" {...register('address')} className={ds.input.base} />
          </div>
          <div>
            <label htmlFor="settings-city" className={ds.input.label}>{t('settings.city')}</label>
            <input id="settings-city" {...register('city')} className={ds.input.base} />
          </div>
          <div>
            <label htmlFor="settings-postal-code" className={ds.input.label}>{t('settings.postalCode')}</label>
            <input id="settings-postal-code" {...register('postal_code')} className={ds.input.base} />
          </div>
          <div>
            <label htmlFor="settings-website" className={ds.input.label}>{t('settings.website')}</label>
            <input id="settings-website" {...register('website')} className={ds.input.base} placeholder="https://" />
            {errors.website && <p className={ds.input.error}>{errors.website.message}</p>}
          </div>
        </div>
      </section>

      {/* Payment & Defaults */}
      <section className="space-y-3">
        <h3 className={ds.card.title}>{t('settings.paymentDetails')}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="settings-iban" className={ds.input.label}>{t('settings.iban')}</label>
            <input id="settings-iban" {...register('iban')} className={ds.input.base} placeholder="HR..." />
          </div>
          <div>
            <label htmlFor="settings-bic" className={ds.input.label}>{t('settings.bic')}</label>
            <input id="settings-bic" {...register('bic')} className={ds.input.base} />
          </div>
          <div>
            <label htmlFor="settings-bank-name" className={ds.input.label}>{t('settings.bankName')}</label>
            <input id="settings-bank-name" {...register('bank_name')} className={ds.input.base} />
          </div>
          <div>
            <label htmlFor="settings-currency" className={ds.input.label}>{t('settings.currency')}</label>
            <select id="settings-currency" {...register('default_currency')} className={ds.input.select}>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label className={ds.input.label}>{t('settings.language')}</label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-1.5">
                <input type="radio" value="hr" {...register('default_language')} className="h-3.5 w-3.5 accent-primary" />
                <span className="text-xs">{t('settings.croatian')}</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="radio" value="en" {...register('default_language')} className="h-3.5 w-3.5 accent-primary" />
                <span className="text-xs">{t('settings.english')}</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Logo */}
      <section className="space-y-3">
        <h3 className={ds.card.title}>{t('settings.logo')}</h3>
        <div className="flex max-w-sm items-start gap-3">
          {initialData?.logo_url && (
            <div className="relative shrink-0">
              <img
                src={initialData.logo_url}
                alt="Company logo"
                loading="lazy"
                className="h-16 w-16 rounded-lg border border-border object-contain p-1.5"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={removeLogo.isPending}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white shadow-sm transition-colors hover:bg-red-600"
                aria-label={t('settings.removeLogo')}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex min-h-[64px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            {uploadLogo.isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <>
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t('settings.dragOrClick')}</span>
                <span className="text-[11px] text-muted-foreground/70">{t('settings.maxFileSize')}</span>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
              e.target.value = ''
            }}
          />
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="submit"
          disabled={isSubmitting || updateSettings.isPending}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary, 'disabled:opacity-50')}
        >
          <Building2 className="h-3.5 w-3.5" />
          {isSubmitting || updateSettings.isPending ? t('common.loading') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
