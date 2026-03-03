import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import type { QuoteStatus } from '@/types'

interface QuoteStatusBadgeProps {
  status: QuoteStatus
}

const statusStyles: Record<QuoteStatus, string> = {
  draft: ds.badge.muted,
  sent: ds.badge.primary,
  accepted: ds.badge.success,
  rejected: ds.badge.danger,
}

export const QuoteStatusBadge = ({ status }: QuoteStatusBadgeProps) => {
  const { t } = useTranslation()

  return (
    <span
      className={cn(ds.badge.base, statusStyles[status])}
    >
      {t(`quotes.${status}`)}
    </span>
  )
}
