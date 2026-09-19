import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faTrashCan } from '@fortawesome/free-solid-svg-icons'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Income = ({ incomeEntries, accounts = [], onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange, onUpdateIncomeEntry, onDeleteIncomeEntry }) => {
  const [editingIncome, setEditingIncome] = useState(null)
  const [pendingDeleteIncome, setPendingDeleteIncome] = useState(null)
  const [draft, setDraft] = useState({ title: '', amount: '', date: '', accountId: '' })
  const totalIncome = incomeEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)

  const getAccountName = (incomeEntry) => accounts.find(account => account.id === incomeEntry.accountId)?.name || incomeEntry.account || 'Account not recorded'

  const handleEditStart = (incomeEntry) => {
    setEditingIncome(incomeEntry)
    setDraft({
      title: incomeEntry.title,
      amount: String(incomeEntry.amount),
      date: incomeEntry.date.toISOString().slice(0, 10),
      accountId: incomeEntry.accountId || '',
    })
  }

  const handleSave = () => {
    if (!onUpdateIncomeEntry || !editingIncome) return

    const nextAmount = Number(draft.amount)
    const nextDate = new Date(draft.date)

    if (!draft.title.trim() || !draft.accountId || !Number.isFinite(nextAmount) || nextAmount <= 0 || Number.isNaN(nextDate.getTime())) return

    if (onUpdateIncomeEntry(editingIncome.id, {
      title: draft.title.trim(),
      amount: nextAmount,
      date: nextDate,
      accountId: draft.accountId,
    })) setEditingIncome(null)
  }

  const confirmDeleteIncome = () => {
    if (!onDeleteIncomeEntry || !pendingDeleteIncome) return
    if (onDeleteIncomeEntry(pendingDeleteIncome.id)) setPendingDeleteIncome(null)
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
                  <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                </button>
              </div>
            </div>
            <h3>{incomeEntry.title}</h3>
            <div className="budget-card-metrics">
              <div>
                <span className="budget-card-label">Amount</span>
                <p>₱{Number(incomeEntry.amount).toFixed(2)}</p>
              </div>
              <div>
                <span className="budget-card-label">Date</span>
                <p>{incomeEntry.date.toLocaleDateString('en-PH')}</p>
              </div>
              <div>
                <span className="budget-card-label">Account</span>
                <p>{getAccountName(incomeEntry)}</p>
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
              <button className="add-form-close" type="button" onClick={() => setEditingIncome(null)} aria-label="Close edit form"><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>
            </div>
            <div className="add-form-fields">
              <label className="add-form-label" htmlFor="income-edit-title">Source</label>
              <input id="income-edit-title" value={draft.title} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, title: event.target.value }))} />

              <label className="add-form-label" htmlFor="income-edit-account">Deposit into account</label>
              <select id="income-edit-account" value={draft.accountId} onChange={(event) => setDraft((previousDraft) => ({ ...previousDraft, accountId: event.target.value }))} required>
                <option value="" disabled>Select an account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>

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
              <button className="add-form-close" type="button" onClick={() => setPendingDeleteIncome(null)} aria-label="Close delete confirmation"><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>
            </div>
            <p className="delete-confirmation-text">This will remove {pendingDeleteIncome.title} from the selected period.</p>
            <div className="budget-card-actions single-action-row">
              <button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteIncome}><FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Income
