import '../src/assets/styles/App.css'
import Navigation from './components/Navigation.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Budget from './pages/Budget.jsx'
import Transactions from './pages/Transactions.jsx'
import NetWorth from './pages/NetWorth.jsx'
import AddForm from './components/cards/AddForm.jsx'
import ToastNotification from './components/cards/ToastNotification.jsx'
import createExpenseFromForm from './services/createExpenseFromForm.js'
import createCategoriesFromForm from './services/createCategoriesFromForm.js'
import createNetWorthFromForm from './services/createNetWorthFromForm.js'
import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'

function App() {
  const [activeForm, setActiveForm] = useState(null)
  const [expenseEntries, setExpenseEntries] = useState([])
  const [categoryEntries, setCategoryEntries] = useState([])
  const [netWorthEntries, setNetWorthEntries] = useState([])
  const [toastMessage, setToastMessage] = useState('')

  function openAddForm(formType) {
    setActiveForm(formType)
  }

  function handleAddFormSubmit(event) {
    event.preventDefault()

    if (activeForm === 'Expenses') {
      const expenseEntry = createExpenseFromForm(event)

      if (expenseEntry) {
        setExpenseEntries(previousEntries => [...previousEntries, expenseEntry])
        setActiveForm(null)
        setToastMessage('Your expense was saved successfully.')
      }
      return
    }

    if (activeForm === 'Categories') {
      const categoryRequest = createCategoriesFromForm(event)

      if (categoryRequest?.selectedEntryId === 'new') {
        setCategoryEntries(previousEntries => [
          ...previousEntries,
          categoryRequest.entry,
        ])
        setActiveForm(null)
        setToastMessage('Your category was saved successfully.')
      } else if (categoryRequest) {
        setCategoryEntries(previousEntries => previousEntries.map(entry => (
          entry.id === categoryRequest.entry.id
            ? { ...entry, amount: entry.amount + categoryRequest.entry.amount }
            : entry
        )))
        setActiveForm(null)
        setToastMessage('Money was added to your category successfully.')
      }
      return
    }

    if (activeForm === 'Net-Worth') {
      const netWorthRequest = createNetWorthFromForm(event)

      if (netWorthRequest?.selectedEntryId === 'new') {
        setNetWorthEntries(previousEntries => [
          ...previousEntries,
          netWorthRequest.entry,
        ])
        setActiveForm(null)
        setToastMessage('Your net worth was saved successfully.')
      } else if (netWorthRequest) {
        setNetWorthEntries(previousEntries => previousEntries.map(entry => (
          entry.id === netWorthRequest.entry.id
            ? { ...entry, amount: entry.amount + netWorthRequest.entry.amount }
            : entry
        )))
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
    if (!activeForm) {
      return null
    }

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
          <Route path="/" element={<Dashboard expenseEntries={expenseEntries} categoryEntries={categoryEntries} onOpenAddForm={() => openAddForm('Expenses')} />} />
          <Route path="/budget" element={<Budget categoryEntries={categoryEntries} expenseEntries={expenseEntries} onOpenAddForm={() => openAddForm('Categories')} />} />
          <Route path="/transactions" element={<Transactions expenseEntries={expenseEntries} onOpenAddForm={() => openAddForm('Expenses')} />} />
          <Route path="/net-worth" element={<NetWorth netWorthEntries={netWorthEntries} onOpenAddForm={() => openAddForm('Net-Worth')} />} />
        </Routes>
      </main>
      {renderCard()}
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage('')} />
      )}
      </div>
  )
}

export default App
