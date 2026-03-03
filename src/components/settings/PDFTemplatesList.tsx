import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileText, FileSpreadsheet, Crown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePDFTemplates, useSetDefaultPDFTemplate } from '@/hooks/useSettings'

const STYLE_CONFIG: Record<string, { icon: typeof FileText; description: string }> = {
  compact: { icon: FileText, description: 'settings.compactDesc' },
  detailed: { icon: FileSpreadsheet, description: 'settings.detailedDesc' },
  luxury: { icon: Crown, description: 'settings.luxuryDesc' },
}

export const PDFTemplatesList = () => {
  const { t } = useTranslation()
  const { data: templates, isLoading } = usePDFTemplates()
  const setDefault = useSetDefaultPDFTemplate()

  const handleSetDefault = async (id: string) => {
    try {
      await setDefault.mutateAsync(id)
      toast.success(t('settings.templateSetSuccess'))
    } catch {
      toast.error(t('settings.templateSetError'))
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-md bg-muted/50" />
        ))}
      </div>
    )
  }

  if (!templates?.length) {
    return <p className="text-sm text-muted-foreground">{t('common.noResults')}</p>
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {templates.map((template) => {
        const config = STYLE_CONFIG[template.style] ?? STYLE_CONFIG.compact
        const Icon = config.icon

        return (
          <div
            key={template.id}
            className={cn(
              'relative flex flex-col rounded-md border p-2.5 transition-colors',
              template.is_default
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/30'
            )}
          >
            {template.is_default && (
              <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-medium text-white">
                <Check className="h-2 w-2" />
                {t('settings.defaultTemplate')}
              </span>
            )}

            <Icon className="mb-1 h-4 w-4 text-navy" />
            <h4 className="text-xs font-semibold text-navy">{template.name}</h4>
            <p className="mt-0.5 flex-1 text-[11px] leading-tight text-muted-foreground">{t(config.description)}</p>

            {!template.is_default && (
              <button
                type="button"
                onClick={() => handleSetDefault(template.id)}
                disabled={setDefault.isPending}
                className="mt-2 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
              >
                {t('settings.setDefault')}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
