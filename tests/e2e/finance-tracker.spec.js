import { test, expect } from '@playwright/test'

const emptyDataset = {
  expenses: [],
  income: [],
  categories: [],
  categoryEntries: {},
  accounts: [],
  transfers: [],
  budgets: [],
}

const today = new Date().toISOString().slice(0, 10)

const seedDataset = {
  expenses: [
    {
      id: 'expense-seed',
      title: 'Lunch',
      amount: 250,
      date: new Date(today),
      category: 'Food',
      accountId: 'account-main',
      createdAt: new Date(),
    },
  ],
  income: [],
  categories: [{ id: 'category-food', name: 'Food' }],
  categoryEntries: {
    [today.slice(0, 7) + '-monthly']: [{ id: 'category-food', name: 'Food', amount: 1000 }],
  },
  accounts: [
    { id: 'account-main', name: 'Main Account', amount: 2500 },
    { id: 'account-savings', name: 'Savings', amount: 1000 },
  ],
  transfers: [
    {
      id: 'transfer-seed',
      type: 'transfer',
      date: new Date(today),
      createdAt: new Date(),
      fromAccountId: 'account-main',
      fromAccount: 'Main Account',
      toAccountId: 'account-savings',
      toAccount: 'Savings',
      amount: 100,
    },
  ],
  budgets: [],
}

const cloneDataset = (value) => JSON.parse(JSON.stringify(value))

async function mockCloud(page, initialData = emptyDataset, options = {}) {
  let currentData = cloneDataset(initialData)
  let updatedAt = 1
  let failFirstGet = Boolean(options.failFirstGet)

  await page.route('**/api/data', async (route) => {
    if (route.request().method() === 'GET') {
      if (failFirstGet) {
        failFirstGet = false
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Test cloud failure' }),
        })
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { updatedAt, data: currentData } }),
      })
      return
    }

    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON()
      currentData = cloneDataset(body.data)
      updatedAt += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ updatedAt, data: currentData }),
      })
      return
    }

    await route.continue()
  })
}

async function openAddForm(page, buttonName) {
  await page.getByRole('button', { name: buttonName }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

async function addAccount(page, name, amount) {
  await openAddForm(page, 'Add Account')
  await page.locator('input[name="netWorthName"]').fill(name)
  await page.locator('input[name="amount"]').fill(String(amount))
  await page.getByRole('button', { name: 'Add Account' }).click()
  await expect(page.getByText('Your account was added successfully.')).toBeVisible()
}

async function addCategory(page, name, amount) {
  await openAddForm(page, 'Add Category')
  await page.locator('input[name="category"]').fill(name)
  await page.locator('input[name="amount"]').fill(String(amount))
  await page.getByRole('button', { name: 'Add Category' }).click()
  await expect(page.getByText('Your category was saved successfully.')).toBeVisible()
}

async function addIncome(page, title, amount, accountName) {
  await openAddForm(page, 'Add Income')
  await page.locator('#income-account').selectOption({ label: new RegExp(accountName) })
  await page.locator('#income-title').fill(title)
  await page.locator('#income-amount').fill(String(amount))
  await page.locator('#income-date').fill(today)
  await page.getByRole('button', { name: 'Add Income' }).click()
  await expect(page.getByText(/was added to/)).toBeVisible()
}

async function addExpense(page, title, amount, categoryName, accountName) {
  await openAddForm(page, 'Add Expense')
  await page.locator('#expense-category').selectOption(categoryName)
  await page.locator('#expense-account').selectOption({ label: new RegExp(accountName) })
  await page.locator('#expenses-title').fill(title)
  await page.locator('#expenses-amount').fill(String(amount))
  await page.locator('#expenses-date').fill(today)
  await page.getByRole('button', { name: 'Add Expense' }).click()
  await expect(page.getByText(/deducted from/)).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await mockCloud(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
})

test('desktop: covers navigation, accounts, income, budgets, expenses, reallocation, deletion and transfers', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium', 'Desktop workflow')
  await expect(page.getByRole('heading', { name: 'Income vs Expenses & Forecast' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Expenses by Category' })).toBeVisible()

  await page.getByRole('link', { name: 'Accounts' }).click()
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible()
  await addAccount(page, 'Main Account', 10000)
  await addAccount(page, 'Savings', 2000)

  await page.getByRole('link', { name: 'Income' }).click()
  await addIncome(page, 'Salary', 3000, 'Main Account')

  await page.getByRole('link', { name: 'Budget' }).click()
  await addCategory(page, 'Food', 3000)
  await addCategory(page, 'Transport', 2000)

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await addExpense(page, 'Lunch', 500, 'Food', 'Main Account')
  await page.getByRole('combobox', { name: 'View' }).selectOption('Food')
  await expect(page.getByText('Food · 15 days')).toBeVisible()
  await expect(page.getByText('₱2,500.00')).toBeVisible()

  await page.getByRole('link', { name: 'Budget' }).click()
  await expect(page.getByRole('heading', { name: 'Budget & Categories' })).toBeVisible()
  await page.getByRole('button', { name: 'Move left budget' }).first().click()
  await page.getByRole('dialog').getByLabel('To category').selectOption({ label: /Transport/ })
  await page.getByRole('dialog').getByLabel('Amount to move').fill('500')
  await page.getByRole('dialog').getByRole('button', { name: 'Move budget' }).click()
  await expect(page.getByText('₱2,500.00').first()).toBeVisible()

  const foodCard = page.locator('.budget-card', { hasText: 'Food' })
  await foodCard.getByRole('button', { name: 'Delete Food' }).click()
  await expect(page.getByRole('heading', { name: 'Delete category?' })).toBeVisible()
  await expect(page.getByText(/Existing expenses will be kept and moved to Uncategorized/)).toBeVisible()
  await page.getByRole('button', { name: 'Delete category' }).click()
  await expect(page.getByText(/Food and its budget allocations were deleted/)).toBeVisible()

  await page.getByRole('link', { name: 'Accounts' }).click()
  await page.getByRole('button', { name: 'Adjust balance' }).first().click()
  await page.getByLabel('Adjustment').selectOption('decrease')
  await page.getByLabel('Amount').last().fill('500')
  await page.getByRole('button', { name: 'Adjust balance' }).click()
  await expect(page.getByText(/Balance adjusted for Main Account/)).toBeVisible()

  await page.getByRole('button', { name: 'Transfer money' }).click()
  await page.getByLabel('From account').selectOption({ label: /Main Account/ })
  await page.getByLabel('To account').selectOption({ label: /Savings/ })
  await page.getByLabel('Amount').last().fill('1000')
  await page.getByRole('button', { name: 'Transfer money' }).last().click()
  await expect(page.getByText(/transferred from Main Account to Savings/)).toBeVisible()

  await page.getByRole('link', { name: 'Transactions' }).click()
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  const transferRow = page.locator('.transactions-table tbody tr', { hasText: 'Main Account → Savings' })
  await expect(transferRow).toBeVisible()
  await transferRow.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByRole('heading', { name: 'Delete transfer?' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete transfer' }).click()
  await expect(page.getByText(/transfer reversed and removed/)).toBeVisible()

  await page.getByLabel('Category').selectOption('Uncategorized')
  await expect(page.getByText('Lunch')).toBeVisible()
})

test('desktop: blocks deleting an account with transaction history', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium', 'Desktop workflow')
  await page.unroute('**/api/data')
  await mockCloud(page, seedDataset)
  await page.reload()
  await expect(page.getByText('Lunch')).toBeVisible()

  await page.getByRole('link', { name: 'Accounts' }).click()
  await page.getByRole('button', { name: 'Delete Main Account' }).click()
  await expect(page.getByRole('heading', { name: 'Delete account?' })).toBeVisible()
  await page.getByRole('button', { name: 'Delete account' }).click()
  await expect(page.getByText(/transaction history/)).toBeVisible()
})

test('desktop: recovers from a cloud storage failure', async ({ page }) => {
  test.skip(test.info().project.name !== 'chromium', 'Desktop workflow')
  await page.unroute('**/api/data')
  await mockCloud(page, emptyDataset, { failFirstGet: true })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Unable to connect to cloud storage' })).toBeVisible()
  await page.getByRole('button', { name: 'Retry connection' }).click()
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
})

test('mobile: transaction cards expose complete details in the popup', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'Mobile workflow')
  await page.unroute('**/api/data')
  await mockCloud(page, seedDataset)
  await page.goto('/transactions')
  await expect(page.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  await expect(page.locator('.transactions-mobile-list')).toBeVisible()
  await page.getByRole('button', { name: /Lunch/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Main Account')).toBeVisible()
  await expect(page.getByText('Food')).toBeVisible()
  await expect(page.getByText('Time added')).toBeVisible()
})

test('mobile: navigation drawer and filters remain usable', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile', 'Mobile workflow')
  await page.unroute('**/api/data')
  await mockCloud(page, seedDataset)
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Open navigation' }).click()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
  await page.getByRole('link', { name: 'Income' }).click()
  await expect(page.getByRole('heading', { name: 'Income' })).toBeVisible()

  await page.getByRole('button', { name: 'Open navigation' }).click()
  await page.getByRole('link', { name: 'Transactions' }).click()
  await expect(page.getByLabel('Search')).toBeVisible()
})
