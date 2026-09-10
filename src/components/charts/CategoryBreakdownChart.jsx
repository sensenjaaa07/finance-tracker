import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const chartColors = ['#10B981', '#0EA5E9', '#F59E0B', '#8B5CF6', '#F43F5E', '#14B8A6', '#6366F1', '#FB7185']

const formatCurrency = (value) => `₱${Number(value ?? 0).toFixed(2)}`

const CategoryBreakdownChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="chart-empty-state">
        <p>No expense categories have been recorded yet.</p>
      </div>
    )
  }

  const totalAmount = data.reduce((sum, category) => sum + category.amount, 0)

  const tooltipFormatter = (value, name, item) => {
    const category = item?.payload?.category ?? 'Category'
    const percentage = item?.payload?.percentage ?? 0
    return [`${formatCurrency(value)} • ${percentage.toFixed(1)}%`, category]
  }

  if (data.length <= 6) {
    return (
      <div className="chart-container chart-container-donut">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="category-legend">
          {data.map((entry, index) => (
            <div key={entry.category} className="category-legend-item">
              <span className="category-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
              <span>{entry.category}</span>
              <strong>{formatCurrency(entry.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 18, left: 18, bottom: 10 }}>
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#475569' }} tickFormatter={(value) => `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} width={120} tick={{ fontSize: 12, fill: '#475569' }} />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
            }}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="category-summary">
        <span>Total expenses</span>
        <strong>{formatCurrency(totalAmount)}</strong>
      </div>
    </div>
  )
}

export default CategoryBreakdownChart
