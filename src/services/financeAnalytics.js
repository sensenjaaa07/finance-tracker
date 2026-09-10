const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

export const formatCurrency = (amount) => `₱${Number(amount ?? 0).toFixed(2)}`

export const monthKeyFromDate = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

export const dayKeyFromDate = (value) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const formatMonthLabel = (monthKey) => {
  if (!monthKey) {
    return '—'
  }

  const [year, month] = monthKey.split('-').map((value) => Number(value))

  if (!year || !month) {
    return monthKey
  }

  return monthFormatter.format(new Date(year, month - 1, 1))
}

export const buildMonthKeysForRange = (selectedMonth, rangeKey) => {
  if (!selectedMonth) {
    return []
  }

  if (rangeKey === 'month' || rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2') {
    return [selectedMonth]
  }

  const [year, month] = selectedMonth.split('-').map(Number)
  const anchor = new Date(year, month - 1, 1)

  let monthCount = 6

  if (rangeKey === '3m') {
    monthCount = 3
  } else if (rangeKey === '12m') {
    monthCount = 12
  } else if (rangeKey === 'year') {
    monthCount = 12
    const start = new Date(year, 0, 1)
    const months = []

    for (let index = 0; index < 12; index += 1) {
      const current = new Date(start.getFullYear(), start.getMonth() + index, 1)
      months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
    }

    return months
  }

  const months = []
  const start = new Date(anchor.getFullYear(), anchor.getMonth() - (monthCount - 1), 1)

  for (let index = 0; index < monthCount; index += 1) {
    const current = new Date(start.getFullYear(), start.getMonth() + index, 1)
    months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
  }

  return months
}

export const aggregateEntriesByMonth = (entries = []) => {
  const monthTotals = new Map()

  entries.forEach((entry) => {
    const monthKey = monthKeyFromDate(entry.date)

    if (!monthKey) {
      return
    }

    monthTotals.set(monthKey, (monthTotals.get(monthKey) ?? 0) + Number(entry.amount ?? 0))
  })

  return monthTotals
}

export const buildDayKeysForSelectedPeriod = (selectedMonth, rangeKey) => {
  if (!selectedMonth) {
    return []
  }

  const [year, month] = selectedMonth.split('-').map(Number)
  const monthLength = new Date(year, month, 0).getDate()
  let startDay = 1
  let endDay = monthLength

  if (rangeKey === 'fortnightly-1') {
    endDay = 15
  } else if (rangeKey === 'fortnightly-2') {
    startDay = 16
  }

  const dayKeys = []

  for (let day = startDay; day <= endDay; day += 1) {
    const keyDate = new Date(year, month - 1, day)
    dayKeys.push(`${keyDate.getFullYear()}-${String(keyDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
  }

  return dayKeys
}

export const aggregateEntriesByDay = (entries = []) => {
  const dayTotals = new Map()

  entries.forEach((entry) => {
    const dayKey = dayKeyFromDate(entry.date)

    if (!dayKey) {
      return
    }

    dayTotals.set(dayKey, (dayTotals.get(dayKey) ?? 0) + Number(entry.amount ?? 0))
  })

  return dayTotals
}

export const aggregateCategoryTotals = (entries = []) => {
  const categoryTotals = new Map()

  entries.forEach((entry) => {
    const category = String(entry.category ?? '').trim()

    if (!category) {
      return
    }

    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + Number(entry.amount ?? 0))
  })

  return categoryTotals
}

const matchesSelectedPeriod = (dateValue, selectedMonth, rangeKey) => {
  if (!selectedMonth || !dateValue) {
    return false
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  const monthKey = monthKeyFromDate(dateValue)

  if (monthKey !== selectedMonth) {
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

const sumEntriesBySelectedPeriod = (entries = [], selectedMonth, rangeKey) => {
  return entries.reduce((total, entry) => {
    if (!matchesSelectedPeriod(entry.date, selectedMonth, rangeKey)) {
      return total
    }

    return total + Number(entry.amount ?? 0)
  }, 0)
}

export const calculateExpenseForecast = (expenseEntries = [], monthKeys = [], selectedMonth, rangeKey = '6m') => {
  if (!monthKeys.length) {
    return new Map()
  }

  const historicalMonths = Array.from(aggregateEntriesByMonth(expenseEntries).keys()).sort()

  if (!historicalMonths.length) {
    return new Map(monthKeys.map((monthKey) => [monthKey, 0]))
  }

  const categoryTotalsByMonth = new Map()
  const categoryMonthlyCount = new Map()
  const categoryTotalSums = new Map()

  historicalMonths.forEach((monthKey) => {
    const entries = expenseEntries.filter((entry) => monthKeyFromDate(entry.date) === monthKey)
    const totals = aggregateCategoryTotals(entries)

    categoryTotalsByMonth.set(monthKey, totals)

    totals.forEach((totalAmount, category) => {
      categoryTotalSums.set(category, (categoryTotalSums.get(category) ?? 0) + totalAmount)
      categoryMonthlyCount.set(category, (categoryMonthlyCount.get(category) ?? 0) + 1)
    })
  })

  const categoryAverages = new Map()
  categoryTotalSums.forEach((totalAmount, category) => {
    const observedMonths = categoryMonthlyCount.get(category) ?? 1
    categoryAverages.set(category, totalAmount / observedMonths)
  })

  const overallAverage = historicalMonths.reduce((total, monthKey) => {
    const monthTotal = aggregateEntriesByMonth(expenseEntries).get(monthKey) ?? 0
    return total + monthTotal
  }, 0) / historicalMonths.length

  const forecastByMonth = new Map()

  monthKeys.forEach((monthKey) => {
    const categoryTotal = Array.from(categoryAverages.entries()).reduce((sum, [category, average]) => {
      const categoryMonthData = categoryTotalsByMonth.get(monthKey)
      const historicalAverage = categoryMonthData?.get(category) ?? average
      return sum + historicalAverage
    }, 0)

    const fallbackValue = categoryAverages.size > 0 ? categoryTotal : overallAverage
    forecastByMonth.set(monthKey, Number.isFinite(fallbackValue) ? fallbackValue : 0)
  })

  if (rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2') {
    const monthlyForecast = forecastByMonth.get(selectedMonth) ?? 0
    forecastByMonth.set(selectedMonth, monthlyForecast / 2)
  }

  return forecastByMonth
}

export const buildTrendData = ({ incomeEntries = [], expenseEntries = [], selectedMonth, rangeKey = '6m' }) => {
  if (rangeKey === 'month' || rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2') {
    const dayKeys = buildDayKeysForSelectedPeriod(selectedMonth, rangeKey)

    const filteredIncomeEntries = incomeEntries.filter((entry) => {
      const dayKey = dayKeyFromDate(entry.date)
      return dayKey && dayKeys.includes(dayKey)
    })

    const filteredExpenseEntries = expenseEntries.filter((entry) => {
      const dayKey = dayKeyFromDate(entry.date)
      return dayKey && dayKeys.includes(dayKey)
    })

    const incomeByDay = aggregateEntriesByDay(filteredIncomeEntries)
    const expenseByDay = aggregateEntriesByDay(filteredExpenseEntries)

    const historicalDayTotals = new Map()
    const historicalDayCounts = new Map()

    aggregateEntriesByDay(expenseEntries).forEach((total, dayKey) => {
      const dayNumber = Number(dayKey.split('-')[2])
      historicalDayTotals.set(dayNumber, (historicalDayTotals.get(dayNumber) ?? 0) + total)
      historicalDayCounts.set(dayNumber, (historicalDayCounts.get(dayNumber) ?? 0) + 1)
    })

    const historicalAverageByDay = new Map()
    historicalDayTotals.forEach((total, dayNumber) => {
      historicalAverageByDay.set(dayNumber, total / (historicalDayCounts.get(dayNumber) ?? 1))
    })

    const overallDailyAverage = Array.from(aggregateEntriesByDay(expenseEntries).values()).reduce((sum, total) => sum + total, 0)
      / Math.max(Array.from(aggregateEntriesByDay(expenseEntries).values()).length, 1)

    return dayKeys.map((dayKey) => {
      const date = new Date(`${dayKey}T12:00:00`)
      const dayNumber = date.getDate()
      const actualExpenses = expenseByDay.get(dayKey) ?? 0
      const forecastExpenses = actualExpenses > 0 ? 0 : (historicalAverageByDay.get(dayNumber) ?? overallDailyAverage)

      return {
        month: dayKey,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actualExpenses,
        forecastExpenses,
      }
    })
  }

  const monthKeys = buildMonthKeysForRange(selectedMonth, rangeKey)
  const incomeByMonth = aggregateEntriesByMonth(incomeEntries)
  const expenseByMonth = aggregateEntriesByMonth(expenseEntries)
  const forecastByMonth = calculateExpenseForecast(expenseEntries, monthKeys, selectedMonth, rangeKey)

  return monthKeys.map((monthKey) => {
    const actualExpenses = expenseByMonth.get(monthKey) ?? 0
    const label = formatMonthLabel(monthKey)

    return {
      month: monthKey,
      label,
      actualExpenses,
      forecastExpenses: forecastByMonth.get(monthKey) ?? 0,
    }
  })
}

export const buildCategoryBreakdownData = ({ expenseEntries = [], selectedMonth, rangeKey = '6m' }) => {
  const monthKeys = buildMonthKeysForRange(selectedMonth, rangeKey)
  const relevantExpenses = expenseEntries.filter((entry) => {
    if (rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2' || rangeKey === 'month') {
      return matchesSelectedPeriod(entry.date, selectedMonth, rangeKey)
    }

    const monthKey = monthKeyFromDate(entry.date)
    return monthKeys.includes(monthKey)
  })

  const totals = new Map()
  relevantExpenses.forEach((entry) => {
    const category = String(entry.category ?? '').trim()

    if (!category) {
      return
    }

    totals.set(category, (totals.get(category) ?? 0) + Number(entry.amount ?? 0))
  })

  const totalSpent = Array.from(totals.values()).reduce((sum, value) => sum + value, 0)

  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}
