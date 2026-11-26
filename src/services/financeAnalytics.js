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

export const buildMonthKeysForRange = (selectedMonth, rangeKey, earliestMonth = selectedMonth) => {
  if (!selectedMonth) {
    return []
  }

  if (rangeKey === 'month' || rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2') {
    return [selectedMonth]
  }

  const [year, month] = selectedMonth.split('-').map(Number)
  const anchor = new Date(year, month - 1, 1)

  if (rangeKey === 'all') {
    const [startYear, startMonth] = (earliestMonth || selectedMonth).split('-').map(Number)
    const start = new Date(startYear, startMonth - 1, 1)
    const monthCount = Math.max(1, (anchor.getFullYear() - start.getFullYear()) * 12 + anchor.getMonth() - start.getMonth() + 1)
    return Array.from({ length: monthCount }, (_, index) => {
      const current = new Date(start.getFullYear(), start.getMonth() + index, 1)
      return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
    })
  }

  let monthCount = 6

  if (rangeKey === '3m') {
    monthCount = 3
  } else if (rangeKey === '12m') {
    monthCount = 12
  } else if (rangeKey === 'year') {
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
    const category = String(entry.category ?? '').trim() || 'Uncategorized'

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

const getMonthDate = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

const shiftMonthKey = (monthKey, offset) => {
  const date = getMonthDate(monthKey)
  date.setMonth(date.getMonth() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Forecasts use the three calendar months before each plotted month.
// Months without transactions are deliberately included as zero-spend months.
export const calculateExpenseForecast = (expenseEntries = [], monthKeys = []) => {
  const totals = aggregateEntriesByMonth(expenseEntries)
  const forecastByMonth = new Map()

  monthKeys.forEach((monthKey) => {
    const previousMonths = [-3, -2, -1].map((offset) => shiftMonthKey(monthKey, offset))
    const average = previousMonths.reduce((sum, key) => sum + (totals.get(key) ?? 0), 0) / previousMonths.length
    forecastByMonth.set(monthKey, average)
  })

  return forecastByMonth
}

export const buildTrendData = ({ incomeEntries = [], expenseEntries = [], selectedMonth, rangeKey = '6m', earliestMonth = selectedMonth }) => {
  if (rangeKey === 'month' || rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2') {
    const dayKeys = buildDayKeysForSelectedPeriod(selectedMonth, rangeKey)
    const filteredIncomeEntries = incomeEntries.filter((entry) => dayKeys.includes(dayKeyFromDate(entry.date)))
    const filteredExpenseEntries = expenseEntries.filter((entry) => dayKeys.includes(dayKeyFromDate(entry.date)))
    const incomeByDay = aggregateEntriesByDay(filteredIncomeEntries)
    const expenseByDay = aggregateEntriesByDay(filteredExpenseEntries)

    const priorMonthKeys = Array.from({ length: 6 }, (_, index) => shiftMonthKey(selectedMonth, index - 6))
    const priorMonthCountByDay = new Map()
    const priorSpendByDay = new Map()
    priorMonthKeys.forEach((monthKey) => {
      const daysInMonth = new Date(getMonthDate(monthKey).getFullYear(), getMonthDate(monthKey).getMonth() + 1, 0).getDate()
      const monthEntries = expenseEntries.filter((entry) => monthKeyFromDate(entry.date) === monthKey)
      const totals = aggregateEntriesByDay(monthEntries)
      for (let day = 1; day <= daysInMonth; day += 1) {
        priorMonthCountByDay.set(day, (priorMonthCountByDay.get(day) ?? 0) + 1)
        const key = `${monthKey}-${String(day).padStart(2, '0')}`
        priorSpendByDay.set(day, (priorSpendByDay.get(day) ?? 0) + (totals.get(key) ?? 0))
      }
    })

    return dayKeys.map((dayKey) => {
      const date = new Date(`${dayKey}T12:00:00`)
      const dayNumber = date.getDate()
      const count = priorMonthCountByDay.get(dayNumber) ?? 0
      const forecastExpenses = count ? (priorSpendByDay.get(dayNumber) ?? 0) / count : 0
      return {
        month: dayKey,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        income: incomeByDay.get(dayKey) ?? 0,
        actualExpenses: expenseByDay.get(dayKey) ?? 0,
        forecastExpenses,
      }
    })
  }

  const monthKeys = buildMonthKeysForRange(selectedMonth, rangeKey, earliestMonth)
  const incomeByMonth = aggregateEntriesByMonth(incomeEntries)
  const expenseByMonth = aggregateEntriesByMonth(expenseEntries)
  const forecastByMonth = calculateExpenseForecast(expenseEntries, monthKeys)

  return monthKeys.map((monthKey) => ({
    month: monthKey,
    label: formatMonthLabel(monthKey),
    income: incomeByMonth.get(monthKey) ?? 0,
    actualExpenses: expenseByMonth.get(monthKey) ?? 0,
    forecastExpenses: forecastByMonth.get(monthKey) ?? 0,
  }))
}

export const buildCategoryBreakdownData = ({ expenseEntries = [], selectedMonth, rangeKey = '6m', earliestMonth = selectedMonth }) => {
  const monthKeys = buildMonthKeysForRange(selectedMonth, rangeKey, earliestMonth)
  const relevantExpenses = expenseEntries.filter((entry) => {
    if (rangeKey === 'fortnightly-1' || rangeKey === 'fortnightly-2' || rangeKey === 'month') {
      return matchesSelectedPeriod(entry.date, selectedMonth, rangeKey)
    }

    const monthKey = monthKeyFromDate(entry.date)
    return monthKeys.includes(monthKey)
  })

  const totals = new Map()
  relevantExpenses.forEach((entry) => {
    const category = String(entry.category ?? '').trim() || 'Uncategorized'

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
