import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { contactSchema, type ContactFormData } from '@/lib/validators'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'

interface ContactFormProps {
  isOpen: boolean
  onClose: () => void
  defaultValues?: Partial<ContactFormData>
  onSubmit: (data: ContactFormData) => void
  isLoading?: boolean
}

export const ContactForm = ({
  isOpen,
  onClose,
  defaultValues,
  onSubmit,
  isLoading = false,
}: ContactFormProps) => {
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      is_primary: false,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        is_primary: false,
        ...defaultValues,
      })
    }
  }, [isOpen, defaultValues, reset])

  const isEdit = !!defaultValues?.full_name

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
      title={isEdit ? t('clients.editContact') : t('clients.addContact')}
      size="md"
      footer={footerContent}
    >
      <form onSubmit={handleSubmit(onSubmit)} className={ds.form.spacing}>
        <div>
          <label className={ds.input.label}>
            {t('clients.contactName')} *
          </label>
          <input {...register('full_name')} className={ds.input.base} />
          {errors.full_name && (
            <p className={ds.input.error}>{errors.full_name.message}</p>
          )}
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

        <div>
          <label className={ds.input.label}>
            {t('clients.phone')}
          </label>
          <input {...register('phone')} className={ds.input.base} />
        </div>

        <div>
          <label className={ds.input.label}>
            {t('clients.position')}
          </label>
          <input {...register('position')} className={ds.input.base} />
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            {...register('is_primary')}
            className={ds.input.checkbox}
          />
          {t('clients.primaryContact')}
        </label>
      </form>
    </ResponsiveModal>
  )
}
