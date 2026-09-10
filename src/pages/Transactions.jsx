import { useState } from 'react'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Transactions = ({ expenseEntries, categoryEntries = [], onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange, onUpdateExpenseEntry, onDeleteExpenseEntry }) => {
  const [editingExpense, setEditingExpense] = useState(null)
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null)
  const [draft, setDraft] = useState({ title: '', category: '', amount: '', date: '' })
  const categoryOptions = categoryEntries.map((category) => category.name)

  const handleEditStart = (expenseEntry) => {
    setEditingExpense(expenseEntry)
    setDraft({
      title: expenseEntry.title,
      category: expenseEntry.category,
      amount: String(expenseEntry.amount),
      date: expenseEntry.date.toISOString().slice(0, 10),
    })
  }

  const handleSave = () => {
    if (!onUpdateExpenseEntry || !editingExpense) {
      return
    }

    const nextAmount = Number(draft.amount)
    const nextDate = new Date(draft.date)

    if (!draft.title.trim() || !draft.category.trim() || !Number.isFinite(nextAmount) || nextAmount <= 0 || Number.isNaN(nextDate.getTime())) {
      return
    }

    onUpdateExpenseEntry(editingExpense.id, {
      title: draft.title.trim(),
      category: draft.category.trim(),
      amount: nextAmount,
      date: nextDate,
    })

    setEditingExpense(null)
  }

  const confirmDeleteExpense = () => {
    if (!onDeleteExpenseEntry || !pendingDeleteExpense) {
      return
    }

    onDeleteExpenseEntry(pendingDeleteExpense.id)
    setPendingDeleteExpense(null)
  }

  return (
    <div>
      <Header
        pageTitle={"Transactions"}
        onOpenAddForm={onOpenAddForm}
        showMonthFilter
        monthValue={selectedMonth}
        onMonthChange={onMonthChange}
        budgetCycle={budgetCycle}
        onBudgetCycleChange={onBudgetCycleChange}
      />
      <div className="entry-list">
        {expenseEntries.length === 0 ? (
          <p className="empty-state">No expenses have been recorded yet.</p>
        ) : expenseEntries.map((expenseEntry) => (
          <div
            className="entry-list-item info-card"
            key={expenseEntry.id}
            role="button"
            tabIndex={0}
            onClick={() => handleEditStart(expenseEntry)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleEditStart(expenseEntry)
              }
            }}
          >
            <div className="info-card-header">
              <p className="info-card-label">Expense</p>
              <div className="budget-card-header-actions">
                <span className="budget-card-badge">Recorded</span>
                <button
                  type="button"
                  className="budget-card-delete-button"
                  aria-label={`Delete ${expenseEntry.title}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setPendingDeleteExpense(expenseEntry)
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3.75A1.25 1.25 0 0 1 10.25 2.5h3.5A1.25 1.25 0 0 1 15 3.75V4h2.25a.75.75 0 0 1 0 1.5H17v11.25A2.75 2.75 0 0 1 14.25 19.5h-4.5A2.75 2.75 0 0 1 7 16.75V5.5H5.75a.75.75 0 0 1 0-1.5H8v-.25Zm1.5.75h3V4h-3v.5Zm-2.25 2.25h7.5v10.75a1.25 1.25 0 0 1-1.25 1.25h-4.5a1.25 1.25 0 0 1-1.25-1.25V6.5Zm1.5 2.25a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
            <h3>{expenseEntry.title}</h3>
            <div className="budget-card-metrics">
              <div>
                <span className="budget-card-label">Category</span>
                <p>{expenseEntry.category}</p>
              </div>
              <div>
                <span className="budget-card-label">Amount</span>
                <p>₱{expenseEntry.amount.toFixed(2)}</p>
              </div>
            </div>
            <p className="info-card-date">{expenseEntry.date.toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {editingExpense && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title">
          <div className="add-form edit-form" aria-labelledby="edit-transaction-title">
            <div className="add-form-header">
              <h3 id="edit-transaction-title">Edit expense</h3>
              <button className="add-form-close" type="button" onClick={() => setEditingExpense(null)} aria-label="Close edit form">&times;</button>
            </div>
            <div className="add-form-fields">
              <label className="add-form-label" htmlFor="transaction-edit-title">Title</label>
              <input id="transaction-edit-title" value={draft.title} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, title: event.target.value }))} />

              <label className="add-form-label" htmlFor="transaction-edit-category">Category</label>
              <select
                id="transaction-edit-category"
                value={draft.category}
                onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, category: event.target.value }))}
              >
                <option value="">Select a category</option>
                {categoryOptions.map((categoryName) => (
                  <option key={categoryName} value={categoryName}>{categoryName}</option>
                ))}
              </select>

              <div className="edit-form-grid">
                <div>
                  <label className="add-form-label" htmlFor="transaction-edit-amount">Amount</label>
                  <input id="transaction-edit-amount" type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, amount: event.target.value }))} />
                </div>
                <div>
                  <label className="add-form-label" htmlFor="transaction-edit-date">Date</label>
                  <input id="transaction-edit-date" type="date" value={draft.date} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, date: event.target.value }))} />
                </div>
              </div>

              <div className="budget-card-actions single-action-row">
                <button type="button" className="budget-card-button budget-card-button-save" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteExpense && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-expense-title">
          <div className="add-form edit-form" aria-labelledby="delete-expense-title">
            <div className="add-form-header">
              <h3 id="delete-expense-title">Delete expense?</h3>
              <button className="add-form-close" type="button" onClick={() => setPendingDeleteExpense(null)} aria-label="Close delete confirmation">&times;</button>
            </div>
            <p className="delete-confirmation-text">This will remove {pendingDeleteExpense.title} from the selected period.</p>
            <div className="budget-card-actions single-action-row">
              <button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteExpense}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions