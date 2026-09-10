import '../assets/styles/Dashboard.css'
import Header from '../components/Header'
import FinanceTrendChart from '../components/charts/FinanceTrendChart.jsx'
import CategoryBreakdownChart from '../components/charts/CategoryBreakdownChart.jsx'
import { buildCategoryBreakdownData, buildTrendData, formatCurrency, monthKeyFromDate } from '../services/financeAnalytics.js'
import filterExpensesByDate from '../services/filterExpensesByDate.js'
import { useMemo, useState } from 'react'

const Dashboard = ({ expenseEntries, incomeEntries, categoryEntries, onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange }) => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [rangeKey, setRangeKey] = useState('6m')
  const [visibleMetrics, setVisibleMetrics] = useState({
    spent: true,
    cashLeft: true,
    allocated: false,
    availableToAllocate: true,
  })
  const [metricOrder] = useState([
    'cashLeft',
    'spent',
    'availableToAllocate',
    'allocated',
  ])

  const monthStart = selectedMonth ? `${selectedMonth}-01` : ''
  const monthEnd = selectedMonth
    ? new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).toISOString().slice(0, 10)
    : ''

  const matchesRange = (dateValue) => {
    if (!selectedMonth || !dateValue) {
      return false
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return false
    }

    if (monthKeyFromDate(dateValue) !== selectedMonth) {
      return false
    }

    if (rangeKey === 'month' || !rangeKey) {
      return true
    }

    const day = date.getDate()

    if (rangeKey === 'fortnightly-1') {
      return day >= 1 && day <= 15
    }

    if (rangeKey === 'fortnightly-2') {
      return day >= 16
    }

    return true
  }

  const rangeFilteredExpenses = useMemo(() => {
    if (rangeKey === 'month' || rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2') {
      return expenseEntries.filter((entry) => matchesRange(entry.date))
    }

    return filterExpensesByDate(expenseEntries, monthStart, monthEnd)
  }, [expenseEntries, monthEnd, monthStart, rangeKey, selectedMonth])

  const rangeFilteredIncome = useMemo(() => {
    if (rangeKey === 'month' || rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2') {
      return incomeEntries.filter((entry) => matchesRange(entry.date))
    }

    return filterExpensesByDate(incomeEntries, monthStart, monthEnd)
  }, [incomeEntries, monthEnd, monthStart, rangeKey, selectedMonth])

  const visibleExpenses = rangeFilteredExpenses
  const visibleIncome = rangeFilteredIncome

  const filteredCategories = selectedCategory === 'all'
    ? categoryEntries
    : categoryEntries.filter((category) => category.name === selectedCategory)

  const selectedCategoryEntry = selectedCategory === 'all'
    ? null
    : categoryEntries.find((category) => category.name === selectedCategory) ?? null

  const totalIncome = visibleIncome.reduce((total, entry) => total + entry.amount, 0)
  const totalAllocated = selectedCategory === 'all'
    ? categoryEntries.reduce((total, entry) => total + entry.amount, 0)
    : (selectedCategoryEntry?.amount ?? 0)
  const totalSpent = selectedCategory === 'all'
    ? visibleExpenses.reduce((total, entry) => total + entry.amount, 0)
    : visibleExpenses
      .filter((expense) => expense.category === selectedCategory)
      .reduce((total, entry) => total + entry.amount, 0)
  const totalRemaining = selectedCategory === 'all'
    ? totalIncome - totalSpent
    : (selectedCategoryEntry ? selectedCategoryEntry.amount - totalSpent : 0)
  const selectedCategoryLabel = selectedCategory === 'all' ? 'All categories' : selectedCategory
  const totalAvailableToAllocate = selectedCategory === 'all'
    ? totalIncome - totalAllocated
    : totalIncome - totalAllocated

  const toggleMetric = (metricKey) => {
    setVisibleMetrics((previousState) => ({
      ...previousState,
      [metricKey]: !previousState[metricKey],
    }))
  }

  const metricCards = [
    { key: 'allocated', label: 'Allocated', value: formatCurrency(totalAllocated) },
    { key: 'availableToAllocate', label: 'Available to allocate', value: formatCurrency(totalAvailableToAllocate) },
    { key: 'spent', label: 'Spent', value: formatCurrency(totalSpent) },
    { key: 'cashLeft', label: 'Cash left', value: formatCurrency(totalRemaining), negative: totalRemaining < 0 },
  ]
  const orderedMetricButtons = [...metricCards]
    .sort((a, b) => metricOrder.indexOf(a.key) - metricOrder.indexOf(b.key))

  const trendData = useMemo(() => buildTrendData({
    incomeEntries: rangeFilteredIncome,
    expenseEntries: rangeFilteredExpenses,
    selectedMonth,
    rangeKey,
  }), [rangeFilteredExpenses, rangeFilteredIncome, rangeKey, selectedMonth])

  const categoryBreakdownData = useMemo(() => buildCategoryBreakdownData({
    expenseEntries: rangeFilteredExpenses,
    selectedMonth,
    rangeKey,
  }), [rangeFilteredExpenses, rangeKey, selectedMonth])

  const totalActualExpense = trendData.reduce((total, entry) => total + Number(entry.actualExpenses ?? 0), 0)
  const totalForecastExpense = trendData.reduce((total, entry) => total + Number(entry.forecastExpenses ?? 0), 0)

  return (
    <section>
      <Header
        pageTitle={"Overview"}
        onOpenAddForm={onOpenAddForm}
        showMonthFilter
        monthValue={selectedMonth}
        onMonthChange={onMonthChange}
        budgetCycle={budgetCycle}
        onBudgetCycleChange={onBudgetCycleChange}
      />
      <div className="dashboard-filter-bar">
        <div className="dashboard-filter-group">
          <label htmlFor="dashboard-category-filter">View</label>
          <select
            id="dashboard-category-filter"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {categoryEntries.map((category) => (
              <option key={category.id} value={category.name}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="dashboard-filter-group dashboard-visibility-group">
          <span>Visible metrics</span>
          <div className="dashboard-visibility-toggle-group">
            {orderedMetricButtons.map((metric) => (
              <button
                key={metric.key}
                type="button"
                className={`metric-toggle ${visibleMetrics[metric.key] ? 'is-visible' : 'is-hidden'}`}
                onClick={() => toggleMetric(metric.key)}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>
        <div className="dashboard-filter-group dashboard-range-group">
          <label htmlFor="dashboard-range-filter">Range</label>
          <select
            id="dashboard-range-filter"
            value={rangeKey}
            onChange={(event) => setRangeKey(event.target.value)}
          >
            <option value="month">This month</option>
            <option value="fortnightly-1">1–15</option>
            <option value="fortnightly-2">16–end</option>
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="year">This year</option>
          </select>
        </div>
      </div>
      <div className="dashboard-summary">
        {metricCards
          .filter((metric) => visibleMetrics[metric.key])
          .sort((a, b) => metricOrder.indexOf(a.key) - metricOrder.indexOf(b.key))
          .map((metric) => (
            <div className="summary-card" key={metric.key}>
              <p>{metric.label}</p>
              <strong className={metric.negative ? 'amount-negative' : ''}>{metric.value}</strong>
            </div>
          ))}
      </div>
      <div className="analytics-grid">
        <div className="analytics-card analytics-card-wide">
          <div className="chart-header">
            <div>
              <p className="chart-eyebrow">Financial performance</p>
              <h2>Actual Expenses vs Forecast Expenses</h2>
            </div>
            <div className="chart-summary-inline">
              <span>Actual expenses</span>
              <strong>{formatCurrency(totalActualExpense)}</strong>
            </div>
          </div>
          <FinanceTrendChart data={trendData} />
        </div>

        <div className="analytics-card">
          <div className="chart-header">
            <div>
              <p className="chart-eyebrow">Spending mix</p>
              <h2>Expenses by Category</h2>
            </div>
            <div className="chart-summary-inline">
              <span>Forecast</span>
              <strong>{formatCurrency(totalForecastExpense)}</strong>
            </div>
          </div>
          <CategoryBreakdownChart data={categoryBreakdownData} />
        </div>
      </div>

      <div className="dashboard-section">
        <h2>{selectedCategory === 'all' ? 'Budget left by category' : `${selectedCategoryLabel} breakdown`}</h2>
        {filteredCategories.length === 0 ? (
          <p className="empty-state">
            {selectedCategory === 'all'
              ? 'Create a budget category to start tracking what is left.'
              : `No budget category named ${selectedCategoryLabel} has been created yet.`}
          </p>
        ) : (
          <div className="entry-list">
            {filteredCategories.map((category) => {
              const spent = visibleExpenses
                .filter((expense) => expense.category === category.name)
                .reduce((total, expense) => total + expense.amount, 0)
              const remaining = category.amount - spent
              const isSelected = selectedCategory === category.name

              return (
                <div
                  className={`entry-list-item info-card ${isSelected ? 'is-selected' : ''}`}
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedCategory(category.name)
                    }
                  }}
                >
                  <div className="info-card-header">
                    <p className="info-card-label">Category</p>
                    <span className="budget-card-badge">Open</span>
                  </div>
                  <h3>{category.name}</h3>
                  <div className="budget-card-metrics">
                    <div>
                      <span className="budget-card-label">Left</span>
                      <p className={remaining < 0 ? 'amount-negative' : ''}>{formatCurrency(remaining)}</p>
                    </div>
                    <div>
                      <span className="budget-card-label">Spent</span>
                      <p>{formatCurrency(spent)} / {formatCurrency(category.amount)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Dashboard