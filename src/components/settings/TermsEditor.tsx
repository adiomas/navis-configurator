import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import { useUpdateTerms } from '@/hooks/useSettings'
import type { CompanySettings } from '@/types'

interface TermsFormData {
  terms_hr: string
  terms_en: string
}

interface TermsEditorProps {
  initialData: CompanySettings | null
}

export const TermsEditor = ({ initialData }: TermsEditorProps) => {
  const { t } = useTranslation()
  const [activeLang, setActiveLang] = useState<'hr' | 'en'>('hr')
  const updateTerms = useUpdateTerms()

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<TermsFormData>({
    defaultValues: {
      terms_hr: initialData?.terms_hr ?? '',
      terms_en: initialData?.terms_en ?? '',
    },
  })

  const watchedTerms = useWatch({ control })

  const onSubmit = async (data: TermsFormData) => {
    if (!initialData) {
      toast.error(t('settings.saveCompanyFirst'))
      return
    }
    try {
      await updateTerms.mutateAsync(data)
      toast.success(t('settings.termsSaveSuccess'))
    } catch {
      toast.error(t('settings.termsSaveError'))
    }
  }

  const currentCharCount = activeLang === 'hr'
    ? (watchedTerms.terms_hr ?? '').length
    : (watchedTerms.terms_en ?? '').length

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Language switcher */}
      <div className="flex gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5 self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveLang('hr')}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeLang === 'hr'
              ? 'bg-navy text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('settings.termsHr')}
        </button>
        <button
          type="button"
          onClick={() => setActiveLang('en')}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            activeLang === 'en'
              ? 'bg-navy text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t('settings.termsEn')}
        </button>
      </div>

      {/* Textareas — both always registered, only active one visible */}
      <div>
        <div className={activeLang === 'hr' ? 'block' : 'hidden'}>
          <textarea
            {...register('terms_hr')}
            rows={14}
            className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ minHeight: 220 }}
          />
        </div>
        <div className={activeLang === 'en' ? 'block' : 'hidden'}>
          <textarea
            {...register('terms_en')}
            rows={12}
            className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ minHeight: 220 }}
          />
        </div>
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {currentCharCount} {t('common.characters') ?? 'characters'}
        </p>
      </div>

      {/* Save */}
      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="submit"
          disabled={isSubmitting || updateTerms.isPending || !initialData}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.primary, 'disabled:opacity-50')}
        >
          <FileText className="h-3.5 w-3.5" />
          {isSubmitting || updateTerms.isPending ? t('common.loading') : t('common.save')}
        </button>
      </div>

      {!initialData && (
        <p className="text-xs text-amber-600">{t('settings.saveCompanyFirst')}</p>
      )}
    </form>
  )
}
