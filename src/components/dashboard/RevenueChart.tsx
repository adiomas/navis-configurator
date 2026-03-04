import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatPrice } from '@/lib/formatters'
import type { RevenueByMonth } from '@/hooks/useDashboard'

interface RevenueChartProps {
  data: RevenueByMonth[]
  isLoading: boolean
}

export const RevenueChart = ({ data, isLoading }: RevenueChartProps) => {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">
        {t('dashboard.revenueByMonth')}
      </h3>

      {isLoading ? (
        <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
      ) : data.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
          {t('dashboard.noData')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ea3f2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2ea3f2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
                if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`
                return `€${v}`
              }}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip
              formatter={(value: number) => [formatPrice(value), t('dashboard.totalRevenue')]}
              contentStyle={{
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#2ea3f2"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default RevenueChart
