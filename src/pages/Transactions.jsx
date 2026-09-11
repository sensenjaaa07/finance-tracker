import { useMemo, useState } from 'react'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Transactions = ({ expenseEntries, categoryEntries = [], accounts = [], transfers = [], onOpenAddForm, selectedMonth, onMonthChange, budgetCycle, onBudgetCycleChange, onUpdateExpenseEntry, onDeleteExpenseEntry }) => {
  const [editingExpense, setEditingExpense] = useState(null)
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [draft, setDraft] = useState({ title: '', category: '', amount: '', date: '', accountId: '' })
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [searchFilter, setSearchFilter] = useState('')

  const categoryOptions = categoryEntries.map(category => category.name)
  const accountOptions = accounts.map(account => account.name)

  const getAccountName = (expense) => accounts.find(account => account.id === expense.accountId)?.name || expense.account || 'Account not recorded'

  const filteredExpenses = useMemo(() => expenseEntries.filter(expense => {
    if (typeFilter === 'transfer') return false
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false
    const accountName = getAccountName(expense)
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
    setSelectedTransaction(null)
    setEditingExpense(expenseEntry)
    setDraft({
      title: expenseEntry.title,
      category: expenseEntry.category,
      amount: String(expenseEntry.amount),
      date: expenseEntry.date.toISOString().slice(0, 10),
      accountId: expenseEntry.accountId || ''
    })
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
    setSelectedTransaction(null)
  }

  const openExpenseDetails = (expenseEntry) => setSelectedTransaction({ type: 'expense', entry: expenseEntry })
  const openTransferDetails = (transfer) => setSelectedTransaction({ type: 'transfer', entry: transfer })

  const selectedIsExpense = selectedTransaction?.type === 'expense'
  const selectedEntry = selectedTransaction?.entry

  return (
    <div>
      <style>{`
        .transactions-filter-bar { margin: 0 var(--spacing-lg) var(--spacing-md); padding: 1.25rem; border: 1px solid var(--border-light); border-radius: var(--radius-lg); background: var(--bg-card); box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
        .transactions-filter-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1.1rem; }
        .transactions-filter-heading { display:flex; align-items:center; gap:.75rem; }
        .transactions-filter-icon { position:relative; display:block; width:2.4rem; height:2.4rem; flex:0 0 2.4rem; box-sizing:border-box; border-radius:.7rem; background:rgba(16,185,129,.1); color:var(--color-primary-dark); }
        .transactions-filter-icon svg { position:absolute; top:50%; left:50%; display:block; width:1.15rem; height:1.15rem; margin:0; transform:translate(-50%, -50%); }
        .transactions-filter-heading strong { display:block; color:var(--text-primary); font-size:.9rem; }
        .transactions-filter-heading span { display:block; margin-top:.15rem; color:var(--text-muted); font-size:.75rem; }
        .transaction-filter-clear { padding:.5rem .8rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:transparent; color:var(--text-secondary); font:inherit; font-size:.78rem; font-weight:var(--font-weight-semibold); cursor:pointer; transition:all var(--transition-fast) ease; }
        .transaction-filter-clear:hover { border-color:var(--color-primary); background:rgba(16,185,129,.06); color:var(--color-primary-dark); }
        .transactions-filter-controls { display:grid; grid-template-columns:minmax(240px,1.7fr) repeat(3,minmax(145px,1fr)); gap:.75rem; }
        .transaction-filter-field { min-width:0; }
        .transaction-filter-field label { display:block; margin:0 0 .4rem .1rem; color:var(--text-muted); font-size:.68rem; font-weight:var(--font-weight-bold); letter-spacing:.06em; text-transform:uppercase; }
        .transaction-filter-field input, .transaction-filter-field select { width:100%; height:2.75rem; box-sizing:border-box; padding:0 .85rem; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-card); color:var(--text-primary); font:inherit; font-size:.84rem; outline:none; transition:border-color var(--transition-fast) ease, box-shadow var(--transition-fast) ease; }
        .transaction-filter-field input::placeholder { color:var(--text-muted); }
        .transaction-filter-field input:focus, .transaction-filter-field select:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(16,185,129,.1); }

        .transactions-mobile-list { display:none; }
        .transaction-mobile-card { width:100%; box-sizing:border-box; padding:1rem; border:1px solid var(--border-light); border-radius:var(--radius-lg); background:var(--bg-card); box-shadow:0 8px 24px rgba(15,23,42,.06); text-align:left; cursor:pointer; transition:transform var(--transition-fast) ease, box-shadow var(--transition-fast) ease, border-color var(--transition-fast) ease; }
        .transaction-mobile-card:hover, .transaction-mobile-card:focus-visible { border-color:rgba(16,185,129,.35); box-shadow:0 12px 28px rgba(15,23,42,.1); outline:none; transform:translateY(-1px); }
        .transaction-mobile-card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:.75rem; margin-bottom:.9rem; }
        .transaction-mobile-card-title { min-width:0; }
        .transaction-mobile-card-title strong { display:block; overflow:hidden; color:var(--text-primary); font-size:.95rem; text-overflow:ellipsis; white-space:nowrap; }
        .transaction-mobile-card-title small { display:block; margin-top:.25rem; color:var(--text-muted); font-size:.72rem; }
        .transaction-mobile-card-amount { flex:0 0 auto; font-size:.95rem; font-weight:var(--font-weight-bold); white-space:nowrap; }
        .transaction-mobile-card-amount.expense { color:#b42318; }
        .transaction-mobile-card-amount.transfer { color:var(--color-primary-dark); }
        .transaction-mobile-card-summary { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.65rem; }
        .transaction-mobile-card-summary > div { min-width:0; padding:.65rem .7rem; border:1px solid var(--border-light); border-radius:var(--radius-md); background:#f8fafc; }
        .transaction-mobile-card-summary span { display:block; margin-bottom:.2rem; color:var(--text-muted); font-size:.64rem; font-weight:var(--font-weight-bold); letter-spacing:.06em; text-transform:uppercase; }
        .transaction-mobile-card-summary strong { display:block; overflow:hidden; color:var(--text-primary); font-size:.78rem; text-overflow:ellipsis; white-space:nowrap; }
        .transaction-mobile-card-footer { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-top:.85rem; color:var(--text-muted); font-size:.7rem; }
        .transaction-mobile-view { color:var(--color-primary-dark); font-weight:var(--font-weight-semibold); }
        .transaction-details-card { width:min(560px,calc(100vw - 32px)); max-height:calc(100vh - 32px); overflow:auto; padding:1.5rem; border:1px solid var(--border-light); border-radius:1.1rem; background:var(--bg-card); box-shadow:0 28px 70px rgba(15,23,42,.22); }
        .transaction-details-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; margin-bottom:1.25rem; }
        .transaction-details-header h3 { margin:0 0 .3rem; color:var(--text-primary); font-size:1.25rem; }
        .transaction-details-header p { margin:0; color:var(--text-muted); font-size:.8rem; }
        .transaction-details-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; }
        .transaction-detail-item { min-width:0; padding:.8rem; border:1px solid var(--border-light); border-radius:.75rem; background:#f8fafc; }
        .transaction-detail-item.full { grid-column:1/-1; }
        .transaction-detail-item span { display:block; margin-bottom:.25rem; color:var(--text-muted); font-size:.65rem; font-weight:var(--font-weight-bold); letter-spacing:.06em; text-transform:uppercase; }
        .transaction-detail-item strong { display:block; overflow-wrap:anywhere; color:var(--text-primary); font-size:.88rem; }
        .transaction-detail-amount.expense { color:#b42318; }
        .transaction-detail-amount.transfer { color:var(--color-primary-dark); }
        .transaction-details-actions { display:flex; gap:.65rem; margin-top:1.25rem; }
        .transaction-details-actions .transaction-action-button { flex:1; min-height:2.7rem; }

        @media (max-width:1000px) { .transactions-filter-controls { grid-template-columns:repeat(2,minmax(0,1fr)); } .transaction-filter-search { grid-column:1/-1; } }
        @media (max-width:900px) {
          .transactions-table-wrapper { display:none; }
          .transactions-mobile-list { display:grid; gap:.75rem; margin:0 var(--spacing-lg) var(--spacing-lg); }
        }
        @media (max-width:760px) {
          .transactions-filter-bar { margin-right:var(--spacing-md); margin-left:var(--spacing-md); padding:1rem; border-radius:var(--radius-md); }
          .transactions-filter-header { align-items:flex-start; }
          .transactions-filter-controls { grid-template-columns:1fr; }
          .transaction-filter-search { grid-column:auto; }
          .transactions-mobile-list { margin-right:var(--spacing-md); margin-left:var(--spacing-md); }
          .transaction-mobile-card-summary { grid-template-columns:1fr; }
          .transaction-details-card { width:calc(100vw - 24px); padding:1.1rem; border-radius:1rem; }
          .transaction-details-grid { grid-template-columns:1fr; }
          .transaction-detail-item.full { grid-column:auto; }
          .transaction-details-actions { flex-direction:column; }
        }
      `}</style>
      <Header pageTitle="Transactions" onOpenAddForm={onOpenAddForm} showMonthFilter monthValue={selectedMonth} onMonthChange={onMonthChange} budgetCycle={budgetCycle} onBudgetCycleChange={onBudgetCycleChange} />

      <div className="transactions-filter-bar">
        <div className="transactions-filter-header">
          <div className="transactions-filter-heading"><span className="transactions-filter-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16l-6.5 7.2V18l-3 1v-6.8L4 5z" /></svg></span><div><strong>Filter transactions</strong><span>{transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'} shown</span></div></div>
          {hasFilters && <button type="button" className="transaction-filter-clear" onClick={clearFilters}>Clear all</button>}
        </div>
        <div className="transactions-filter-controls">
          <div className="transaction-filter-field transaction-filter-search"><label htmlFor="transaction-search">Search</label><input id="transaction-search" type="search" placeholder="Search description, category, or account" value={searchFilter} onChange={event => setSearchFilter(event.target.value)} /></div>
          <div className="transaction-filter-field"><label htmlFor="transaction-type-filter">Type</label><select id="transaction-type-filter" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="transfer">Transfers</option></select></div>
          <div className="transaction-filter-field"><label htmlFor="transaction-category-filter">Category</label><select id="transaction-category-filter" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categoryOptions.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
          <div className="transaction-filter-field"><label htmlFor="transaction-account-filter">Account</label><select id="transaction-account-filter" value={accountFilter} onChange={event => setAccountFilter(event.target.value)}><option value="all">All accounts</option>{accountOptions.map(name => <option key={name} value={name}>{name}</option>)}</select></div>
        </div>
      </div>

      <div className="transactions-table-wrapper">
        {transactionCount === 0 ? <p className="empty-state">{hasFilters ? 'No transactions match your filters.' : 'No transactions have been recorded yet.'}</p> : <table className="transactions-table">
          <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Account</th><th className="transactions-amount">Amount</th><th className="transactions-actions">Actions</th></tr></thead>
          <tbody>
            {filteredExpenses.map(expenseEntry => {
              const accountName = getAccountName(expenseEntry)
              return <tr key={`expense-${expenseEntry.id}`}><td className="transaction-date">{expenseEntry.date.toLocaleDateString()}</td><td><span className="transaction-type transaction-type-expense">Expense</span></td><td className="transaction-title-cell">{expenseEntry.title}<small>{expenseEntry.category}</small></td><td className="transaction-account-cell">{accountName}</td><td className="transactions-amount transaction-expense-amount">-₱{Number(expenseEntry.amount).toFixed(2)}</td><td className="transactions-actions"><div className="transaction-row-actions"><button type="button" className="transaction-action-button" onClick={() => handleEditStart(expenseEntry)}>Edit</button><button type="button" className="transaction-action-button transaction-action-delete" onClick={() => setPendingDeleteExpense(expenseEntry)}>Delete</button></div></td></tr>
            })}
            {filteredTransfers.map(transfer => <tr key={`transfer-${transfer.id}`}><td className="transaction-date">{new Date(transfer.date).toLocaleDateString()}</td><td><span className="transaction-type transaction-type-transfer">Transfer</span></td><td className="transaction-title-cell">{transfer.fromAccount} → {transfer.toAccount}<small>Account transfer</small></td><td className="transaction-account-cell">{transfer.fromAccount} → {transfer.toAccount}</td><td className="transactions-amount transaction-transfer-amount">₱{Number(transfer.amount).toFixed(2)}</td><td className="transactions-actions"><span className="transaction-logged">Logged</span></td></tr>)}
          </tbody>
        </table>}
      </div>

      <div className="transactions-mobile-list">
        {transactionCount === 0 ? <p className="empty-state">{hasFilters ? 'No transactions match your filters.' : 'No transactions have been recorded yet.'}</p> : <>
          {filteredExpenses.map(expenseEntry => <button key={`mobile-expense-${expenseEntry.id}`} type="button" className="transaction-mobile-card" onClick={() => openExpenseDetails(expenseEntry)}>
            <div className="transaction-mobile-card-header"><div className="transaction-mobile-card-title"><strong>{expenseEntry.title}</strong><small>{expenseEntry.category}</small></div><span className="transaction-mobile-card-amount expense">-₱{Number(expenseEntry.amount).toFixed(2)}</span></div>
            <div className="transaction-mobile-card-summary"><div><span>Date</span><strong>{expenseEntry.date.toLocaleDateString()}</strong></div><div><span>Account</span><strong>{getAccountName(expenseEntry)}</strong></div></div>
            <div className="transaction-mobile-card-footer"><span>Expense</span><span className="transaction-mobile-view">View details →</span></div>
          </button>)}
          {filteredTransfers.map(transfer => <button key={`mobile-transfer-${transfer.id}`} type="button" className="transaction-mobile-card" onClick={() => openTransferDetails(transfer)}>
            <div className="transaction-mobile-card-header"><div className="transaction-mobile-card-title"><strong>{transfer.fromAccount} → {transfer.toAccount}</strong><small>Account transfer</small></div><span className="transaction-mobile-card-amount transfer">₱{Number(transfer.amount).toFixed(2)}</span></div>
            <div className="transaction-mobile-card-summary"><div><span>Date</span><strong>{new Date(transfer.date).toLocaleDateString()}</strong></div><div><span>From → To</span><strong>{transfer.fromAccount} → {transfer.toAccount}</strong></div></div>
            <div className="transaction-mobile-card-footer"><span>Transfer</span><span className="transaction-mobile-view">View details →</span></div>
          </button>)}
        </>}
      </div>

      {selectedTransaction && selectedEntry && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="transaction-details-title" onClick={() => setSelectedTransaction(null)}><div className="transaction-details-card" onClick={event => event.stopPropagation()}>
        <div className="transaction-details-header"><div><h3 id="transaction-details-title">Transaction details</h3><p>{selectedIsExpense ? 'Expense' : 'Account transfer'}</p></div><button className="add-form-close" type="button" onClick={() => setSelectedTransaction(null)} aria-label="Close transaction details">&times;</button></div>
        {selectedIsExpense ? <div className="transaction-details-grid">
          <div className="transaction-detail-item full"><span>Description</span><strong>{selectedEntry.title}</strong></div>
          <div className="transaction-detail-item"><span>Date</span><strong>{selectedEntry.date.toLocaleDateString()}</strong></div>
          <div className="transaction-detail-item"><span>Type</span><strong>Expense</strong></div>
          <div className="transaction-detail-item"><span>Category</span><strong>{selectedEntry.category}</strong></div>
          <div className="transaction-detail-item"><span>Account</span><strong>{getAccountName(selectedEntry)}</strong></div>
          <div className="transaction-detail-item full"><span>Amount</span><strong className="transaction-detail-amount expense">-₱{Number(selectedEntry.amount).toFixed(2)}</strong></div>
        </div> : <div className="transaction-details-grid">
          <div className="transaction-detail-item full"><span>Transfer</span><strong>{selectedEntry.fromAccount} → {selectedEntry.toAccount}</strong></div>
          <div className="transaction-detail-item"><span>Date</span><strong>{new Date(selectedEntry.date).toLocaleDateString()}</strong></div>
          <div className="transaction-detail-item"><span>Type</span><strong>Transfer</strong></div>
          <div className="transaction-detail-item"><span>From account</span><strong>{selectedEntry.fromAccount}</strong></div>
          <div className="transaction-detail-item"><span>To account</span><strong>{selectedEntry.toAccount}</strong></div>
          <div className="transaction-detail-item full"><span>Amount</span><strong className="transaction-detail-amount transfer">₱{Number(selectedEntry.amount).toFixed(2)}</strong></div>
        </div>}
        {selectedIsExpense && <div className="transaction-details-actions"><button type="button" className="transaction-action-button" onClick={() => handleEditStart(selectedEntry)}>Edit</button><button type="button" className="transaction-action-button transaction-action-delete" onClick={() => setPendingDeleteExpense(selectedEntry)}>Delete</button></div>}
      </div></div>}

      {editingExpense && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="edit-transaction-title">Edit expense</h3><button className="add-form-close" type="button" onClick={() => setEditingExpense(null)} aria-label="Close edit form">&times;</button></div><div className="add-form-fields"><label className="add-form-label" htmlFor="transaction-edit-title">Title</label><input id="transaction-edit-title" value={draft.title} onChange={event => setDraft(previous => ({ ...previous, title: event.target.value }))} /><label className="add-form-label" htmlFor="transaction-edit-category">Category</label><select id="transaction-edit-category" value={draft.category} onChange={event => setDraft(previous => ({ ...previous, category: event.target.value }))}><option value="">Select a category</option>{categoryOptions.map(name => <option key={name} value={name}>{name}</option>)}</select><label className="add-form-label" htmlFor="transaction-edit-account">Deduct from account</label><select id="transaction-edit-account" value={draft.accountId} onChange={event => setDraft(previous => ({ ...previous, accountId: event.target.value }))}><option value="">Select an account</option>{accounts.map(account => <option key={account.id} value={account.id}>{account.name} — ₱{Number(account.amount ?? 0).toFixed(2)}</option>)}</select><div className="edit-form-grid"><div><label className="add-form-label" htmlFor="transaction-edit-amount">Amount</label><input id="transaction-edit-amount" type="number" min="0.01" step="0.01" value={draft.amount} onChange={event => setDraft(previous => ({ ...previous, amount: event.target.value }))} /></div><div><label className="add-form-label" htmlFor="transaction-edit-date">Date</label><input id="transaction-edit-date" type="date" value={draft.date} onChange={event => setDraft(previous => ({ ...previous, date: event.target.value }))} /></div></div><div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-save" onClick={handleSave}>Save</button></div></div></div></div>}
      {pendingDeleteExpense && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-expense-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="delete-expense-title">Delete expense?</h3><button className="add-form-close" type="button" onClick={() => setPendingDeleteExpense(null)} aria-label="Close delete confirmation">&times;</button></div><p className="delete-confirmation-text">This will remove {pendingDeleteExpense.title} from the selected period.</p><div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteExpense}>Delete</button></div></div></div>}
    </div>
  )
}

export default Transactions
