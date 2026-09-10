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

  const metrics = calculateCategoryBudgetMetrics({ category, amount: 3000, periodType: '15_days', startDate, endDate, expenses, today: '2026-09-10' })

  assert.equal(metrics.spent, 500)
  assert.equal(metrics.remainingBudget, 2500)
  assert.equal(metrics.totalDays, 15)
  assert.equal(metrics.originalDailyAllowance, 200)
  assert.equal(metrics.currentDailyAllowance, 250)
  assert.equal(metrics.percentageUsed, 16.666666666666664)
})

test('detects the active budget for the current date', () => {
  const budgets = [
    { id: 'budget-1', categoryId: 'food', amount: 3000, periodType: '15_days', startDate: '2026-09-01', endDate: '2026-09-15', updatedAt: '2026-09-01T00:00:00.000Z' },
    { id: 'budget-2', categoryId: 'food', amount: 3500, periodType: '15_days', startDate: '2026-09-16', endDate: '2026-09-30', updatedAt: '2026-09-16T00:00:00.000Z' },
  ]

  const active = getActiveBudgetForCategory({ categoryId: 'food', budgets, today: '2026-09-10' })
  assert.equal(active?.id, 'budget-1')
})

test('prefers the most recently updated budget when active budgets overlap', () => {
  const budgets = [
    { id: 'older', categoryId: 'food', startDate: '2026-09-01', endDate: '2026-09-20', updatedAt: '2026-09-01T00:00:00.000Z' },
    { id: 'newer', categoryId: 'food', startDate: '2026-09-10', endDate: '2026-09-25', updatedAt: '2026-09-10T00:00:00.000Z' },
  ]

  const active = getActiveBudgetForCategory({ categoryId: 'food', budgets, today: '2026-09-12' })
  assert.equal(active?.id, 'newer')
})

test('builds rolling budget ranges from the selected start date', () => {
  const sevenDays = getBudgetRangeForPeriod('7_days', '2026-09-10')
  const fifteenDays = getBudgetRangeForPeriod('15_days', '2026-09-10')
  const thirtyDays = getBudgetRangeForPeriod('30_days', '2026-09-10')

  assert.deepEqual(sevenDays, { startDate: '2026-09-10', endDate: '2026-09-16', totalDays: 7 })
  assert.deepEqual(fifteenDays, { startDate: '2026-09-10', endDate: '2026-09-24', totalDays: 15 })
  assert.deepEqual(thirtyDays, { startDate: '2026-09-10', endDate: '2026-10-09', totalDays: 30 })
})

test('supports custom date ranges', () => {
  const range = getBudgetRangeForPeriod('custom', '2026-09-10', '2026-09-12', '2026-09-20')
  assert.deepEqual(range, { startDate: '2026-09-12', endDate: '2026-09-20', totalDays: 9 })
})

test('handles over-budget spending without returning a positive daily allowance', () => {
  const metrics = calculateCategoryBudgetMetrics({
    category: { id: 'food', name: 'Food' },
    amount: 3000,
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    expenses: [{ category: 'Food', amount: 3500, date: '2026-09-10' }],
    today: '2026-09-10',
  })

  assert.equal(metrics.remainingBudget, -500)
  assert.equal(metrics.status, 'over_budget')
  assert.equal(metrics.currentDailyAllowance, 0)
})

test('handles a budget period that has ended', () => {
  const metrics = calculateCategoryBudgetMetrics({
    category: { id: 'food', name: 'Food' },
    amount: 3000,
    startDate: '2026-09-01',
    endDate: '2026-09-05',
    expenses: [],
    today: '2026-09-10',
  })

  assert.equal(metrics.status, 'completed')
  assert.equal(metrics.remainingDays, 0)
  assert.equal(metrics.currentDailyAllowance, 0)
})

test('handles a future budget period', () => {
  const metrics = calculateCategoryBudgetMetrics({
    category: { id: 'food', name: 'Food' },
    amount: 3000,
    startDate: '2026-09-15',
    endDate: '2026-09-29',
    expenses: [],
    today: '2026-09-10',
  })

  assert.equal(metrics.status, 'not_started')
  assert.equal(metrics.daysElapsed, 0)
  assert.equal(metrics.remainingDays, 15)
  assert.equal(metrics.currentDailyAllowance, 200)
})
