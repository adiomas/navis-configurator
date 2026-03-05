import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { clientFormSchema } from '@/lib/validators'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { ContactSelector } from '@/components/configurator/ContactSelector'
import type { ClientFormData, CompanyWithContacts, Contact } from '@/types'

interface ClientFormProps {
  defaultValues: ClientFormData
  selectedCompany: CompanyWithContacts | null
  selectedContact?: Contact | null
  onSelectContact?: (contact: Contact) => void
  onSubmit: (data: ClientFormData) => void
  onValuesChange?: (data: Partial<ClientFormData>) => void
  formRef?: React.RefObject<HTMLFormElement | null>
}

export function ClientForm({ defaultValues, selectedCompany, selectedContact, onSelectContact, onSubmit, onValuesChange, formRef }: ClientFormProps) {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  })

  // Auto-fill when a company or contact is selected
  useEffect(() => {
    if (!selectedCompany) return

    const contact = selectedContact
      ?? selectedCompany.contacts.find((c) => c.is_primary)
      ?? selectedCompany.contacts[0]

    reset({
      companyId: selectedCompany.id,
      contactId: contact?.id,
      name: contact?.full_name ?? '',
      email: contact?.email ?? '',
      phone: contact?.phone ?? '',
      companyName: selectedCompany.name,
      notes: '',
      language: (selectedCompany.preferred_language as 'hr' | 'en') ?? 'en',
    })
  }, [selectedCompany, selectedContact, reset])

  // Sync form values to parent on every change
  useEffect(() => {
    if (!onValuesChange) return
    // Sync initial/current values immediately (covers reset race condition)
    onValuesChange(watch() as Partial<ClientFormData>)
    const subscription = watch((value) => {
      onValuesChange(value as Partial<ClientFormData>)
    })
    return () => subscription.unsubscribe()
  }, [watch, onValuesChange])

  const language = watch('language')

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {/* Contact selector for companies with multiple contacts */}
      {selectedCompany && selectedCompany.client_type === 'company' && selectedCompany.contacts.length >= 2 && onSelectContact && (
        <ContactSelector
          contacts={selectedCompany.contacts}
          selectedContactId={selectedContact?.id}
          onSelectContact={onSelectContact}
        />
      )}

      {/* Contact Name + Email row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={ds.input.label}>
            {t('configurator.contactName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('name')}
            className={cn(ds.input.base, errors.name && 'border-red-400 focus:border-red-500 focus:ring-red-200')}
            placeholder={t('configurator.contactName')}
          />
          {errors.name && (
            <p className={ds.input.error}>{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className={ds.input.label}>
            {t('configurator.email')} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            {...register('email')}
            className={cn(ds.input.base, errors.email && 'border-red-400 focus:border-red-500 focus:ring-red-200')}
            placeholder="name@company.com"
          />
          {errors.email && (
            <p className={ds.input.error}>{errors.email.message}</p>
          )}
        </div>
      </div>

      {/* Phone + Company row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={ds.input.label}>
            {t('configurator.phone')}
          </label>
          <input
            type="tel"
            {...register('phone')}
            className={ds.input.base}
            placeholder="+385 91 234 5678"
          />
        </div>
        <div>
          <label className={ds.input.label}>
            {t('configurator.companyName')}
          </label>
          <input
            type="text"
            {...register('companyName')}
            className={ds.input.base}
            placeholder={t('configurator.companyName')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={ds.input.label}>
          {t('configurator.notes')}
        </label>
        <textarea
          {...register('notes')}
          rows={2}
          className={cn(ds.input.textarea, 'min-h-[72px]')}
          placeholder={t('configurator.notes')}
        />
      </div>

      {/* Quote Language */}
      <div>
        <label className={ds.input.label}>
          {t('configurator.quoteLanguage')}
        </label>
        <div className="flex gap-2">
          <label
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200',
              language === 'hr'
                ? 'border-primary bg-primary/5 font-medium text-primary shadow-sm'
                : 'border-input text-muted-foreground hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            <input
              type="radio"
              value="hr"
              {...register('language')}
              className="sr-only"
            />
            <span className="text-sm">🇭🇷</span>
            {t('configurator.languageHr')}
          </label>
          <label
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200',
              language === 'en'
                ? 'border-primary bg-primary/5 font-medium text-primary shadow-sm'
                : 'border-input text-muted-foreground hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            <input
              type="radio"
              value="en"
              {...register('language')}
              className="sr-only"
            />
            <span className="text-sm">🇬🇧</span>
            {t('configurator.languageEn')}
          </label>
        </div>
      </div>

      {/* Hidden fields for IDs */}
      <input type="hidden" {...register('companyId')} />
      <input type="hidden" {...register('contactId')} />
    </form>
  )
}
