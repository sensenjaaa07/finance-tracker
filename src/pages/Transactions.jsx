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
    if (!onUpdateExpenseEntry || !editingExpense) return

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
    if (!onDeleteExpenseEntry || !pendingDeleteExpense) return

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

      <div className="transactions-table-wrapper">
        {expenseEntries.length === 0 ? (
          <p className="empty-state">No expenses have been recorded yet.</p>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th className="transactions-amount">Amount</th>
                <th className="transactions-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenseEntries.map((expenseEntry) => (
                <tr key={expenseEntry.id}>
                  <td>{expenseEntry.date.toLocaleDateString()}</td>
                  <td className="transaction-title-cell">{expenseEntry.title}</td>
                  <td>{expenseEntry.category}</td>
                  <td className="transactions-amount">₱{expenseEntry.amount.toFixed(2)}</td>
                  <td className="transactions-actions">
                    <div className="transaction-row-actions">
                      <button type="button" className="transaction-action-button" onClick={() => handleEditStart(expenseEntry)}>Edit</button>
                      <button
                        type="button"
                        className="transaction-action-button transaction-action-delete"
                        onClick={() => setPendingDeleteExpense(expenseEntry)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
