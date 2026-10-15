function toDateOnly(dateValue) {
  if (!dateValue) return null

  // Parse YYYY-MM-DD as a local calendar date to avoid timezone shifts.
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function filterExpensesByDate(entries, startDate, endDate) {
  if (!Array.isArray(entries)) return []

  // The caller owns the active date range. Do not override it with a global
  // localStorage pay period, because that makes every page use the same range.
  const normalizedStart = toDateOnly(startDate)
  const normalizedEnd = toDateOnly(endDate)

  return entries.filter((entry) => {
    const entryDate = toDateOnly(entry.date)
    if (!entryDate) return false
    if (normalizedStart && entryDate < normalizedStart) return false
    if (normalizedEnd && entryDate > normalizedEnd) return false
    return true
  })
}

export default filterExpensesByDate
