import { useState } from 'react'
import Header from '../components/Header'
import '../assets/styles/EntryList.css'
import '../assets/styles/Dashboard.css'

const Accounts = ({ netWorthEntries, onOpenAddForm, onUpdateNetWorthEntry, onDeleteNetWorthEntry, onTransfer }) => {
  const [editingEntry, setEditingEntry] = useState(null)
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState(null)
  const [draft, setDraft] = useState({ name: '', amount: '' })
  const [showTransfer, setShowTransfer] = useState(false)
  const [transferDraft, setTransferDraft] = useState({ from: '', to: '', amount: '' })
  const totalBalance = netWorthEntries.reduce((total, entry) => total + Number(entry.amount ?? 0), 0)

  const handleEditStart = (entry) => {
    setEditingEntry(entry)
    setDraft({ name: entry.name, amount: String(entry.amount) })
  }

  const handleSave = () => {
    if (!onUpdateNetWorthEntry || !editingEntry) return
    const nextAmount = Number(draft.amount)
    if (!draft.name.trim() || !Number.isFinite(nextAmount) || nextAmount < 0) return
    onUpdateNetWorthEntry(editingEntry.id, { name: draft.name.trim(), amount: nextAmount })
    setEditingEntry(null)
  }

  const confirmDeleteEntry = () => {
    if (!onDeleteNetWorthEntry || !pendingDeleteEntry) return
    onDeleteNetWorthEntry(pendingDeleteEntry.id)
    setPendingDeleteEntry(null)
  }

  const handleTransfer = (event) => {
    event.preventDefault()
    if (!onTransfer) return
    const amount = Number(transferDraft.amount)
    if (!transferDraft.from || !transferDraft.to || transferDraft.from === transferDraft.to || !Number.isFinite(amount) || amount <= 0) return
    const success = onTransfer(transferDraft.from, transferDraft.to, amount)
    if (success) {
      setTransferDraft({ from: '', to: '', amount: '' })
      setShowTransfer(false)
    }
  }

  return (
    <div>
      <Header pageTitle="Accounts" onOpenAddForm={onOpenAddForm} />
      <div className="dashboard-summary">
        <div className="summary-card"><p>Total across accounts</p><strong>₱{totalBalance.toFixed(2)}</strong></div>
        <div className="summary-card"><p>Number of accounts</p><strong>{netWorthEntries.length}</strong></div>
      </div>

      <div className="daily-budget-section" style={{ marginBottom: '24px' }}>
        <div className="daily-budget-header">
          <div><p className="chart-eyebrow">Account transfers</p><h2>Move money between accounts</h2><p className="daily-budget-description">Transfers change both account balances and are recorded in Transactions.</p></div>
          <button type="button" className="budget-card-button budget-card-button-save" onClick={() => setShowTransfer(previous => !previous)}>{showTransfer ? 'Cancel transfer' : 'Transfer money'}</button>
        </div>
        {showTransfer && (
          <form className="add-form-fields" onSubmit={handleTransfer}>
            <label className="add-form-label" htmlFor="transfer-from">From account</label>
            <select id="transfer-from" value={transferDraft.from} onChange={(event) => setTransferDraft(previous => ({ ...previous, from: event.target.value }))} required>
              <option value="">Select source account</option>
              {netWorthEntries.map((account) => <option key={account.id} value={account.id}>{account.name} — ₱{Number(account.amount ?? 0).toFixed(2)}</option>)}
            </select>
            <label className="add-form-label" htmlFor="transfer-to">To account</label>
            <select id="transfer-to" value={transferDraft.to} onChange={(event) => setTransferDraft(previous => ({ ...previous, to: event.target.value }))} required>
              <option value="">Select destination account</option>
              {netWorthEntries.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
            <label className="add-form-label" htmlFor="transfer-amount">Amount</label>
            <input id="transfer-amount" type="number" min="0.01" step="0.01" value={transferDraft.amount} onChange={(event) => setTransferDraft(previous => ({ ...previous, amount: event.target.value }))} required />
            <button type="submit">Transfer</button>
          </form>
        )}
      </div>

      <div className="entry-list">
        {netWorthEntries.length === 0 ? <p className="empty-state">Add an account to start tracking your money.</p> : netWorthEntries.map((entry) => (
          <div className="entry-list-item info-card" key={entry.id} role="button" tabIndex={0} onClick={() => handleEditStart(entry)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleEditStart(entry) } }}>
            <div className="info-card-header"><p className="info-card-label">Account</p><div className="budget-card-header-actions"><span className="budget-card-badge">Active</span><button type="button" className="budget-card-delete-button" aria-label={`Delete ${entry.name}`} onClick={(event) => { event.stopPropagation(); setPendingDeleteEntry(entry) }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.75A1.25 1.25 0 0 1 10.25 2.5h3.5A1.25 1.25 0 0 1 15 3.75V4h2.25a.75.75 0 0 1 0 1.5H17v11.25A2.75 2.75 0 0 1 14.25 19.5h-4.5A2.75 2.75 0 0 1 7 16.75V5.5H5.75a.75.75 0 0 1 0-1.5H8v-.25Zm1.5.75h3V4h-3v.5Zm-2.25 2.25h7.5v10.75a1.25 1.25 0 0 1-1.25 1.25h-4.5a1.25 1.25 0 0 1-1.25-1.25V6.5Zm1.5 2.25a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1-.75-.75v-5.5a.75.75 0 0 1 .75-.75Z" fill="currentColor" /></svg></button></div></div>
            <h3>{entry.name}</h3>
            <div className="budget-card-metrics"><div><span className="budget-card-label">Balance</span><p>₱{Number(entry.amount ?? 0).toFixed(2)}</p></div><div><span className="budget-card-label">Status</span><p>Active</p></div></div>
          </div>
        ))}
      </div>

      {editingEntry && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-account-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="edit-account-title">Edit account</h3><button className="add-form-close" type="button" onClick={() => setEditingEntry(null)} aria-label="Close edit form">&times;</button></div><div className="add-form-fields"><label className="add-form-label" htmlFor="account-edit-name">Account name</label><input id="account-edit-name" value={draft.name} onChange={(event) => setDraft(previous => ({ ...previous, name: event.target.value }))} /><label className="add-form-label" htmlFor="account-edit-amount">Balance</label><input id="account-edit-amount" type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setDraft(previous => ({ ...previous, amount: event.target.value }))} /><div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-save" onClick={handleSave}>Save</button></div></div></div></div>}
      {pendingDeleteEntry && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="delete-account-title">Delete account?</h3><button className="add-form-close" type="button" onClick={() => setPendingDeleteEntry(null)} aria-label="Close delete confirmation">&times;</button></div><p className="delete-confirmation-text">This will remove {pendingDeleteEntry.name} from your accounts.</p><div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteEntry}>Delete</button></div></div></div>}
    </div>
  )
}

export default Accounts
