import '../assets/styles/Dashboard.css'
import Header from '../components/Header'
import filterExpensesByDate from '../services/filterExpensesByDate.js'
import { useState } from 'react'

const formatCurrency = (amount) => `₱${amount.toFixed(2)}`

const Dashboard = ({ expenseEntries, incomeEntries, categoryEntries, onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange }) => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [visibleMetrics, setVisibleMetrics] = useState({
    income: false,
    spent: true,
    cashLeft: true,
    allocated: false,
    availableToAllocate: true,
  })
  const [metricOrder, setMetricOrder] = useState([
    'cashLeft',
    'spent',
    'availableToAllocate',
    'income',
    'allocated',
  ])

  const monthStart = selectedMonth ? `${selectedMonth}-01` : ''
  const monthEnd = selectedMonth
    ? new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).toISOString().slice(0, 10)
    : ''

  const visibleExpenses = filterExpensesByDate(expenseEntries, monthStart, monthEnd)
  const visibleIncome = filterExpensesByDate(incomeEntries, monthStart, monthEnd)

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
    { key: 'income', label: 'Income', value: formatCurrency(totalIncome) },
    { key: 'allocated', label: 'Allocated', value: formatCurrency(totalAllocated) },
    { key: 'availableToAllocate', label: 'Available to allocate', value: formatCurrency(totalAvailableToAllocate) },
    { key: 'spent', label: 'Spent', value: formatCurrency(totalSpent) },
    { key: 'cashLeft', label: 'Cash left', value: formatCurrency(totalRemaining), negative: totalRemaining < 0 },
  ]
  const orderedMetricButtons = [...metricCards]
    .sort((a, b) => metricOrder.indexOf(a.key) - metricOrder.indexOf(b.key))

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