import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTrendData, calculateExpenseForecast } from './financeAnalytics.js'

test('monthly forecast averages the previous three calendar months including zero-spend months', () => {
  const expenses = [
    { category: 'Food', amount: 100, date: '2026-04-10' },
    { category: 'Food', amount: 300, date: '2026-06-10' },
  ]

  const forecast = calculateExpenseForecast(expenses, ['2026-07'])
  assert.equal(forecast.get('2026-07'), 400 / 3)
})

test('daily forecast uses prior months and does not disappear on days with actual expenses', () => {
  const expenses = [
    { category: 'Food', amount: 100, date: '2026-01-01' },
    { category: 'Food', amount: 300, date: '2026-03-01' },
    { category: 'Food', amount: 50, date: '2026-07-01' },
  ]

  const trend = buildTrendData({
    incomeEntries: [],
    expenseEntries: expenses,
    selectedMonth: '2026-07',
    rangeKey: 'month',
  })

  assert.equal(trend[0].actualExpenses, 50)
  assert.equal(trend[0].forecastExpenses, 400 / 6)
  assert.equal(trend[1].actualExpenses, 0)
  assert.equal(trend[1].forecastExpenses, 0)
})

test('monthly trend keeps actual spending separate from historical forecast', () => {
  const expenses = [
    { amount: 100, date: '2026-04-10' },
    { amount: 300, date: '2026-06-10' },
    { amount: 50, date: '2026-07-10' },
  ]

  const trend = buildTrendData({
    expenseEntries: expenses,
    incomeEntries: [],
    selectedMonth: '2026-07',
    rangeKey: '3m',
  })

  const july = trend.find((point) => point.month === '2026-07')
  assert.equal(july.actualExpenses, 50)
  assert.equal(july.forecastExpenses, 400 / 3)
})
