import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Send, Check, X, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuoteStatus } from '@/types'

interface QuoteActionsProps {
  quoteId: string
  status: QuoteStatus
  onStatusChange: (quoteId: string, newStatus: QuoteStatus) => void
  isLoading?: boolean
  canEdit?: boolean
}

const statusTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent'],
  sent: ['accepted', 'rejected'],
  accepted: ['draft'],
  rejected: ['draft'],
}

const transitionConfig: Record<QuoteStatus, { icon: typeof Send; className: string }> = {
  sent: { icon: Send, className: 'hover:bg-primary/10 hover:text-primary' },
  accepted: { icon: Check, className: 'hover:bg-emerald-50 hover:text-emerald-600' },
  rejected: { icon: X, className: 'hover:bg-red-50 hover:text-red-600' },
  draft: { icon: RotateCcw, className: 'hover:bg-muted hover:text-foreground' },
}

export const QuoteActions = ({ quoteId, status, onStatusChange, isLoading, canEdit = true }: QuoteActionsProps) => {
  const { t } = useTranslation()
  const transitions = statusTransitions[status]

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        to={`/quotes/${quoteId}`}
        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:p-2"
        title={t('quotes.view')}
      >
        <Eye className="h-4 w-4" />
      </Link>
      {canEdit && transitions.map((target) => {
        const config = transitionConfig[target]
        const Icon = config.icon
        return (
          <button
            key={target}
            type="button"
            disabled={isLoading}
            onClick={() => onStatusChange(quoteId, target)}
            className={cn(
              'hidden rounded-lg p-2 text-muted-foreground transition-colors disabled:opacity-50 sm:inline-flex',
              config.className
            )}
            title={t(`quotes.${target}`)}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
