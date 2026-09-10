import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const formatCurrency = (value) => `₱${Number(value ?? 0).toFixed(2)}`

const FinanceTrendChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="chart-empty-state">
        <p>No chart data is available yet.</p>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 12, right: 18, left: 10, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#475569' }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#475569' }}
            tickFormatter={(value) => `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name]}
            labelFormatter={(label) => label}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actualExpenses"
            name="Actual Expenses"
            stroke="#E11D48"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="forecastExpenses"
            name="Forecast Expenses"
            stroke="#F59E0B"
            strokeWidth={2.5}
            strokeDasharray="6 6"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default FinanceTrendChart
