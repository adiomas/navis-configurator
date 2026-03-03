import { useTranslation } from 'react-i18next'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatPrice } from '@/lib/formatters'
import type { MonthlyTrendItem } from '@/hooks/useDashboard'

interface MonthlyTrendProps {
  data: MonthlyTrendItem[]
  isLoading: boolean
}

export const MonthlyTrend = ({ data, isLoading }: MonthlyTrendProps) => {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-border/60 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-navy">
        {t('dashboard.monthlyTrend')}
      </h3>

      {isLoading ? (
        <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
      ) : data.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
          {t('dashboard.noData')}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: '#374151' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v: number) => {
                if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(1)}M`
                if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`
                return `€${v}`
              }}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 6,
                border: '1px solid #e5e7eb',
                fontSize: 11,
              }}
              formatter={(value: number, name: string) => {
                if (name === t('dashboard.revenue')) return [formatPrice(value), name]
                return [value, name]
              }}
            />
            <Legend
              verticalAlign="top"
              iconType="rect"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
            />
            <Bar
              yAxisId="left"
              dataKey="quoteCount"
              name={t('dashboard.quoteCount')}
              fill="#2ea3f2"
              radius={[3, 3, 0, 0]}
              barSize={16}
            />
            <Bar
              yAxisId="right"
              dataKey="revenue"
              name={t('dashboard.revenue')}
              fill="#c9a961"
              radius={[3, 3, 0, 0]}
              barSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default MonthlyTrend
