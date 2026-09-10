import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCategoryBudgetMetrics, getBudgetRangeForPeriod, getActiveBudgetForCategory } from './budgetCalculations.js'

test('calculates budget metrics for the remaining period', () => {
  const category = { id: 'food', name: 'Food' }
  const startDate = '2026-09-01'
  const endDate = '2026-09-15'
  const expenses = [
    { category: 'Food', amount: 250, date: '2026-09-02' },
    { category: 'Food', amount: 250, date: '2026-09-10' },
    { category: 'Housing', amount: 1000, date: '2026-09-05' },
  ]

  const metrics = calculateCategoryBudgetMetrics({
    category,
    amount: 3000,
    periodType: '15_days',
    startDate,
    endDate,
    expenses,
    today: '2026-09-10',
  })

  assert.equal(metrics.spent, 500)
  assert.equal(metrics.remainingBudget, 2500)
  assert.equal(metrics.totalDays, 15)
  assert.equal(metrics.originalDailyAllowance, 200)
  assert.equal(metrics.currentDailyAllowance, 250)
  assert.equal(metrics.percentageUsed, 16.666666666666664)
})

test('detects the active budget for the current date', () => {
  const budgets = [
    { id: 'budget-1', categoryId: 'food', amount: 3000, periodType: '15_days', startDate: '2026-09-01', endDate: '2026-09-15' },
    { id: 'budget-2', categoryId: 'food', amount: 3500, periodType: '15_days', startDate: '2026-09-16', endDate: '2026-09-30' },
  ]

  const active = getActiveBudgetForCategory({ categoryId: 'food', budgets, today: '2026-09-10' })
  assert.equal(active?.id, 'budget-1')
})

test('builds a budget date range for 7, 15, and 30 day periods', () => {
  const range = getBudgetRangeForPeriod('15_days', '2026-09-10')
  assert.equal(range.startDate, '2026-09-01')
  assert.equal(range.endDate, '2026-09-15')
})
