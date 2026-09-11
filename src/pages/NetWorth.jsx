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
  const selectedFromAccount = netWorthEntries.find(account => account.id === transferDraft.from)
  const selectedToAccount = netWorthEntries.find(account => account.id === transferDraft.to)
  const transferAmount = Number(transferDraft.amount)
  const hasTransferDetails = Boolean(selectedFromAccount && selectedToAccount && Number.isFinite(transferAmount) && transferAmount > 0)

  const handleEditStart = (entry) => { setEditingEntry(entry); setDraft({ name: entry.name, amount: String(entry.amount) }) }
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
  const closeTransfer = () => {
    setShowTransfer(false)
    setTransferDraft({ from: '', to: '', amount: '' })
  }
  const handleTransfer = (event) => {
    event.preventDefault()
    const amount = Number(transferDraft.amount)
    if (!transferDraft.from || !transferDraft.to || transferDraft.from === transferDraft.to || !Number.isFinite(amount) || amount <= 0) return
    if (onTransfer(transferDraft.from, transferDraft.to, amount)) closeTransfer()
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
          <div><p className="chart-eyebrow">Account transfers</p><h2>Move money between accounts</h2><p className="daily-budget-description">Transfer money without creating an expense.</p></div>
          <button type="button" className="budget-card-button budget-card-button-save" onClick={() => setShowTransfer(true)}>Transfer money</button>
        </div>
      </div>

      <div className="entry-list">
        {netWorthEntries.length === 0 ? <p className="empty-state">Add an account to start tracking your money.</p> : netWorthEntries.map((entry) => (
          <div className="entry-list-item info-card" key={entry.id} role="button" tabIndex={0} onClick={() => handleEditStart(entry)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleEditStart(entry) } }}>
            <div className="info-card-header"><p className="info-card-label">Account</p><div className="budget-card-header-actions"><span className="budget-card-badge">Active</span><button type="button" className="budget-card-delete-button" aria-label={`Delete ${entry.name}`} onClick={(event) => { event.stopPropagation(); setPendingDeleteEntry(entry) }}><span aria-hidden="true">×</span></button></div></div>
            <h3>{entry.name}</h3>
            <div className="budget-card-metrics"><div><span className="budget-card-label">Balance</span><p>₱{Number(entry.amount ?? 0).toFixed(2)}</p></div><div><span className="budget-card-label">Status</span><p>Active</p></div></div>
          </div>
        ))}
      </div>

      {showTransfer && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
        <form className="add-form edit-form transfer-modal-card" onSubmit={handleTransfer}>
          <div className="transfer-modal-heading">
            <div className="transfer-modal-icon" aria-hidden="true"><span>↔</span></div>
            <div className="transfer-modal-title-group">
              <p className="chart-eyebrow">Account transfer</p>
              <h3 id="transfer-title">Transfer money</h3>
              <p>Move money from one account to another. This will be logged in Transactions.</p>
            </div>
            <button className="add-form-close transfer-modal-close" type="button" onClick={closeTransfer} aria-label="Close transfer form">&times;</button>
          </div>

          <div className="transfer-accounts-row">
            <div className="transfer-field">
              <label className="add-form-label" htmlFor="transfer-from">From account</label>
              <select id="transfer-from" value={transferDraft.from} onChange={(event) => setTransferDraft(previous => ({ ...previous, from: event.target.value, to: previous.to === event.target.value ? '' : previous.to }))} required>
                <option value="">Choose an account</option>
                {netWorthEntries.map(account => <option key={account.id} value={account.id}>{account.name} — ₱{Number(account.amount ?? 0).toFixed(2)}</option>)}
              </select>
              <span className="transfer-balance">Available balance: ₱{Number(selectedFromAccount?.amount ?? 0).toFixed(2)}</span>
            </div>

            <div className="transfer-connector" aria-hidden="true"><span className="transfer-line" /><span className="transfer-arrow">→</span><span className="transfer-line" /></div>

            <div className="transfer-field">
              <label className="add-form-label" htmlFor="transfer-to">To account</label>
              <select id="transfer-to" value={transferDraft.to} onChange={(event) => setTransferDraft(previous => ({ ...previous, to: event.target.value }))} required>
                <option value="">Choose an account</option>
                {netWorthEntries.filter(account => account.id !== transferDraft.from).map(account => <option key={account.id} value={account.id}>{account.name} — ₱{Number(account.amount ?? 0).toFixed(2)}</option>)}
              </select>
              <span className="transfer-balance">Current balance: ₱{Number(selectedToAccount?.amount ?? 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="transfer-field transfer-amount-field">
            <label className="add-form-label" htmlFor="transfer-amount">Amount</label>
            <div className="transfer-amount-input"><span>₱</span><input id="transfer-amount" type="number" min="0.01" step="0.01" placeholder="Enter amount" value={transferDraft.amount} onChange={(event) => setTransferDraft(previous => ({ ...previous, amount: event.target.value }))} required /></div>
            <span className="transfer-balance">{selectedFromAccount ? `Available after transfer: ₱${Math.max(0, Number(selectedFromAccount.amount ?? 0) - (Number.isFinite(transferAmount) ? transferAmount : 0)).toFixed(2)}` : 'Select an account to see the available balance.'}</span>
          </div>

          <div className={`transfer-summary ${hasTransferDetails ? 'is-ready' : ''}`}>
            <div className="transfer-summary-icon" aria-hidden="true">↔</div>
            <div>
              <strong>Transfer Summary</strong>
              {hasTransferDetails ? <p>₱{transferAmount.toFixed(2)} will move from <b>{selectedFromAccount.name}</b> to <b>{selectedToAccount.name}</b>.</p> : <p>Select both accounts and enter an amount to continue.</p>}
            </div>
          </div>

          <div className="budget-card-actions edit-action-row transfer-modal-actions"><button type="button" className="budget-card-button budget-card-button-cancel" onClick={closeTransfer}>Cancel</button><button type="submit" className="budget-card-button budget-card-button-save" disabled={!hasTransferDetails}>Transfer money</button></div>
        </form>
      </div>}

      {editingEntry && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="edit-account-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="edit-account-title">Edit account</h3><button className="add-form-close" type="button" onClick={() => setEditingEntry(null)} aria-label="Close edit form">&times;</button></div><div className="add-form-fields"><label className="add-form-label" htmlFor="account-edit-name">Account name</label><input id="account-edit-name" value={draft.name} onChange={(event) => setDraft(previous => ({ ...previous, name: event.target.value }))} /><label className="add-form-label" htmlFor="account-edit-amount">Balance</label><input id="account-edit-amount" type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setDraft(previous => ({ ...previous, amount: event.target.value }))} /><div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-save" onClick={handleSave}>Save</button></div></div></div></div>}
      {pendingDeleteEntry && <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-account-title"><div className="add-form edit-form"><div className="add-form-header"><h3 id="delete-account-title">Delete account?</h3><button className="add-form-close" type="button" onClick={() => setPendingDeleteEntry(null)} aria-label="Close delete confirmation">&times;</button></div><p className="delete-confirmation-text">This will remove {pendingDeleteEntry.name} from your accounts.</p><div className="budget-card-actions single-action-row"><button type="button" className="budget-card-button budget-card-button-delete" onClick={confirmDeleteEntry}>Delete</button></div></div></div>}
    </div>
  )
}

export default Accounts
