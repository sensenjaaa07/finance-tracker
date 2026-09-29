function toDateOnly(dateValue) {
  if (!dateValue) return null

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function getCustomPayPeriod() {
  if (typeof window === 'undefined') return null

  try {
    const saved = JSON.parse(window.localStorage.getItem('finance-tracker-custom-pay-period') || 'null')
    if (!saved?.start || !saved?.end || saved.start > saved.end) return null
    return saved
  } catch {
    return null
  }
}

function filterExpensesByDate(expenses, startDate, endDate) {
  if (!Array.isArray(expenses)) {
    return []
  }

  const customPayPeriod = getCustomPayPeriod()
  const normalizedStart = toDateOnly(customPayPeriod?.start || startDate)
  const normalizedEnd = toDateOnly(customPayPeriod?.end || endDate)

  return expenses.filter((expense) => {
    const expenseDate = toDateOnly(expense.date)
    if (!expenseDate) return false

    if (normalizedStart && expenseDate < normalizedStart) {
      return false
    }

    if (normalizedEnd && expenseDate > normalizedEnd) {
      return false
    }

    return true
  })
}

export default filterExpensesByDate
