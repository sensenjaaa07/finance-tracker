import test from 'node:test'
import assert from 'node:assert/strict'
import filterExpensesByDate from './filterExpensesByDate.js'

const expenses = [
  { id: '1', title: 'Groceries', category: 'Food', amount: 100, date: new Date('2025-01-05T00:00:00') },
  { id: '2', title: 'Rent', category: 'Housing', amount: 200, date: new Date('2025-02-10T00:00:00') },
  { id: '3', title: 'Snacks', category: 'Food', amount: 50, date: new Date('2025-02-15T00:00:00') },
]

test('returns all expenses when no date filters are set', () => {
  assert.deepEqual(filterExpensesByDate(expenses, null, null), expenses)
})

test('filters expenses between a start and end date', () => {
  const filtered = filterExpensesByDate(expenses, '2025-02-01', '2025-02-28')
  assert.deepEqual(filtered.map((expense) => expense.id), ['2', '3'])
})

test('filters by just a start date', () => {
  const filtered = filterExpensesByDate(expenses, '2025-02-01', null)
  assert.deepEqual(filtered.map((expense) => expense.id), ['2', '3'])
})
