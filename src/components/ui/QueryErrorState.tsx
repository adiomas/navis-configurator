import { useTranslation } from 'react-i18next'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'

interface QueryErrorStateProps {
  onRetry?: () => void
}

export function QueryErrorState({ onRetry }: QueryErrorStateProps) {
  const { t } = useTranslation()

  return (
    <div className={ds.empty.container}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <p className={ds.empty.description}>{t('common.loadError')}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={cn(ds.btn.base, ds.btn.md, ds.btn.secondary, 'mt-4')}
        >
          <RefreshCw className="h-4 w-4" />
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
