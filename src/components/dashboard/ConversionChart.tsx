import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts'
import type { StatusCounts } from '@/hooks/useDashboard'

interface ConversionChartProps {
  statusCounts: StatusCounts | undefined
  isLoading: boolean
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  sent: '#2ea3f2',
  accepted: '#10b981',
  rejected: '#ef4444',
}

export const ConversionChart = ({ statusCounts, isLoading }: ConversionChartProps) => {
  const { t } = useTranslation()

  const data = statusCounts
    ? [
        { name: t('quotes.draft'), value: statusCounts.draft, key: 'draft' },
        { name: t('quotes.sent'), value: statusCounts.sent, key: 'sent' },
        { name: t('quotes.accepted'), value: statusCounts.accepted, key: 'accepted' },
        { name: t('quotes.rejected'), value: statusCounts.rejected, key: 'rejected' },
      ].filter(d => d.value > 0)
    : []

  const total = statusCounts
    ? statusCounts.draft + statusCounts.sent + statusCounts.accepted + statusCounts.rejected
    : 0

  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">
        {t('dashboard.statusDistribution')}
      </h3>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-36 w-36 animate-pulse rounded-full bg-muted" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
          {t('dashboard.noData')}
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  fontSize: 11,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={6}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ marginBottom: 32 }}>
            <div className="text-center">
              <p className="text-xl font-semibold text-navy">{total}</p>
              <p className="text-[10px] text-muted-foreground">{t('dashboard.totalQuotes')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversionChart
