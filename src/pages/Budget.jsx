import { useState } from 'react'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Budget = ({ categoryEntries, expenseEntries, onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange, onUpdateCategoryAmount, onDeleteCategoryEntry, onReallocateBudget }) => {
  const [editingCategory, setEditingCategory] = useState(null)
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState(null)
  const [draftAmount, setDraftAmount] = useState('')
  const [reallocationOpen, setReallocationOpen] = useState(false)
  const [reallocationSourceId, setReallocationSourceId] = useState('')
  const [reallocationTargetId, setReallocationTargetId] = useState('')
  const [reallocationAmount, setReallocationAmount] = useState('')

  const handleEditStart = (entry) => {
    setEditingCategory(entry)
    setDraftAmount(String(entry.amount))
  }

  const handleSave = () => {
    if (!onUpdateCategoryAmount || !editingCategory) {
      return
    }

    const nextAmount = Number(draftAmount)

    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      return
    }

    onUpdateCategoryAmount(editingCategory.id, nextAmount)
    setEditingCategory(null)
    setDraftAmount('')
  }

  const getSpent = (entry) => expenseEntries
    .filter((expense) => expense.category === entry.name)
    .reduce((total, expense) => total + Number(expense.amount ?? 0), 0)

  const openReallocation = (entry) => {
    const remaining = Number(entry.amount ?? 0) - getSpent(entry)
    setReallocationSourceId(remaining > 0 ? entry.id : '')
    setReallocationTargetId(remaining < 0 ? entry.id : '')
    setReallocationAmount('')
    setReallocationOpen(true)
  }

  const closeReallocation = () => {
    setReallocationOpen(false)
    setReallocationSourceId('')
    setReallocationTargetId('')
    setReallocationAmount('')
  }

  const sourceEntries = categoryEntries.filter((entry) => {
    const remaining = Number(entry.amount ?? 0) - getSpent(entry)
    return remaining > 0 && entry.id !== reallocationTargetId
  })

  const targetEntries = categoryEntries.filter((entry) => entry.id !== reallocationSourceId)
  const selectedSource = categoryEntries.find((entry) => entry.id === reallocationSourceId)
  const selectedSourceRemaining = selectedSource ? Number(selectedSource.amount ?? 0) - getSpent(selectedSource) : 0

  const handleReallocation = () => {
    if (!onReallocateBudget) return
    const moved = onReallocateBudget(reallocationSourceId, reallocationTargetId, reallocationAmount)
    if (moved) closeReallocation()
  }

  const confirmDeleteCategory = () => {
    if (!onDeleteCategoryEntry || !pendingDeleteCategory) {
      return
    }

    onDeleteCategoryEntry(pendingDeleteCategory.id)
    setPendingDeleteCategory(null)
  }

  return (
    <div>
      <Header
        pageTitle={"Budget & Categories"}
        onOpenAddForm={onOpenAddForm}
        showMonthFilter
        monthValue={selectedMonth}
        onMonthChange={onMonthChange}
        budgetCycle={budgetCycle}
        onBudgetCycleChange={onBudgetCycleChange}
      />
      <div className="entry-list budget-list">
        {categoryEntries.length === 0 ? (
          <p className="empty-state">Add a category and its dedicated spending amount.</p>
        ) : categoryEntries.map((entry) => {
          const spent = expenseEntries
            .filter((expense) => expense.category === entry.name)
            .reduce((total, expense) => total + expense.amount, 0)
          const remaining = entry.amount - spent

          return (
            <div
              className="entry-list-item budget-card"
              key={entry.id}
              role="button"
              tabIndex={0}
              onClick={() => handleEditStart(entry)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  handleEditStart(entry)
                }
              }}
            >
              <div className="budget-card-header">
                <div>
                  <p className="budget-card-label">Category</p>
                  <h3>{entry.name}</h3>
                </div>
                <div className="budget-card-header-actions">
                  <span className="budget-card-badge">Allocated</span>
                  <button
                    type="button"
                    className="budget-card-delete-button"
                    aria-label={`Delete ${entry.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      setPendingDeleteCategory(entry)
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3.75A1.25 1.25 0 0 1 10.25 2.5h3.5A1.25 1.25 0 0 1 15 3.75V4h2.25a.75.75 0 0 1 0 1.5H17v11.25A2.75 2.75 0 0 1 14.25 19.5h-4.5A2.75 2.75 0 0 1 7 16.75V5.5H5.75a.75.75 0 0 1 0-1.5H8v-.25Zm1.5.75h3V4h-3v.5Zm-2.25 2.25h7.5v10.75a1.25 1.25 0 0 1-1.25 1.25h-4.5a1.25 1.25 0 0 1-1.25-1.25V6.5Zm1.5 2.25a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="budget-card-amount">
                <span className="budget-card-label">Dedicated</span>
                <strong>₱{entry.amount.toFixed(2)}</strong>
              </div>

              <div className="budget-card-metrics">
                <div>
                  <span className="budget-card-label">Spent</span>
                  <p>₱{spent.toFixed(2)}</p>
                </div>
                <div>
                  <span className="budget-card-label">{remaining < 0 ? 'Over budget' : 'Left'}</span>
                  <p className={remaining < 0 ? 'amount-negative' : ''}>₱{Math.abs(remaining).toFixed(2)}</p>
                </div>
              </div>
              <div className="budget-card-reallocation-row">
                <button
                  type="button"
                  className="budget-card-button budget-card-button-reallocate"
                  onClick={(event) => {
                    event.stopPropagation()
                    openReallocation(entry)
                  }}
                  disabled={!onReallocateBudget || (remaining <= 0 && categoryEntries.every((other) => other.id === entry.id || Number(other.amount ?? 0) - getSpent(other) <= 0))}
                >
                  {remaining < 0 ? 'Cover overspending' : 'Move left budget'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editingCategory && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-category-title">
          <div className="add-form edit-form" aria-labelledby="edit-category-title">
            <div className="add-form-header">
              <h3 id="edit-category-title">Edit {editingCategory.name}</h3>
              <button className="add-form-close" type="button" onClick={() => setEditingCategory(null)} aria-label="Close edit form">&times;</button>
            </div>
            <div className="add-form-fields">
              <label className="add-form-label" htmlFor="budget-edit-amount">Allocated Amount</label>
              <input
                id="budget-edit-amount"
                type="number"
                min="0"
                step="0.01"
                value={draftAmount}
                onChange={(event) => setDraftAmount(event.target.value)}
              />
              <div className="budget-card-actions single-action-row">
                <button type="button" className="budget-card-button budget-card-button-save" onClick={handleSave}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {reallocationOpen && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="reallocate-budget-title">
          <div className="add-form edit-form budget-reallocation-modal" aria-labelledby="reallocate-budget-title">
            <div className="add-form-header">
              <div>
                <p className="budget-reallocation-eyebrow">Flexible budgeting</p>
                <h3 id="reallocate-budget-title">Move budget between categories</h3>
              </div>
              <button className="add-form-close" type="button" onClick={closeReallocation} aria-label="Close budget reallocation">×</button>
            </div>
            <p className="budget-reallocation-description">Move unused budget from one category to another. If a category is over budget, use another category's remaining amount to cover it.</p>
            <div className="budget-reallocation-fields">
              <div className="transfer-field">
                <label className="add-form-label" htmlFor="budget-reallocation-source">From category</label>
                <select id="budget-reallocation-source" value={reallocationSourceId} onChange={(event) => { setReallocationSourceId(event.target.value); if (event.target.value === reallocationTargetId) setReallocationTargetId('') }}>
                  <option value="">Select source category</option>
                  {sourceEntries.map((entry) => {
                    const available = Number(entry.amount ?? 0) - getSpent(entry)
                    return <option key={entry.id} value={entry.id}>{entry.name} — ₱{available.toFixed(2)} left</option>
                  })}
                </select>
                <span className="budget-reallocation-helper">{selectedSource ? 'Available to move: ₱' + Math.max(0, selectedSourceRemaining).toFixed(2) : 'Only unused budget can be moved.'}</span>
              </div>
              <div className="transfer-field">
                <label className="add-form-label" htmlFor="budget-reallocation-target">To category</label>
                <select id="budget-reallocation-target" value={reallocationTargetId} onChange={(event) => setReallocationTargetId(event.target.value)}>
                  <option value="">Select destination category</option>
                  {targetEntries.map((entry) => {
                    const remaining = Number(entry.amount ?? 0) - getSpent(entry)
                    return <option key={entry.id} value={entry.id}>{entry.name}{remaining < 0 ? ' — ₱' + Math.abs(remaining).toFixed(2) + ' over' : ''}</option>
                  })}
                </select>
                <span className="budget-reallocation-helper">The destination budget increases by the amount moved.</span>
              </div>
              <div className="transfer-field">
                <label className="add-form-label" htmlFor="budget-reallocation-amount">Amount to move</label>
                <div className="transfer-amount-input">
                  <span>₱</span>
                  <input id="budget-reallocation-amount" type="number" min="0.01" max={Math.max(0, selectedSourceRemaining)} step="0.01" value={reallocationAmount} onChange={(event) => setReallocationAmount(event.target.value)} placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="budget-reallocation-preview">
              {selectedSource && reallocationTargetId && Number(reallocationAmount) > 0
                ? '₱' + Number(reallocationAmount).toFixed(2) + ' will move from ' + selectedSource.name + ' to ' + (categoryEntries.find((entry) => entry.id === reallocationTargetId)?.name ?? 'the selected category') + '.'
                : 'Choose a source, destination, and amount.'}
            </div>
            <div className="budget-card-actions edit-action-row">
              <button type="button" className="budget-card-button budget-card-button-cancel" onClick={closeReallocation}>Cancel</button>
              <button type="button" className="budget-card-button budget-card-button-save" onClick={handleReallocation} disabled={!reallocationSourceId || !reallocationTargetId || Number(reallocationAmount) <= 0 || Number(reallocationAmount) > selectedSourceRemaining}>Move budget</button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteCategory && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-category-title">
          <div className="add-form edit-form" aria-labelledby="delete-category-title">
            <div className="add-form-header">
              <h3 id="delete-category-title">Delete category?</h3>
              <button className="add-form-close" type="button" onClick={() => setPendingDeleteCategory(null)} aria-label="Close delete confirmation">&times;</button>
            </div>
            <p className="delete-confirmation-text">This will remove {pendingDeleteCategory.name} and its saved allocation from the selected period.</p>
            <div className="budget-card-actions single-action-row">
              <button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteCategory}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budget