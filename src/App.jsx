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
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

const STORAGE_KEYS = {
  expenses: 'finance-tracker-expenses',
  income: 'finance-tracker-income',
  categories: 'finance-tracker-category-definitions',
  categoryEntries: 'finance-tracker-category-entries',
  netWorth: 'finance-tracker-net-worth',
  budgets: 'finance-tracker-budgets',
}

const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback

  try {
    const stored = window.localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

const writeStorage = (key, value) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

function App() {
  const [activeForm, setActiveForm] = useState(null)
  const [expenseEntries, setExpenseEntries] = useState(() => readStorage(STORAGE_KEYS.expenses, []))
  const [incomeEntries, setIncomeEntries] = useState(() => readStorage(STORAGE_KEYS.income, []))
  const [categoryDefinitions, setCategoryDefinitions] = useState(() => readStorage(STORAGE_KEYS.categories, []))
  const [categoryEntriesByMonth, setCategoryEntriesByMonth] = useState(() => readStorage(STORAGE_KEYS.categoryEntries, {}))
  const [netWorthEntriesByMonth, setNetWorthEntriesByMonth] = useState(() => readStorage(STORAGE_KEYS.netWorth, {}))
  const [budgets, setBudgets] = useState(() => readStorage(STORAGE_KEYS.budgets, []))
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [budgetCycle, setBudgetCycle] = useState('monthly')
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => writeStorage(STORAGE_KEYS.expenses, expenseEntries), [expenseEntries])
  useEffect(() => writeStorage(STORAGE_KEYS.income, incomeEntries), [incomeEntries])
  useEffect(() => writeStorage(STORAGE_KEYS.categories, categoryDefinitions), [categoryDefinitions])
  useEffect(() => writeStorage(STORAGE_KEYS.categoryEntries, categoryEntriesByMonth), [categoryEntriesByMonth])
  useEffect(() => writeStorage(STORAGE_KEYS.netWorth, netWorthEntriesByMonth), [netWorthEntriesByMonth])
  useEffect(() => writeStorage(STORAGE_KEYS.budgets, budgets), [budgets])

  const getCycleKey = (monthValue, cycleMode) => {
    if (!monthValue) return ''
    if (cycleMode === 'fortnightly-1') return `${monthValue}-1-15`
    if (cycleMode === 'fortnightly-2') return `${monthValue}-16-end`
    return `${monthValue}-monthly`
  }

  const currentCycleKey = getCycleKey(selectedMonth, budgetCycle)
  const cycleKeysToDisplay = budgetCycle === 'monthly'
    ? [getCycleKey(selectedMonth, 'fortnightly-1'), getCycleKey(selectedMonth, 'fortnightly-2'), currentCycleKey]
    : [currentCycleKey]

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

    if (cycleMode === 'fortnightly-1') {
      return { monthStart: `${monthValue}-01`, monthEnd: `${monthValue}-15` }
    }

    if (cycleMode === 'fortnightly-2') {
      return { monthStart: `${monthValue}-16`, monthEnd: `${monthValue}-${String(lastDay).padStart(2, '0')}` }
    }

    return { monthStart: `${monthValue}-01`, monthEnd: `${monthValue}-${String(lastDay).padStart(2, '0')}` }
  }

  const { monthStart, monthEnd } = getCycleRange(selectedMonth, budgetCycle)
  const filteredExpenseEntries = filterExpensesByDate(expenseEntries, monthStart, monthEnd)
  const filteredIncomeEntries = filterExpensesByDate(incomeEntries, monthStart, monthEnd)
  const monthlyIncomeTotal = filteredIncomeEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)
  const currentAllocationTotal = categoryEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0) + netWorthEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)

  function openAddForm(formType) {
    setActiveForm(formType)
  }

  function updateCategoryAmount(categoryId, amount) {
    const safeAmount = Number(amount)
    if (!Number.isFinite(safeAmount) || safeAmount < 0) return false

    const categoryDefinition = categoryDefinitions.find((entry) => entry.id === categoryId)
    if (!categoryDefinition) return false

    setCategoryEntriesByMonth(previous => ({
      ...previous,
      [currentCycleKey]: [
        ...(previous[currentCycleKey] ?? []).filter((entry) => entry.id !== categoryId && entry.name !== categoryDefinition.name),
        { ...categoryDefinition, amount: safeAmount },
      ],
    }))
    return true
  }

  function deleteCategoryEntry(categoryId) {
    const categoryDefinition = categoryDefinitions.find((entry) => entry.id === categoryId)
    setCategoryDefinitions(previous => previous.filter((entry) => entry.id !== categoryId))
    setCategoryEntriesByMonth(previous => {
      const next = { ...previous }
      Object.keys(next).forEach((key) => {
        next[key] = (next[key] ?? []).filter((entry) => entry.id !== categoryId && (!categoryDefinition || entry.name !== categoryDefinition.name))
      })
      return next
    })
    return true
  }

  function updateExpenseEntry(expenseId, updatedEntry) {
    setExpenseEntries(previous => previous.map((entry) => entry.id === expenseId ? { ...entry, ...updatedEntry } : entry))
  }

  function deleteExpenseEntry(expenseId) {
    setExpenseEntries(previous => previous.filter((entry) => entry.id !== expenseId))
    return true
  }

  function updateIncomeEntry(incomeId, updatedEntry) {
    setIncomeEntries(previous => previous.map((entry) => entry.id === incomeId ? { ...entry, ...updatedEntry } : entry))
  }

  function deleteIncomeEntry(incomeId) {
    setIncomeEntries(previous => previous.filter((entry) => entry.id !== incomeId))
    return true
  }

  function updateNetWorthEntry(netWorthId, updatedEntry) {
    const nextAmount = Number(updatedEntry.amount)
    const nextName = updatedEntry.name?.trim() ?? ''
    if (!Number.isFinite(nextAmount) || nextAmount < 0 || !nextName) return false

    setNetWorthEntriesByMonth(previous => ({
      ...previous,
      [currentCycleKey]: (previous[currentCycleKey] ?? []).map((entry) => (
        entry.id === netWorthId ? { ...entry, name: nextName, amount: nextAmount } : entry
      )),
    }))
    return true
  }

  function deleteNetWorthEntry(netWorthId) {
    setNetWorthEntriesByMonth(previous => ({
      ...previous,
      [currentCycleKey]: (previous[currentCycleKey] ?? []).filter((entry) => entry.id !== netWorthId),
    }))
    return true
  }

  function handleAddFormSubmit(event) {
    event.preventDefault()

    if (activeForm === 'Expenses') {
      const expenseEntry = createExpenseFromForm(event)
      if (expenseEntry) {
        setExpenseEntries(previous => [...previous, expenseEntry])
        setActiveForm(null)
        setToastMessage('Your expense was saved successfully.')
      }
      return
    }

    if (activeForm === 'Income') {
      const incomeEntry = createIncomeFromForm(event)
      if (incomeEntry) {
        setIncomeEntries(previous => [...previous, incomeEntry])
        setActiveForm(null)
        setToastMessage('Your income was saved successfully.')
      }
      return
    }

    if (activeForm === 'Categories') {
      const categoryRequest = createCategoriesFromForm(event)
      if (!categoryRequest) return

      const newAllocationTotal = currentAllocationTotal + categoryRequest.entry.amount
      if (monthlyIncomeTotal > 0 && newAllocationTotal > monthlyIncomeTotal) {
        setToastMessage('This allocation exceeds your income for the selected month.')
        return
      }

      if (categoryRequest.selectedEntryId === 'new') {
        const newCategoryDefinition = { id: categoryRequest.entry.id, name: categoryRequest.entry.name }
        if (!categoryDefinitions.some((entry) => entry.name === newCategoryDefinition.name)) {
          setCategoryDefinitions(previous => [...previous, newCategoryDefinition])
        }
        setCategoryEntriesByMonth(previous => ({
          ...previous,
          [currentCycleKey]: [
            ...(previous[currentCycleKey] ?? []).filter((entry) => entry.id !== newCategoryDefinition.id && entry.name !== newCategoryDefinition.name),
            { ...newCategoryDefinition, amount: categoryRequest.entry.amount },
          ],
        }))
        setActiveForm(null)
        setToastMessage('Your category was saved successfully.')
      } else {
        const currentCategory = categoryDefinitions.find((entry) => entry.id === categoryRequest.entry.id)
        setCategoryEntriesByMonth(previous => ({
          ...previous,
          [currentCycleKey]: (previous[currentCycleKey] ?? []).map((entry) => (
            entry.id === categoryRequest.entry.id || (currentCategory && entry.name === currentCategory.name)
              ? { ...entry, amount: Number(entry.amount ?? 0) + categoryRequest.entry.amount }
              : entry
          )),
        }))
        setActiveForm(null)
        setToastMessage('Money was added to your category successfully.')
      }
      return
    }

    if (activeForm === 'Net-Worth') {
      const netWorthRequest = createNetWorthFromForm(event)
      if (!netWorthRequest) return

      const newAllocationTotal = currentAllocationTotal + netWorthRequest.entry.amount
      if (monthlyIncomeTotal > 0 && newAllocationTotal > monthlyIncomeTotal) {
        setToastMessage('This savings allocation exceeds your income for the selected month.')
        return
      }

      if (netWorthRequest.selectedEntryId === 'new') {
        setNetWorthEntriesByMonth(previous => ({
          ...previous,
          [currentCycleKey]: [...(previous[currentCycleKey] ?? []), netWorthRequest.entry],
        }))
        setActiveForm(null)
        setToastMessage('Your net worth was saved successfully.')
      } else {
        setNetWorthEntriesByMonth(previous => ({
          ...previous,
          [currentCycleKey]: (previous[currentCycleKey] ?? []).map((entry) => (
            entry.id === netWorthRequest.entry.id
              ? { ...entry, amount: Number(entry.amount ?? 0) + netWorthRequest.entry.amount }
              : entry
          )),
        }))
        setActiveForm(null)
        setToastMessage('Money was added to your net worth successfully.')
      }
      return
    }

    event.target.reset()
    setActiveForm(null)
    setToastMessage(`${activeForm} was saved successfully.`)
  }

  function renderCard() {
    if (!activeForm) return null

    return (
      <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="add-form-title">
        <AddForm
          formType={activeForm}
          entries={activeForm === 'Categories' ? categoryEntries : activeForm === 'Net-Worth' ? netWorthEntries : categoryEntries}
          onSubmit={handleAddFormSubmit}
          onClose={() => setActiveForm(null)}
        />
      </div>
    )
  }

  return (
    <div className="app-container">
      <Navigation />
      <main className="content-container">
        <Routes>
          <Route path="/" element={<Dashboard expenseEntries={filteredExpenseEntries} allExpenseEntries={expenseEntries} incomeEntries={filteredIncomeEntries} categoryEntries={categoryEntries} budgets={budgets} onOpenAddForm={() => openAddForm('Expenses')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} />} />
          <Route path="/budget" element={<Budget categoryEntries={categoryEntries} expenseEntries={filteredExpenseEntries} onOpenAddForm={() => openAddForm('Categories')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateCategoryAmount={updateCategoryAmount} onDeleteCategoryEntry={deleteCategoryEntry} />} />
          <Route path="/transactions" element={<Transactions expenseEntries={filteredExpenseEntries} categoryEntries={categoryEntries} onOpenAddForm={() => openAddForm('Expenses')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateExpenseEntry={updateExpenseEntry} onDeleteExpenseEntry={deleteExpenseEntry} />} />
          <Route path="/income" element={<Income incomeEntries={filteredIncomeEntries} onOpenAddForm={() => openAddForm('Income')} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} budgetCycle={budgetCycle} onBudgetCycleChange={setBudgetCycle} onUpdateIncomeEntry={updateIncomeEntry} onDeleteIncomeEntry={deleteIncomeEntry} />} />
          <Route path="/net-worth" element={<NetWorth netWorthEntries={netWorthEntries} onOpenAddForm={() => openAddForm('Net-Worth')} onUpdateNetWorthEntry={updateNetWorthEntry} onDeleteNetWorthEntry={deleteNetWorthEntry} />} />
        </Routes>
      </main>
      {renderCard()}
      {toastMessage && <ToastNotification message={toastMessage} onClose={() => setToastMessage('')} />}
    </div>
  )
}

export default App
