import { useTranslation } from 'react-i18next'
import { QuoteStatusBadge } from './QuoteStatusBadge'
import { formatDateTime } from '@/lib/formatters'
import type { QuoteStatusHistory } from '@/types'

interface StatusHistoryEntry extends QuoteStatusHistory {
  changed_by_profile: { id: string; full_name: string | null } | null
}

interface QuoteTimelineProps {
  statusHistory: StatusHistoryEntry[]
}

export const QuoteTimeline = ({ statusHistory }: QuoteTimelineProps) => {
  const { t } = useTranslation()

  if (statusHistory.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t('quotes.noHistory')}</p>
    )
  }

  return (
    <div className="relative space-y-0">
      {statusHistory.map((entry, index) => {
        const isLast = index === statusHistory.length - 1
        return (
          <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
            )}
            {/* Dot */}
            <div className="relative z-10 mt-1 h-[15px] w-[15px] flex-shrink-0 rounded-full border-2 border-primary bg-white" />
            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {entry.old_status && (
                  <>
                    <QuoteStatusBadge status={entry.old_status as 'draft' | 'sent' | 'accepted' | 'rejected'} />
                    <span className="text-xs text-muted-foreground">→</span>
                  </>
                )}
                <QuoteStatusBadge status={entry.new_status as 'draft' | 'sent' | 'accepted' | 'rejected'} />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDateTime(entry.created_at)}</span>
                {entry.changed_by_profile?.full_name && (
                  <>
                    <span>·</span>
                    <span>{entry.changed_by_profile.full_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
