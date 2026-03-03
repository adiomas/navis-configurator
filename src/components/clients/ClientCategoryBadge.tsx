import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { ds } from '@/lib/styles'
import type { ClientCategory } from '@/types'

interface ClientCategoryBadgeProps {
  category: ClientCategory
}

const categoryStyles: Record<ClientCategory, string> = {
  vip: 'bg-gold/20 text-gold-dark',
  regular: ds.badge.primary,
  prospect: ds.badge.muted,
}

export const ClientCategoryBadge = ({ category }: ClientCategoryBadgeProps) => {
  const { t } = useTranslation()

  return (
    <span
      className={cn(ds.badge.base, categoryStyles[category])}
    >
      {t(`clients.${category}`)}
    </span>
  )
}
