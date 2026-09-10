const DAY_IN_MS = 24 * 60 * 60 * 1000

const parseLocalDate = (value) => {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export const formatDateInput = (value) => {
  const date = parseLocalDate(value)

  if (!date) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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

  if (!start || !end || end < start) {
    return 0
  }

  return Math.round((end.getTime() - start.getTime()) / DAY_IN_MS) + 1
}

export const getBudgetRangeForPeriod = (periodType = '15_days', anchorDate = new Date()) => {
  const today = parseLocalDate(anchorDate) ?? new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  if (periodType === 'custom') {
    return {
      startDate: formatDateInput(today),
      endDate: formatDateInput(today),
      totalDays: 1,
    }
  }

  const periodDays = periodType === '7_days' ? 7 : periodType === '15_days' ? 15 : periodType === '30_days' ? 30 : 15
  const endDay = Math.min(periodDays, monthEnd.getDate())
  const startDate = monthStart
  const endDate = new Date(today.getFullYear(), today.getMonth(), endDay)

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
    totalDays: numberOfDaysInclusive(startDate, endDate),
  }
}

export const getActiveBudgetForCategory = ({ categoryId, budgets = [], today = new Date() }) => {
  if (!categoryId) {
    return null
  }

  const currentDate = parseLocalDate(today) ?? new Date()

  return budgets
    .filter((budget) => String(budget.categoryId ?? '') === String(categoryId))
    .find((budget) => {
      const startDate = parseLocalDate(budget.startDate)
      const endDate = parseLocalDate(budget.endDate)

      if (!startDate || !endDate) {
        return false
      }

      return currentDate >= startDate && currentDate <= endDate
    }) ?? null
}

const matchesCategory = (expenseCategory, categoryName, categoryId) => {
  if (!categoryName && !categoryId) {
    return true
  }

  const normalizedExpense = String(expenseCategory ?? '').trim()
  const normalizedCategory = String(categoryName ?? '').trim()
  const normalizedCategoryId = String(categoryId ?? '').trim()

  return normalizedExpense === normalizedCategory || normalizedExpense === normalizedCategoryId
}

export const calculateCategoryBudgetMetrics = ({
  category,
  amount = 0,
  periodType = '15_days',
  startDate,
  endDate,
  expenses = [],
  today = new Date(),
}) => {
  const categoryId = category?.id ?? ''
  const categoryName = category?.name ?? ''
  const totalBudget = Number(amount ?? 0)
  const selectedStart = parseLocalDate(startDate) || parseLocalDate(getBudgetRangeForPeriod(periodType, today).startDate)
  const selectedEnd = parseLocalDate(endDate) || parseLocalDate(getBudgetRangeForPeriod(periodType, today).endDate)
  const currentDate = parseLocalDate(today) ?? new Date()

  const spent = (expenses ?? []).reduce((sum, expense) => {
    const expenseDate = parseLocalDate(expense.date)
    if (!expenseDate) {
      return sum
    }

    if (expenseDate < selectedStart || expenseDate > selectedEnd) {
      return sum
    }

    if (!matchesCategory(expense.category, categoryName, categoryId)) {
      return sum
    }

    return sum + Number(expense.amount ?? 0)
  }, 0)

  const remainingBudget = totalBudget - spent
  const totalDays = numberOfDaysInclusive(selectedStart, selectedEnd)

  const isBeforeStart = currentDate < selectedStart
  const isAfterEnd = currentDate > selectedEnd

  const daysElapsed = isBeforeStart
    ? 0
    : isAfterEnd
      ? totalDays
      : numberOfDaysInclusive(selectedStart, currentDate)

  const remainingDays = isBeforeStart
    ? totalDays
    : isAfterEnd
      ? 0
      : numberOfDaysInclusive(currentDate, selectedEnd)

  const originalDailyAllowance = totalDays > 0 ? totalBudget / totalDays : 0
  const currentDailyAllowance = remainingDays > 0 && remainingBudget >= 0 ? remainingBudget / remainingDays : 0

  const percentageUsed = totalBudget > 0 ? (spent / totalBudget) * 100 : 0

  const todaysExpenses = (expenses ?? []).reduce((sum, expense) => {
    const expenseDate = parseLocalDate(expense.date)
    if (!expenseDate || expenseDate.getTime() !== currentDate.getTime()) {
      return sum
    }

    if (!matchesCategory(expense.category, categoryName, categoryId)) {
      return sum
    }

    return sum + Number(expense.amount ?? 0)
  }, 0)

  const recommendedDailySpend = remainingBudget >= 0 ? currentDailyAllowance : 0
  const dailyDifference = todaysExpenses - recommendedDailySpend
  const dailyStatus = recommendedDailySpend <= 0
    ? (todaysExpenses > 0 ? 'over' : 'on_track')
    : dailyDifference < 0
      ? 'under'
      : dailyDifference > 0
        ? 'over'
        : 'on_track'

  let status = 'active'

  if (remainingBudget < 0) {
    status = 'over_budget'
  } else if (isBeforeStart) {
    status = 'not_started'
  } else if (isAfterEnd) {
    status = 'completed'
  }

  return {
    categoryId,
    categoryName: categoryName || 'All Categories',
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
