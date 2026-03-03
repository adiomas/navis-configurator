import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { TimeRange } from '@/hooks/useDashboard'

interface TimeRangeFilterProps {
  value: TimeRange
  onChange: (value: TimeRange) => void
}

const options: TimeRange[] = ['30d', '90d', '1y', 'all']

export const TimeRangeFilter = ({ value, onChange }: TimeRangeFilterProps) => {
  const { t } = useTranslation()

  const labels: Record<TimeRange, string> = {
    '30d': t('dashboard.filter30d'),
    '90d': t('dashboard.filter90d'),
    '1y': t('dashboard.filter1y'),
    all: t('dashboard.filterAll'),
  }

  return (
    <div className="inline-flex rounded-md border border-border bg-white">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            'px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md',
            value === option
              ? 'bg-navy text-white'
              : 'text-navy hover:bg-muted'
          )}
        >
          {labels[option]}
        </button>
      ))}
    </div>
  )
}
