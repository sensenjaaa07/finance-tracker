import './assets/styles/App.css'
import Navigation from './components/Navigation.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Budget from './pages/Budget.jsx'
import Transactions from './pages/Transactions.jsx'
import Income from './pages/Income.jsx'
import Accounts from './pages/Accounts.jsx'
import AddForm from './components/cards/AddForm.jsx'
import ToastNotification from './components/cards/ToastNotification.jsx'
import createExpenseFromForm from './services/createExpenseFromForm.js'
import createIncomeFromForm from './services/createIncomeFromForm.js'
import createCategoriesFromForm from './services/createCategoriesFromForm.js'
import createNetWorthFromForm from './services/createNetWorthFromForm.js'
import filterExpensesByDate from './services/filterExpensesByDate.js'
import useCloudSync from './services/useCloudSync.js'
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

const EMPTY_DATA = { expenses: [], income: [], categories: [], categoryEntries: {}, accounts: [], transfers: [], budgets: [] }

function App() {
  const [activeForm, setActiveForm] = useState(null)
  const [expenseEntries, setExpenseEntries] = useState(EMPTY_DATA.expenses)
  const [incomeEntries, setIncomeEntries] = useState(EMPTY_DATA.income)
  const [categoryDefinitions, setCategoryDefinitions] = useState(EMPTY_DATA.categories)
  const [categoryEntriesByMonth, setCategoryEntriesByMonth] = useState(EMPTY_DATA.categoryEntries)
  const [accountEntries, setAccountEntries] = useState(EMPTY_DATA.accounts)
  const [transfers, setTransfers] = useState(EMPTY_DATA.transfers)
  const [budgets, setBudgets] = useState(EMPTY_DATA.budgets)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    try {
      return localStorage.getItem('finance-tracker-selected-month') || new Date().toISOString().slice(0, 7)
    } catch {
      return new Date().toISOString().slice(0, 7)
    }
  })
  const [budgetCycle, setBudgetCycle] = useState('monthly')
  const [toastMessage, setToastMessage] = useState('')

  const cloudData = { expenses: expenseEntries, income: incomeEntries, categories: categoryDefinitions, categoryEntries: categoryEntriesByMonth, accounts: accountEntries, transfers, budgets }

  useEffect(() => {
    try {
      window.localStorage.setItem('finance-tracker-selected-month', selectedMonth)
    } catch {
      // Ignore storage errors; the selected month remains in React state.
    }
  }, [selectedMonth])
  const { cloudReady, syncStatus, cloudError, retryCloudSync } = useCloudSync(cloudData, { setExpenseEntries, setIncomeEntries, setCategoryDefinitions, setCategoryEntriesByMonth, setAccountEntries, setTransfers, setBudgets })

  const getCycleKey = (monthValue, cycleMode) => {
    if (!monthValue) return ''
    if (cycleMode === 'fortnightly-1') return `${monthValue}-1-15`
    if (cycleMode === 'fortnightly-2') return `${monthValue}-16-end`
    return `${monthValue}-monthly`
  }

  const currentCycleKey = getCycleKey(selectedMonth, budgetCycle)
  const cycleKeysToDisplay = budgetCycle === 'monthly' ? [getCycleKey(selectedMonth, 'fortnightly-1'), getCycleKey(selectedMonth, 'fortnightly-2'), currentCycleKey] : [currentCycleKey]
  const monthCategoryEntries = cycleKeysToDisplay.flatMap((key) => categoryEntriesByMonth[key] ?? [])
  const categoryEntries = categoryDefinitions.map((definition) => {
    const matchingEntries = monthCategoryEntries.filter((entry) => entry.id === definition.id || entry.name === definition.name)
    const totalAmount = matchingEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)
    return matchingEntries.length > 0 ? { ...definition, amount: totalAmount } : { ...definition, amount: 0 }
  })

  const getCycleRange = (monthValue, cycleMode) => {
    if (!monthValue) return { monthStart: '', monthEnd: '' }
    const year = Number(monthValue.slice(0, 4))
    const monthIndex = Number(monthValue.slice(5, 7))
    const lastDay = new Date(year, monthIndex, 0).getDate()
    if (cycleMode === 'fortnightly-1') return { monthStart: `${monthValue}-01`, monthEnd: `${monthValue}-15` }
    if (cycleMode === 'fortnightly-2') return { monthStart: `${monthValue}-16`, monthEnd: `${monthValue}-${String(lastDay).padStart(2, '0')}` }
    return { monthStart: `${monthValue}-01`, monthEnd: `${monthValue}-${String(lastDay).padStart(2, '0')}` }
  }

  const { monthStart, monthEnd } = getCycleRange(selectedMonth, budgetCycle)
  const filteredExpenseEntries = filterExpensesByDate(expenseEntries, monthStart, monthEnd)
  const filteredIncomeEntries = filterExpensesByDate(incomeEntries, monthStart, monthEnd)
  const monthlyIncomeTotal = filteredIncomeEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)
  const currentAllocationTotal = categoryEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)

  const changeAccountBalance = (accountId, delta) => {
    const account = accountEntries.find((entry) => entry.id === accountId)
    if (!account) return false

    const nextAmount = Number(account.amount ?? 0) + Number(delta ?? 0)
    if (!Number.isFinite(nextAmount) || nextAmount < 0) return false

    setAccountEntries((previous) => previous.map((entry) => (
      entry.id === accountId ? { ...entry, amount: nextAmount } : entry
    )))
    return true
  }

  function openAddForm(formType) { setActiveForm(formType) }

  function updateCategoryAmount(categoryId, amount) {
    const safeAmount = Number(amount)
    if (!Number.isFinite(safeAmount) || safeAmount < 0) return false
    const categoryDefinition = categoryDefinitions.find(entry => entry.id === categoryId)
    if (!categoryDefinition) return false
    setCategoryEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: [...(previous[currentCycleKey] ?? []).filter((entry) => entry.id !== categoryId && entry.name !== categoryDefinition.name), { ...categoryDefinition, amount: safeAmount }] }))
    return true
  }

  function reallocateBudget(fromCategoryId, toCategoryId, amount) {
    const safeAmount = Number(amount)
    if (!fromCategoryId || !toCategoryId || fromCategoryId === toCategoryId || !Number.isFinite(safeAmount) || safeAmount <= 0) {
      setToastMessage('Choose two different categories and enter a valid amount.')
      return false
    }

    const source = categoryEntries.find((entry) => entry.id === fromCategoryId)
    const destination = categoryEntries.find((entry) => entry.id === toCategoryId)
    if (!source || !destination) {
      setToastMessage('Both budget categories must exist.')
      return false
    }

    const sourceSpent = filteredExpenseEntries
      .filter((expense) => expense.category === source.name)
      .reduce((total, expense) => total + Number(expense.amount ?? 0), 0)
    const sourceRemaining = Number(source.amount ?? 0) - sourceSpent

    if (sourceRemaining <= 0) {
      setToastMessage(`${source.name} has no remaining budget available to move.`)
      return false
    }

    if (safeAmount > sourceRemaining) {
      setToastMessage(`You can only move up to ₱${sourceRemaining.toFixed(2)} from ${source.name}.`)
      return false
    }

    setCategoryEntriesByMonth((previous) => {
      const next = { ...previous }
      const entries = [...(next[currentCycleKey] ?? [])]

      const applyDelta = (category) => {
        const index = entries.findIndex((entry) => entry.id === category.id || entry.name === category.name)
        if (index >= 0) {
          entries[index] = { ...entries[index], amount: Number(entries[index].amount ?? 0) + (category.id === fromCategoryId ? -safeAmount : safeAmount) }
        } else {
          entries.push({ ...category, amount: category.id === fromCategoryId ? -safeAmount : safeAmount })
        }
      }

      applyDelta(source)
      applyDelta(destination)
      next[currentCycleKey] = entries
      return next
    })

    setToastMessage(`₱${safeAmount.toFixed(2)} moved from ${source.name} to ${destination.name}.`)
    return true
  }

  function deleteCategoryEntry(categoryId) {
    const categoryDefinition = categoryDefinitions.find(entry => entry.id === categoryId)
    if (!categoryDefinition) return false

    const linkedExpenses = expenseEntries.filter(entry => entry.category === categoryDefinition.name).length
    setCategoryDefinitions(previous => previous.filter(entry => entry.id !== categoryId))
    setCategoryEntriesByMonth(previous => {
      const next = { ...previous }
      Object.keys(next).forEach(key => {
        next[key] = (next[key] ?? []).filter(entry => entry.id !== categoryId && entry.name !== categoryDefinition.name)
      })
      return next
    })
    setBudgets(previous => previous.filter(budget => String(budget.categoryId ?? '') !== String(categoryId)))
    setExpenseEntries(previous => previous.map(entry => entry.category === categoryDefinition.name ? { ...entry, category: 'Uncategorized' } : entry))

    const movedMessage = linkedExpenses > 0
      ? ' ' + linkedExpenses + ' existing expense' + (linkedExpenses === 1 ? '' : 's') + ' moved to Uncategorized.'
      : ''
    setToastMessage(categoryDefinition.name + ' and its budget allocations were deleted.' + movedMessage)
    return true
  }

  function updateExpenseEntry(expenseId, updatedEntry) {
    const expenseToUpdate = expenseEntries.find(entry => entry.id === expenseId)
    if (!expenseToUpdate) return false

    const nextAmount = Number(updatedEntry.amount)
    const nextAccountId = updatedEntry.accountId || ''
    if (!nextAccountId || !Number.isFinite(nextAmount) || nextAmount <= 0) {
      setToastMessage('Please enter a valid expense amount and account.')
      return false
    }

    const oldAmount = Number(expenseToUpdate.amount ?? 0)
    const oldAccountId = expenseToUpdate.accountId || ''
    const targetAccount = accountEntries.find(entry => entry.id === nextAccountId)
    const oldAccount = oldAccountId ? accountEntries.find(entry => entry.id === oldAccountId) : null

    if (!targetAccount) {
      setToastMessage('The selected account no longer exists.')
      return false
    }

    if (oldAccountId === nextAccountId) {
      const difference = nextAmount - oldAmount
      if (difference > 0 && Number(targetAccount.amount ?? 0) < difference) {
        setToastMessage(`Insufficient balance in ${targetAccount.name} for this expense change.`)
        return false
      }
      changeAccountBalance(nextAccountId, -difference)
    } else {
      if (oldAccountId && !oldAccount) {
        setToastMessage('The original expense account no longer exists, so this expense cannot be moved safely.')
        return false
      }
      if (Number(targetAccount.amount ?? 0) < nextAmount) {
        setToastMessage(`Insufficient balance in ${targetAccount.name} for this expense change.`)
        return false
      }
      if (oldAccountId && oldAmount > 0) changeAccountBalance(oldAccountId, oldAmount)
      changeAccountBalance(nextAccountId, -nextAmount)
    }

    setExpenseEntries(previous => previous.map(entry => entry.id === expenseId ? { ...entry, ...updatedEntry, amount: nextAmount, accountId: nextAccountId } : entry))
    setToastMessage(`Expense updated. ${targetAccount.name} now reflects the new amount.`)
    return true
  }

  function deleteExpenseEntry(expenseId) {
    const expenseToDelete = expenseEntries.find(entry => entry.id === expenseId)
    if (!expenseToDelete) return false
    setExpenseEntries(previous => previous.filter(entry => entry.id !== expenseId))
    const amount = Number(expenseToDelete.amount ?? 0)
    if (expenseToDelete.accountId && Number.isFinite(amount) && amount > 0) {
      const account = accountEntries.find(entry => entry.id === expenseToDelete.accountId)
      if (account) {
        changeAccountBalance(expenseToDelete.accountId, amount)
        setToastMessage(`₱${amount.toFixed(2)} was returned to ${account.name}.`)
      } else setToastMessage('Transaction deleted successfully.')
    } else setToastMessage('Transaction deleted successfully.')
    return true
  }

  function deleteTransfer(transferId) {
    const transferToDelete = transfers.find(entry => entry.id === transferId)
    if (!transferToDelete) return false

    const amount = Number(transferToDelete.amount ?? 0)
    const sourceAccount = accountEntries.find(entry => entry.id === transferToDelete.fromAccountId)
    const destinationAccount = accountEntries.find(entry => entry.id === transferToDelete.toAccountId)

    if (!sourceAccount || !destinationAccount) {
      setToastMessage('This transfer cannot be reversed because one of its accounts no longer exists.')
      return false
    }

    if (!Number.isFinite(amount) || amount <= 0 || Number(destinationAccount.amount ?? 0) < amount) {
      setToastMessage(`Unable to reverse this transfer because ${destinationAccount.name} no longer has enough balance.`)
      return false
    }

    changeAccountBalance(transferToDelete.fromAccountId, amount)
    changeAccountBalance(transferToDelete.toAccountId, -amount)
    setTransfers(previous => previous.filter(entry => entry.id !== transferId))
    setToastMessage(`₱${amount.toFixed(2)} transfer reversed and removed.`)
    return true
  }

  function updateIncomeEntry(incomeId, updatedEntry) {
    const incomeToUpdate = incomeEntries.find(entry => entry.id === incomeId)
    if (!incomeToUpdate) return false

    const nextAmount = Number(updatedEntry.amount)
    const nextAccountId = updatedEntry.accountId || ''
    if (!nextAccountId || !Number.isFinite(nextAmount) || nextAmount <= 0) return false

    const oldAmount = Number(incomeToUpdate.amount ?? 0)
    const oldAccountId = incomeToUpdate.accountId

    if (oldAccountId && oldAccountId !== nextAccountId) {
      const oldAccount = accountEntries.find(entry => entry.id === oldAccountId)
      if (oldAccount && Number(oldAccount.amount ?? 0) < oldAmount) {
        setToastMessage(`Unable to move this income because ${oldAccount.name} does not have enough balance to reverse it.`)
        return false
      }
    }

    setIncomeEntries(previous => previous.map(entry => entry.id === incomeId ? { ...entry, ...updatedEntry, amount: nextAmount, accountId: nextAccountId } : entry))

    if (oldAccountId === nextAccountId) {
      changeAccountBalance(nextAccountId, nextAmount - oldAmount)
    } else {
      if (oldAccountId && oldAmount > 0) changeAccountBalance(oldAccountId, -oldAmount)
      changeAccountBalance(nextAccountId, nextAmount)
    }

    return true
  }

  function deleteIncomeEntry(incomeId) {
    const incomeToDelete = incomeEntries.find(entry => entry.id === incomeId)
    if (!incomeToDelete) return false

    const amount = Number(incomeToDelete.amount ?? 0)
    if (incomeToDelete.accountId && Number.isFinite(amount) && amount > 0) {
      const account = accountEntries.find(entry => entry.id === incomeToDelete.accountId)
      if (!account) {
        setToastMessage('Income cannot be deleted because its account no longer exists.')
        return false
      }
      if (Number(account.amount ?? 0) < amount) {
        setToastMessage(`Income cannot be deleted because ${account.name} no longer has enough balance to reverse it.`)
        return false
      }

      changeAccountBalance(incomeToDelete.accountId, -amount)
      setToastMessage(`₱${amount.toFixed(2)} was removed from ${account.name}.`)
    } else {
      setToastMessage('Income deleted successfully.')
    }

    setIncomeEntries(previous => previous.filter(entry => entry.id !== incomeId))
    return true
  }

  function updateNetWorthEntry(netWorthId, updatedEntry) {
    const nextName = updatedEntry.name?.trim() ?? ''
    if (!nextName) return false
    const duplicate = accountEntries.some((entry) => entry.id !== netWorthId && entry.name.trim().toLowerCase() === nextName.toLowerCase())
    if (duplicate) {
      setToastMessage('Another account already uses that name.')
      return false
    }
    setAccountEntries(previous => previous.map(entry => entry.id === netWorthId ? { ...entry, name: nextName } : entry))
    setToastMessage('Account name updated successfully.')
    return true
  }

  function adjustAccountBalance(accountId, direction, amount) {
    const safeAmount = Number(amount)
    const account = accountEntries.find(entry => entry.id === accountId)
    if (!account || !Number.isFinite(safeAmount) || safeAmount <= 0) {
      setToastMessage('Enter a valid balance adjustment amount.')
      return false
    }

    const delta = direction === 'decrease' ? -safeAmount : safeAmount
    const nextAmount = Number(account.amount ?? 0) + delta
    if (nextAmount < 0) {
      setToastMessage(`Cannot remove ₱${safeAmount.toFixed(2)} from ${account.name}.`)
      return false
    }

    setAccountEntries(previous => previous.map(entry => entry.id === accountId ? { ...entry, amount: nextAmount } : entry))
    setToastMessage(`Balance adjusted for ${account.name}. New balance: ₱${nextAmount.toFixed(2)}.`)
    return true
  }

  function deleteNetWorthEntry(netWorthId) {
    const hasExpenses = expenseEntries.some(entry => entry.accountId === netWorthId)
    const hasIncome = incomeEntries.some(entry => entry.accountId === netWorthId)
    const hasTransfers = transfers.some(entry => entry.fromAccountId === netWorthId || entry.toAccountId === netWorthId)

    if (hasExpenses || hasIncome || hasTransfers) {
      setToastMessage('This account has transaction history. Remove or move those transactions before deleting the account.')
      return false
    }

    setAccountEntries(previous => previous.filter(entry => entry.id !== netWorthId))
    setToastMessage('Account deleted successfully.')
    return true
  }

  function handleTransfer(fromId, toId, amount) {
    const source = accountEntries.find(entry => entry.id === fromId)
    const destination = accountEntries.find(entry => entry.id === toId)
    if (!source || !destination || fromId === toId || amount <= 0) return false
    if (Number(source.amount ?? 0) < amount) { setToastMessage(`Insufficient balance in ${source.name}.`); return false }
    setAccountEntries(previous => previous.map(entry => {
      if (entry.id === fromId) return { ...entry, amount: Number(entry.amount ?? 0) - amount }
      if (entry.id === toId) return { ...entry, amount: Number(entry.amount ?? 0) + amount }
      return entry
    }))
    const transfer = { id: crypto.randomUUID(), type: 'transfer', date: new Date(), createdAt: new Date(), fromAccountId: fromId, fromAccount: source.name, toAccountId: toId, toAccount: destination.name, amount }
    setTransfers(previous => [...previous, transfer])
    setToastMessage(`₱${amount.toFixed(2)} transferred from ${source.name} to ${destination.name}.`)
    return true
  }

  function handleAddFormSubmit(event) {
    event.preventDefault()
    if (activeForm === 'Expenses') {
      const expenseEntry = createExpenseFromForm(event)
      if (!expenseEntry) return
      const account = accountEntries.find(entry => entry.id === expenseEntry.accountId)
      if (!account) { setToastMessage('Please select an account.'); return }
      if (Number(account.amount ?? 0) < expenseEntry.amount) { setToastMessage(`Insufficient balance in ${account.name}.`); return }
      changeAccountBalance(expenseEntry.accountId, -expenseEntry.amount)
      setExpenseEntries(previous => [...previous, expenseEntry])
      setActiveForm(null)
      setToastMessage(`₱${expenseEntry.amount.toFixed(2)} deducted from ${account.name}.`)
      return
    }
    if (activeForm === 'Income') {
      const incomeEntry = createIncomeFromForm(event)
      if (!incomeEntry) { setToastMessage('Please select an account for this income.'); return }
      const account = accountEntries.find(entry => entry.id === incomeEntry.accountId)
      if (!account) { setToastMessage('Please select a valid account.'); return }
      changeAccountBalance(incomeEntry.accountId, incomeEntry.amount)
      setIncomeEntries(previous => [...previous, incomeEntry])
      setActiveForm(null)
      setToastMessage(`₱${incomeEntry.amount.toFixed(2)} was added to ${account.name}.`)
      return
    }
    if (activeForm === 'Categories') {
      const categoryRequest = createCategoriesFromForm(event)
      if (!categoryRequest) return
      const newAllocationTotal = currentAllocationTotal + categoryRequest.entry.amount
      if (monthlyIncomeTotal > 0 && newAllocationTotal > monthlyIncomeTotal) { setToastMessage('This allocation exceeds your income for the selected month.'); return }
      if (categoryRequest.selectedEntryId === 'new') {
        const newCategoryDefinition = { id: categoryRequest.entry.id, name: categoryRequest.entry.name }
        if (!categoryDefinitions.some(entry => entry.name === newCategoryDefinition.name)) setCategoryDefinitions(previous => [...previous, newCategoryDefinition])
        setCategoryEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: [...(previous[currentCycleKey] ?? []).filter((entry) => entry.id !== newCategoryDefinition.id && entry.name !== newCategoryDefinition.name), { ...newCategoryDefinition, amount: categoryRequest.entry.amount }] }))
        setActiveForm(null); setToastMessage('Your category was saved successfully.')
      } else {
        const currentCategory = categoryDefinitions.find(entry => entry.id === categoryRequest.entry.id)
        setCategoryEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: (previous[currentCycleKey] ?? []).map(entry => entry.id === categoryRequest.entry.id || (currentCategory && entry.name === currentCategory.name) ? { ...entry, amount: Number(entry.amount ?? 0) + categoryRequest.entry.amount } : entry) }))
        setActiveForm(null); setToastMessage('Money was added to your category successfully.')
      }
      return
    }
    if (activeForm === 'Net-Worth') {
      const accountRequest = createNetWorthFromForm(event)
      if (!accountRequest) return
      if (accountRequest.selectedEntryId === 'new') {
        const duplicate = accountEntries.some((entry) => entry.name.trim().toLowerCase() === accountRequest.entry.name.trim().toLowerCase())
        if (duplicate) { setToastMessage('An account with that name already exists.'); return }
        setAccountEntries(previous => [...previous, accountRequest.entry])
        setActiveForm(null); setToastMessage('Your account was added successfully.')
      } else {
        if (changeAccountBalance(accountRequest.entry.id, accountRequest.entry.amount)) {
          setActiveForm(null)
          setToastMessage(`₱${Number(accountRequest.entry.amount).toFixed(2)} was added to your account.`)
        }
      }
      return
    }
    event.target.reset(); setActiveForm(null); setToastMessage(`${activeForm} was saved successfully.`)
  }

  function renderCard() {
    if (!activeForm) return null
    return <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="add-form-title"><AddForm formType={activeForm} entries={activeForm === 'Categories' ? categoryEntries : activeForm === 'Net-Worth' ? accountEntries : categoryEntries} accounts={accountEntries} onSubmit={handleAddFormSubmit} onClose={() => setActiveForm(null)} /></div>
  }

  if (!cloudReady) return <div className="app-container" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}><div><h2>{syncStatus === 'offline' ? 'Unable to connect to cloud storage' : 'Loading your finance data…'}</h2><p>{cloudError || 'Reading the latest data from cloud storage.'}</p>{syncStatus === 'offline' && <button type="button" className="header-button" style={{ marginTop: '16px' }} onClick={retryCloudSync}>Retry connection</button>}</div></div>

  return <div className="app-container"><Navigation /><main className="content-container"><Routes>
    <Route path="/" element={<Dashboard expenseEntries={filteredExpenseEntries} allExpenseEntries={expenseEntries} incomeEntries={filteredIncomeEntries} allIncomeEntries={incomeEntries} categoryEntries={categoryEntries} budgets={budgets} onOpenAddForm={() => openAddForm('Expenses')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} />} />
    <Route path="/budget" element={<Budget categoryEntries={categoryEntries} expenseEntries={filteredExpenseEntries} onOpenAddForm={() => openAddForm('Categories')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateCategoryAmount={updateCategoryAmount} onDeleteCategoryEntry={deleteCategoryEntry} onReallocateBudget={reallocateBudget} />} />
    <Route path="/transactions" element={<Transactions expenseEntries={filteredExpenseEntries} categoryEntries={categoryEntries} accounts={accountEntries} transfers={transfers.filter(transfer => filterExpensesByDate([transfer], monthStart, monthEnd).length > 0)} onOpenAddForm={() => openAddForm('Expenses')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateExpenseEntry={updateExpenseEntry} onDeleteExpenseEntry={deleteExpenseEntry} onDeleteTransfer={deleteTransfer} />} />
    <Route path="/income" element={<Income incomeEntries={filteredIncomeEntries} accounts={accountEntries} onOpenAddForm={() => openAddForm('Income')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateIncomeEntry={updateIncomeEntry} onDeleteIncomeEntry={deleteIncomeEntry} />} />
    <Route path="/net-worth" element={<Accounts accounts={accountEntries} onOpenAddForm={() => openAddForm('Net-Worth')} onUpdateAccount={updateNetWorthEntry} onAdjustAccountBalance={adjustAccountBalance} onDeleteAccount={deleteNetWorthEntry} onTransfer={handleTransfer} />} />
  </Routes></main>{renderCard()}{toastMessage && <ToastNotification message={toastMessage} onClose={() => setToastMessage('')} />}</div>
}

export default App
