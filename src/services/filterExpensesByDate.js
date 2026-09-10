function toDateOnly(dateValue) {
  if (!dateValue) return null

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function filterExpensesByDate(expenses, startDate, endDate) {
  if (!Array.isArray(expenses)) {
    return []
  }

  const normalizedStart = toDateOnly(startDate)
  const normalizedEnd = toDateOnly(endDate)

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
