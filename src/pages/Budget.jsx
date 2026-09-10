import { useState } from 'react'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Budget = ({ categoryEntries, expenseEntries, onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange, onUpdateCategoryAmount, onDeleteCategoryEntry }) => {
  const [editingCategory, setEditingCategory] = useState(null)
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState(null)
  const [draftAmount, setDraftAmount] = useState('')

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

  const handleDelete = () => {
    if (!onDeleteCategoryEntry || !editingCategory) {
      return
    }

    onDeleteCategoryEntry(editingCategory.id)
    setEditingCategory(null)
    setDraftAmount('')
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
                  <span className="budget-card-label">Left</span>
                  <p className={remaining < 0 ? 'amount-negative' : ''}>₱{remaining.toFixed(2)}</p>
                </div>
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