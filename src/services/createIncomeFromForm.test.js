import test from 'node:test'
import assert from 'node:assert/strict'
import createIncomeFromForm from './createIncomeFromForm.js'

test('creates an income entry from a valid form submission', () => {
  const event = {
    preventDefault() {},
    target: {
      title: { value: 'Salary' },
      amount: { value: '5000' },
      date: { value: '2026-09-15' },
      reset() {},
    },
  }

  const incomeEntry = createIncomeFromForm(event)

  assert.ok(incomeEntry)
  assert.equal(incomeEntry.title, 'Salary')
  assert.equal(incomeEntry.amount, 5000)
  assert.equal(incomeEntry.date.toISOString().slice(0, 10), '2026-09-15')
})

test('returns null for invalid income input', () => {
  const event = {
    preventDefault() {},
    target: {
      title: { value: '' },
      amount: { value: '0' },
      date: { value: 'invalid' },
      reset() {},
    },
  }

  assert.equal(createIncomeFromForm(event), null)
})
