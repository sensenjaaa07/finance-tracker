import { useMemo, useState } from 'react'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Transactions = ({ expenseEntries, categoryEntries = [], accounts = [], transfers = [], onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange, onUpdateExpenseEntry, onDeleteExpenseEntry }) => {
  const [editingExpense, setEditingExpense] = useState(null)
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null)
  const [draft, setDraft] = useState({ title: '', category: '', amount: '', date: '', accountId: '' })
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [searchFilter, setSearchFilter] = useState('')

  const categoryOptions = categoryEntries.map(category => category.name)
  const accountOptions = accounts.map(account => account.name)

  const filteredExpenses = useMemo(() => expenseEntries.filter(expense => {
    if (typeFilter === 'transfer') return false
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false
    const accountName = accounts.find(account => account.id === expense.accountId)?.name || expense.account || 'Account not recorded'
    if (accountFilter !== 'all' && accountName !== accountFilter) return false
    if (searchFilter.trim()) {
      const query = searchFilter.trim().toLowerCase()
      if (!`${expense.title} ${expense.category} ${accountName}`.toLowerCase().includes(query)) return false
    }
    return true
  }), [expenseEntries, accounts, typeFilter, categoryFilter, accountFilter, searchFilter])

  const filteredTransfers = useMemo(() => transfers.filter(transfer => {
    if (typeFilter === 'expense') return false
    if (accountFilter !== 'all' && transfer.fromAccount !== accountFilter && transfer.toAccount !== accountFilter) return false
    if (searchFilter.trim()) {
      const query = searchFilter.trim().toLowerCase()
      if (!`${transfer.fromAccount} ${transfer.toAccount} account transfer`.toLowerCase().includes(query)) return false
    }
    return true
  }), [transfers, typeFilter, accountFilter, searchFilter])

  const clearFilters = () => {
    setTypeFilter('all')
    setCategoryFilter('all')
    setAccountFilter('all')
    setSearchFilter('')
  }

  const hasFilters = typeFilter !== 'all' || categoryFilter !== 'all' || accountFilter !== 'all' || searchFilter.trim() !== ''
  const transactionCount = filteredExpenses.length + filteredTransfers.length

  const handleEditStart = (expenseEntry) => {
    setEditingExpense(expenseEntry)
    setDraft({ title: expenseEntry.title, category: expenseEntry.category, amount: String(expenseEntry.amount), date: expenseEntry.date.toISOString().slice(0, 10), accountId: expenseEntry.accountId || '' })
  }

  const handleSave = () => {
    if (!onUpdateExpenseEntry || !editingExpense) return
    const nextAmount = Number(draft.amount)
    const nextDate = new Date(draft.date)
    if (!draft.title.trim() || !draft.category.trim() || !draft.accountId || !Number.isFinite(nextAmount) || nextAmount <= 0 || Number.isNaN(nextDate.getTime())) return
    onUpdateExpenseEntry(editingExpense.id, { title: draft.title.trim(), category: draft.category.trim(), amount: nextAmount, date: nextDate, accountId: draft.accountId })
    setEditingExpense(null)
  }

  const confirmDeleteExpense = () => {
    if (!onDeleteExpenseEntry || !pendingDeleteExpense) return
    onDeleteExpenseEntry(pendingDeleteExpense.id)
    setPendingDeleteExpense(null)
  }

  return (
    <div>
      <Header pageTitle="Transactions" onOpenAddForm={onOpenAddForm} showMonthFilter monthValue={selectedMonth} onMonthChange={onMonthChange} budgetCycle={budgetCycle} onBudgetCycleChange={onBudgetCycleChange} />
      <div className="transactions-filter-bar">
        <div className="transactions-filter-header"><div><p className="chart-eyebrow">Transaction filters</p><strong>{transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}</strong></div>{hasFilters && <button type="button" className="transaction-filter-clear" onClick={clearFilters}>Clear filters</button>}</div>
        <div className="transactions-filter-controls">
          <div className="transaction-filter-search"><label htmlFor="transaction-search">Search</label><input id="transaction-search" type="search" placeholder="Search transactions..." value={searchFilter} onChange={event => setSearchFilter(event.target.value)} /></div>
          <div><label htmlFor="transaction-type-filter">Type</label><select id="transaction-type-filter" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="transfer">Transfers</option></select></div>
          <div><label htmlFor="transaction-category-filter">Category</label><select id="transaction-category-filter" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categoryOptions.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
          <div><label htmlFor="transaction-account-filter">Account</label><select id="transaction-account-filter" value={accountFilter} onChange={event => setAccountFilter(event.target.value)}><option value="all">All accounts</option>{accountOptions.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
        </div>
      </div>
      <div className="transactions-table-wrapper">
        {transactionCount === 0 ? <p className="empty-state">{hasFilters ? 'No transactions match your filters.' : 'No transactions have been recorded yet.'}</p> : <table className="transactions-table">
          <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Account</th><th className="transactions-amount">Amount</th><th className="transactions-actions">Actions</th></tr></thead>
          <tbody>
            {filteredExpenses.map(expenseEntry => {
              const accountName = accounts.find(account => account.id === expenseEntry.accountId)?.name || expenseEntry.account || 'Account not recorded'
              return <tr key={`expense-${expenseEntry.id}`}>
                <td className="transaction-date">{expenseEntry.date.toLocaleDateString()}</td>
                <td><span className="transaction-type transaction-type-expense">Expense</span></td>
                <td className="transaction-title-cell">{expenseEntry.title}<small>{expenseEntry.category}</small></td>
                <td className="transaction-account-cell">{accountName}</td>
                <td className="transactions-amount transaction-expense-amount">-₱{Number(expenseEntry.amount).toFixed(2)}</td>
                <td className="transactions-actions"><div className="transaction-row-actions"><button type="button" className="transaction-action-button" onClick={() => handleEditStart(expenseEntry)}>Edit</button><button type="button" className="transaction-action-button transaction-action-delete" onClick={() => setPendingDeleteExpense(expenseEntry)}>Delete</button></div></td>
              </tr>
            })}
            {filteredTransfers.map(transfer => (
              <tr key={`transfer-${transfer.id}`}>
                <td className="transaction-date">{new Date(transfer.date).toLocaleDateString()}</td>
                <td><span className="transaction-type transaction-type-transfer">Transfer</span></td>
                <td className="transaction-title-cell">{transfer.fromAccount} → {transfer.toAccount}<small>Account transfer</small></td>
                <td className="transaction-account-cell">{transfer.fromAccount} → {transfer.toAccount}</td>
                <td className="transactions-amount transaction-transfer-amount">₱{Number(transfer.amount).toFixed(2)}</td>
                <td className="transactions-actions"><span className="transaction-logged">Logged</span></td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

      {editingExpense && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="edit-transaction-title">Edit expense</h3><button className="add-form-close" type="button" onClick={() => setEditingExpense(null)} aria-label="Close edit form">&times;</button></div><div className="add-form-fields">
        <label className="add-form-label" htmlFor="transaction-edit-title">Title</label><input id="transaction-edit-title" value={draft.title} onChange={event => setDraft(previous => ({ ...previous, title: event.target.value }))} />
        <label className="add-form-label" htmlFor="transaction-edit-category">Category</label><select id="transaction-edit-category" value={draft.category} onChange={event => setDraft(previous => ({ ...previous, category: event.target.value }))}><option value="">Select a category</option>{categoryOptions.map(name => <option key={name} value={name}>{name}</option>)}</select>
        <label className="add-form-label" htmlFor="transaction-edit-account">Deduct from account</label><select id="transaction-edit-account" value={draft.accountId} onChange={event => setDraft(previous => ({ ...previous, accountId: event.target.value }))}><option value="">Select an account</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} — ₱{Number(account.amount ?? 0).toFixed(2)}</option>)}</select>
        <div className="edit-form-grid"><div><label className="add-form-label" htmlFor="transaction-edit-amount">Amount</label><input id="transaction-edit-amount" type="number" min="0.01" step="0.01" value={draft.amount} onChange={event => setDraft(previous => ({ ...previous, amount: event.target.value }))} /></div><div><label className="add-form-label" htmlFor="transaction-edit-date">Date</label><input id="transaction-edit-date" type="date" value={draft.date} onChange={event => setDraft(previous => ({ ...previous, date: event.target.value }))} /></div></div>
        <div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-save" onClick={handleSave}>Save</button></div>
      </div></div></div>}
      {pendingDeleteExpense && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-expense-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="delete-expense-title">Delete expense?</h3><button className="add-form-close" type="button" onClick={() => setPendingDeleteExpense(null)} aria-label="Close delete confirmation">&times;</button></div><p className="delete-confirmation-text">This will remove {pendingDeleteExpense.title} from the selected period.</p><div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteExpense}>Delete</button></div></div></div>}
    </div>
  )
}

export default Transactions
