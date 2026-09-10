const DAY_IN_MS = 24 * 60 * 60 * 1000

const parseLocalDate = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const formatDateInput = (value) => {
  const date = parseLocalDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const addDays = (value, dayCount) => {
  const baseDate = parseLocalDate(value) ?? new Date()
  const nextDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
  nextDate.setDate(nextDate.getDate() + dayCount)
  return nextDate
}

export const numberOfDaysInclusive = (startDate, endDate) => {
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  if (!start || !end || end < start) return 0
  return Math.round((end.getTime() - start.getTime()) / DAY_IN_MS) + 1
}

export const getBudgetRangeForPeriod = (periodType = '15_days', anchorDate = new Date(), customStartDate = '', customEndDate = '') => {
  const today = parseLocalDate(anchorDate) ?? new Date()

  if (periodType === 'custom') {
    const customStart = parseLocalDate(customStartDate) ?? today
    const customEnd = parseLocalDate(customEndDate) ?? customStart
    const safeEnd = customEnd < customStart ? customStart : customEnd
    return { startDate: formatDateInput(customStart), endDate: formatDateInput(safeEnd), totalDays: numberOfDaysInclusive(customStart, safeEnd) }
  }

  const periodDays = periodType === '7_days' ? 7 : periodType === '30_days' ? 30 : 15
  return { startDate: formatDateInput(today), endDate: formatDateInput(addDays(today, periodDays - 1)), totalDays: periodDays }
}

export const getActiveBudgetForCategory = ({ categoryId, budgets = [], today = new Date() }) => {
  if (!categoryId) return null
  const currentDate = parseLocalDate(today) ?? new Date()
  return budgets
    .filter((budget) => String(budget.categoryId ?? '') === String(categoryId))
    .filter((budget) => {
      const startDate = parseLocalDate(budget.startDate)
      const endDate = parseLocalDate(budget.endDate)
      return startDate && endDate && currentDate >= startDate && currentDate <= endDate
    })
    .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())[0] ?? null
}

const matchesCategory = (expenseCategory, categoryName, categoryId) => {
  if (!categoryName && !categoryId) return true
  const normalizedExpense = String(expenseCategory ?? '').trim()
  return normalizedExpense === String(categoryName ?? '').trim() || normalizedExpense === String(categoryId ?? '').trim()
}

export const calculateCategoryBudgetMetrics = ({ category, amount = 0, periodType = '15_days', startDate, endDate, expenses = [], today = new Date() }) => {
  const categoryId = category?.id ?? ''
  const categoryName = category?.name ?? ''
  const totalBudget = Number(amount ?? 0)
  const fallbackRange = getBudgetRangeForPeriod(periodType, today)
  const selectedStart = parseLocalDate(startDate) || parseLocalDate(fallbackRange.startDate)
  const selectedEnd = parseLocalDate(endDate) || parseLocalDate(fallbackRange.endDate)
  const currentDate = parseLocalDate(today) ?? new Date()

  const spent = expenses.reduce((sum, expense) => {
    const expenseDate = parseLocalDate(expense.date)
    if (!expenseDate || expenseDate < selectedStart || expenseDate > selectedEnd || !matchesCategory(expense.category, categoryName, categoryId)) return sum
    return sum + Number(expense.amount ?? 0)
  }, 0)

  const remainingBudget = totalBudget - spent
  const totalDays = numberOfDaysInclusive(selectedStart, selectedEnd)
  const isBeforeStart = currentDate < selectedStart
  const isAfterEnd = currentDate > selectedEnd
  const daysElapsed = isBeforeStart ? 0 : isAfterEnd ? totalDays : numberOfDaysInclusive(selectedStart, currentDate)
  const remainingDays = isBeforeStart ? totalDays : isAfterEnd ? 0 : numberOfDaysInclusive(currentDate, selectedEnd)
  const originalDailyAllowance = totalDays > 0 ? totalBudget / totalDays : 0
  const currentDailyAllowance = remainingDays > 0 && remainingBudget >= 0 ? remainingBudget / remainingDays : 0
  const percentageUsed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0

  const todaysExpenses = expenses.reduce((sum, expense) => {
    const expenseDate = parseLocalDate(expense.date)
    if (!expenseDate || expenseDate.getTime() !== currentDate.getTime() || !matchesCategory(expense.category, categoryName, categoryId)) return sum
    return sum + Number(expense.amount ?? 0)
  }, 0)

  const recommendedDailySpend = remainingBudget >= 0 ? currentDailyAllowance : 0
  const dailyDifference = todaysExpenses - recommendedDailySpend
  const dailyStatus = recommendedDailySpend <= 0 ? (todaysExpenses > 0 ? 'over' : 'on_track') : dailyDifference < 0 ? 'under' : dailyDifference > 0 ? 'over' : 'on_track'

  let status = 'active'
  if (remainingBudget < 0) status = 'over_budget'
  else if (isBeforeStart) status = 'not_started'
  else if (isAfterEnd) status = 'completed'

  return {
    categoryId,
    categoryName: categoryName || 'All Categories',
    startDate: formatDateInput(selectedStart),
    endDate: formatDateInput(selectedEnd),
    spent,
    remainingBudget,
    totalDays,
    daysElapsed,
    remainingDays,
    originalDailyAllowance,
    currentDailyAllowance: remainingBudget < 0 ? 0 : currentDailyAllowance,
    percentageUsed,
    todaysExpenses,
    dailyStatus,
    status,
    isBeforeStart,
    isAfterEnd,
    budgetAmount: totalBudget,
    recommendedDailySpend,
    dailyDifference,
    hasBudget: totalBudget > 0,
  }
}
