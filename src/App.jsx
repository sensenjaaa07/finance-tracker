import '../src/assets/styles/App.css'
import Navigation from './components/Navigation.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Budget from './pages/Budget.jsx'
import Transactions from './pages/Transactions.jsx'
import Income from './pages/Income.jsx'
import NetWorth from './pages/NetWorth.jsx'
import AddForm from './components/cards/AddForm.jsx'
import ToastNotification from './components/cards/ToastNotification.jsx'
import createExpenseFromForm from './services/createExpenseFromForm.js'
import createIncomeFromForm from './services/createIncomeFromForm.js'
import createCategoriesFromForm from './services/createCategoriesFromForm.js'
import createNetWorthFromForm from './services/createNetWorthFromForm.js'
import filterExpensesByDate from './services/filterExpensesByDate.js'
import useCloudSync from './services/useCloudSync.js'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'

const EMPTY_DATA = { expenses: [], income: [], categories: [], categoryEntries: {}, netWorth: {}, transfers: [], budgets: [] }

function App() {
  const [activeForm, setActiveForm] = useState(null)
  const [expenseEntries, setExpenseEntries] = useState(EMPTY_DATA.expenses)
  const [incomeEntries, setIncomeEntries] = useState(EMPTY_DATA.income)
  const [categoryDefinitions, setCategoryDefinitions] = useState(EMPTY_DATA.categories)
  const [categoryEntriesByMonth, setCategoryEntriesByMonth] = useState(EMPTY_DATA.categoryEntries)
  const [netWorthEntriesByMonth, setNetWorthEntriesByMonth] = useState(EMPTY_DATA.netWorth)
  const [transfers, setTransfers] = useState(EMPTY_DATA.transfers)
  const [budgets, setBudgets] = useState(EMPTY_DATA.budgets)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [budgetCycle, setBudgetCycle] = useState('monthly')
  const [toastMessage, setToastMessage] = useState('')

  const cloudData = { expenses: expenseEntries, income: incomeEntries, categories: categoryDefinitions, categoryEntries: categoryEntriesByMonth, netWorth: netWorthEntriesByMonth, transfers, budgets }
  const { cloudReady, syncStatus, cloudError } = useCloudSync(cloudData, { setExpenseEntries, setIncomeEntries, setCategoryDefinitions, setCategoryEntriesByMonth, setNetWorthEntriesByMonth, setTransfers, setBudgets })

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
  const netWorthEntries = cycleKeysToDisplay.flatMap((key) => netWorthEntriesByMonth[key] ?? [])

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
  const currentAllocationTotal = categoryEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0) + netWorthEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)

  const changeAccountBalance = (accountId, delta) => {
    let changed = false
    setNetWorthEntriesByMonth(previous => {
      const currentEntries = previous[currentCycleKey] ?? []
      const nextEntries = currentEntries.map(entry => {
        if (entry.id !== accountId) return entry
        const nextAmount = Number(entry.amount ?? 0) + delta
        if (nextAmount < 0) return entry
        changed = true
        return { ...entry, amount: nextAmount }
      })
      return { ...previous, [currentCycleKey]: nextEntries }
    })
    return changed
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

  function deleteCategoryEntry(categoryId) {
    const categoryDefinition = categoryDefinitions.find(entry => entry.id === categoryId)
    setCategoryDefinitions(previous => previous.filter(entry => entry.id !== categoryId))
    setCategoryEntriesByMonth(previous => { const next = { ...previous }; Object.keys(next).forEach(key => { next[key] = (next[key] ?? []).filter(entry => entry.id !== categoryId && (!categoryDefinition || entry.name !== categoryDefinition.name)) }); return next })
    return true
  }

  function updateExpenseEntry(expenseId, updatedEntry) {
    setExpenseEntries(previous => previous.map(entry => entry.id === expenseId ? { ...entry, ...updatedEntry } : entry))
  }

  function deleteExpenseEntry(expenseId) {
    const expenseToDelete = expenseEntries.find(entry => entry.id === expenseId)
    if (!expenseToDelete) return false

    setExpenseEntries(previous => previous.filter(entry => entry.id !== expenseId))

    const amount = Number(expenseToDelete.amount ?? 0)
    if (expenseToDelete.accountId && Number.isFinite(amount) && amount > 0) {
      const account = netWorthEntries.find(entry => entry.id === expenseToDelete.accountId)
      if (account) {
        changeAccountBalance(expenseToDelete.accountId, amount)
        setToastMessage(`₱${amount.toFixed(2)} was returned to ${account.name}.`)
      } else {
        setToastMessage('Transaction deleted successfully.')
      }
    } else {
      setToastMessage('Transaction deleted successfully.')
    }

    return true
  }

  function updateIncomeEntry(incomeId, updatedEntry) { setIncomeEntries(previous => previous.map(entry => entry.id === incomeId ? { ...entry, ...updatedEntry } : entry)) }
  function deleteIncomeEntry(incomeId) { setIncomeEntries(previous => previous.filter(entry => entry.id !== incomeId)); return true }

  function updateNetWorthEntry(netWorthId, updatedEntry) {
    const nextAmount = Number(updatedEntry.amount)
    const nextName = updatedEntry.name?.trim() ?? ''
    if (!Number.isFinite(nextAmount) || nextAmount < 0 || !nextName) return false
    setNetWorthEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: (previous[currentCycleKey] ?? []).map(entry => entry.id === netWorthId ? { ...entry, name: nextName, amount: nextAmount } : entry) }))
    return true
  }

  function deleteNetWorthEntry(netWorthId) {
    setNetWorthEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: (previous[currentCycleKey] ?? []).filter(entry => entry.id !== netWorthId) }))
    return true
  }

  function handleTransfer(fromId, toId, amount) {
    const source = netWorthEntries.find(entry => entry.id === fromId)
    const destination = netWorthEntries.find(entry => entry.id === toId)
    if (!source || !destination || fromId === toId || amount <= 0) return false
    if (Number(source.amount ?? 0) < amount) { setToastMessage(`Insufficient balance in ${source.name}.`); return false }

    setNetWorthEntriesByMonth(previous => {
      const currentEntries = previous[currentCycleKey] ?? []
      const nextEntries = currentEntries.map(entry => {
        if (entry.id === fromId) return { ...entry, amount: Number(entry.amount ?? 0) - amount }
        if (entry.id === toId) return { ...entry, amount: Number(entry.amount ?? 0) + amount }
        return entry
      })
      return { ...previous, [currentCycleKey]: nextEntries }
    })
    const transfer = { id: crypto.randomUUID(), type: 'transfer', date: new Date(), fromAccountId: fromId, fromAccount: source.name, toAccountId: toId, toAccount: destination.name, amount }
    setTransfers(previous => [...previous, transfer])
    setToastMessage(`₱${amount.toFixed(2)} transferred from ${source.name} to ${destination.name}.`)
    return true
  }

  function handleAddFormSubmit(event) {
    event.preventDefault()

    if (activeForm === 'Expenses') {
      const expenseEntry = createExpenseFromForm(event)
      if (!expenseEntry) return
      const account = netWorthEntries.find(entry => entry.id === expenseEntry.accountId)
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
      if (incomeEntry) { setIncomeEntries(previous => [...previous, incomeEntry]); setActiveForm(null); setToastMessage('Your income was saved successfully.') }
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
        setCategoryEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: [...(previous[currentCycleKey] ?? []).filter(entry => entry.id !== newCategoryDefinition.id && entry.name !== newCategoryDefinition.name), { ...newCategoryDefinition, amount: categoryRequest.entry.amount }] }))
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
        setNetWorthEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: [...(previous[currentCycleKey] ?? []), accountRequest.entry] }))
        setActiveForm(null); setToastMessage('Your account was added successfully.')
      } else {
        setNetWorthEntriesByMonth(previous => ({ ...previous, [currentCycleKey]: (previous[currentCycleKey] ?? []).map(entry => entry.id === accountRequest.entry.id ? { ...entry, amount: Number(entry.amount ?? 0) + accountRequest.entry.amount } : entry) }))
        setActiveForm(null); setToastMessage('Money was added to your account successfully.')
      }
      return
    }

    event.target.reset(); setActiveForm(null); setToastMessage(`${activeForm} was saved successfully.`)
  }

  function renderCard() {
    if (!activeForm) return null
    return <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="add-form-title"><AddForm formType={activeForm} entries={activeForm === 'Categories' ? categoryEntries : activeForm === 'Net-Worth' ? netWorthEntries : categoryEntries} accounts={netWorthEntries} onSubmit={handleAddFormSubmit} onClose={() => setActiveForm(null)} /></div>
  }

  if (!cloudReady) return <div className="app-container" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}><div><h2>{syncStatus === 'offline' ? 'Unable to connect to Redis' : 'Loading your finance data…'}</h2><p>{cloudError || 'Reading the latest data from the cloud.'}</p></div></div>

  return <div className="app-container"><Navigation /><main className="content-container"><Routes>
    <Route path="/" element={<Dashboard expenseEntries={filteredExpenseEntries} allExpenseEntries={expenseEntries} incomeEntries={filteredIncomeEntries} categoryEntries={categoryEntries} budgets={budgets} onOpenAddForm={() => openAddForm('Expenses')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} />} />
    <Route path="/budget" element={<Budget categoryEntries={categoryEntries} expenseEntries={filteredExpenseEntries} onOpenAddForm={() => openAddForm('Categories')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateCategoryAmount={updateCategoryAmount} onDeleteCategoryEntry={deleteCategoryEntry} />} />
    <Route path="/transactions" element={<Transactions expenseEntries={filteredExpenseEntries} categoryEntries={categoryEntries} accounts={netWorthEntries} transfers={transfers.filter(transfer => filterExpensesByDate([transfer], monthStart, monthEnd).length > 0)} onOpenAddForm={() => openAddForm('Expenses')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateExpenseEntry={updateExpenseEntry} onDeleteExpenseEntry={deleteExpenseEntry} />} />
    <Route path="/income" element={<Income incomeEntries={filteredIncomeEntries} onOpenAddForm={() => openAddForm('Income')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateIncomeEntry={updateIncomeEntry} onDeleteIncomeEntry={deleteIncomeEntry} />} />
    <Route path="/net-worth" element={<NetWorth netWorthEntries={netWorthEntries} onOpenAddForm={() => openAddForm('Net-Worth')} onUpdateNetWorthEntry={updateNetWorthEntry} onDeleteNetWorthEntry={deleteNetWorthEntry} onTransfer={handleTransfer} />} />
  </Routes></main>{renderCard()}{toastMessage && <ToastNotification message={toastMessage} onClose={() => setToastMessage('')} />}</div>
}

export default App
