import { useState } from 'react'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Income = ({ incomeEntries, onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange, onUpdateIncomeEntry, onDeleteIncomeEntry }) => {
  const [editingIncome, setEditingIncome] = useState(null)
  const [pendingDeleteIncome, setPendingDeleteIncome] = useState(null)
  const [draft, setDraft] = useState({ title: '', amount: '', date: '' })
  const totalIncome = incomeEntries.reduce((total, entry) => total + entry.amount, 0)

  const handleEditStart = (incomeEntry) => {
    setEditingIncome(incomeEntry)
    setDraft({
      title: incomeEntry.title,
      amount: String(incomeEntry.amount),
      date: incomeEntry.date.toISOString().slice(0, 10),
    })
  }

  const handleSave = () => {
    if (!onUpdateIncomeEntry || !editingIncome) {
      return
    }

    const nextAmount = Number(draft.amount)
    const nextDate = new Date(draft.date)

    if (!draft.title.trim() || !Number.isFinite(nextAmount) || nextAmount <= 0 || Number.isNaN(nextDate.getTime())) {
      return
    }

    onUpdateIncomeEntry(editingIncome.id, {
      title: draft.title.trim(),
      amount: nextAmount,
      date: nextDate,
    })

    setEditingIncome(null)
  }

  const confirmDeleteIncome = () => {
    if (!onDeleteIncomeEntry || !pendingDeleteIncome) {
      return
    }

    onDeleteIncomeEntry(pendingDeleteIncome.id)
    setPendingDeleteIncome(null)
  }

  return (
    <div>
      <Header
        pageTitle={'Income'}
        onOpenAddForm={onOpenAddForm}
        showMonthFilter
        monthValue={selectedMonth}
        onMonthChange={onMonthChange}
        budgetCycle={budgetCycle}
        onBudgetCycleChange={onBudgetCycleChange}
      />
      <div className="dashboard-summary">
        <div className="summary-card">
          <p>Total income</p>
          <strong>₱{totalIncome.toFixed(2)}</strong>
        </div>
      </div>
      <div className="entry-list">
        {incomeEntries.length === 0 ? (
          <p className="empty-state">No income has been recorded yet.</p>
        ) : incomeEntries.map((incomeEntry) => (
          <div
            className="entry-list-item info-card"
            key={incomeEntry.id}
            role="button"
            tabIndex={0}
            onClick={() => handleEditStart(incomeEntry)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleEditStart(incomeEntry)
              }
            }}
          >
            <div className="info-card-header">
              <p className="info-card-label">Income</p>
              <div className="budget-card-header-actions">
                <span className="budget-card-badge">Received</span>
                <button
                  type="button"
                  className="budget-card-delete-button"
                  aria-label={`Delete ${incomeEntry.title}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setPendingDeleteIncome(incomeEntry)
                  }}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 3.75A1.25 1.25 0 0 1 10.25 2.5h3.5A1.25 1.25 0 0 1 15 3.75V4h2.25a.75.75 0 0 1 0 1.5H17v11.25A2.75 2.75 0 0 1 14.25 19.5h-4.5A2.75 2.75 0 0 1 7 16.75V5.5H5.75a.75.75 0 0 1 0-1.5H8v-.25Zm1.5.75h3V4h-3v.5Zm-2.25 2.25h7.5v10.75a1.25 1.25 0 0 1-1.25 1.25h-4.5a1.25 1.25 0 0 1-1.25-1.25V6.5Zm1.5 2.25a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>
            <h3>{incomeEntry.title}</h3>
            <div className="budget-card-metrics">
              <div>
                <span className="budget-card-label">Amount</span>
                <p>₱{incomeEntry.amount.toFixed(2)}</p>
              </div>
              <div>
                <span className="budget-card-label">Date</span>
                <p>{incomeEntry.date.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingIncome && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-income-title">
          <div className="add-form edit-form" aria-labelledby="edit-income-title">
            <div className="add-form-header">
              <h3 id="edit-income-title">Edit income</h3>
              <button className="add-form-close" type="button" onClick={() => setEditingIncome(null)} aria-label="Close edit form">&times;</button>
            </div>
            <div className="add-form-fields">
              <label className="add-form-label" htmlFor="income-edit-title">Source</label>
              <input id="income-edit-title" value={draft.title} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, title: event.target.value }))} />

              <div className="edit-form-grid">
                <div>
                  <label className="add-form-label" htmlFor="income-edit-amount">Amount</label>
                  <input id="income-edit-amount" type="number" min="0.01" step="0.01" value={draft.amount} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, amount: event.target.value }))} />
                </div>
                <div>
                  <label className="add-form-label" htmlFor="income-edit-date">Date</label>
                  <input id="income-edit-date" type="date" value={draft.date} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, date: event.target.value }))} />
                </div>
              </div>

              <div className="budget-card-actions single-action-row">
                <button type="button" className="budget-card-button budget-card-button-save" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteIncome && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-income-title">
          <div className="add-form edit-form" aria-labelledby="delete-income-title">
            <div className="add-form-header">
              <h3 id="delete-income-title">Delete income?</h3>
              <button className="add-form-close" type="button" onClick={() => setPendingDeleteIncome(null)} aria-label="Close delete confirmation">&times;</button>
            </div>
            <p className="delete-confirmation-text">This will remove {pendingDeleteIncome.title} from the selected period.</p>
            <div className="budget-card-actions single-action-row">
              <button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteIncome}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Income
