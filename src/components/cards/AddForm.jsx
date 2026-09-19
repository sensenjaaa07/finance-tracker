import '../../assets/styles/AddForm.css'
import { useState } from 'react'

const formDefinitions = {
  Expenses: {
    title: 'Expense',
    fields: [
      { name: 'title', type: 'text', label: 'Description', placeholder: 'e.g. Groceries' },
      { name: 'amount', type: 'number', label: 'Amount', placeholder: '0.00' },
      { name: 'date', type: 'date', label: 'Date' },
    ],
  },
  Categories: {
    title: 'Category',
    nameField: { name: 'category', type: 'text', placeholder: 'Category Name' },
    amountField: { name: 'amount', type: 'number', placeholder: 'Amount' },
  },
  Income: {
    title: 'Income',
    fields: [
      { name: 'title', type: 'text', label: 'Source', placeholder: 'e.g. Salary' },
      { name: 'amount', type: 'number', label: 'Amount', placeholder: '0.00' },
      { name: 'date', type: 'date', label: 'Date' },
    ],
  },
  'Net-Worth': {
    title: 'Account',
    nameField: { name: 'netWorthName', type: 'text', placeholder: 'Account Name' },
    amountField: { name: 'amount', type: 'number', placeholder: 'Initial Balance' },
  },
}

const AddForm = ({ formType, entries = [], accounts = [], onSubmit, onClose }) => {
  const [entryAction, setEntryAction] = useState('new')
  const formDefinition = formDefinitions[formType]
  if (!formDefinition) return null

  return (
    <div className="add-form">
      <div className="add-form-header">
        <h3 id="add-form-title">Add {formDefinition.title}</h3>
        <button className="add-form-close" type="button" onClick={onClose} aria-label="Close add form">&times;</button>
      </div>
      <form className="add-form-fields" onSubmit={onSubmit}>
        {formType === 'Expenses' && (
          <>
            <label className="add-form-label" htmlFor="expense-category">Category</label>
            <select id="expense-category" name="category" defaultValue="Uncategorized" required>
              <option value="Uncategorized">Uncategorized</option>
              {entries.map((entry) => <option key={entry.id} value={entry.name}>{entry.name}</option>)}
            </select>
            <label className="add-form-label" htmlFor="expense-account">Deduct from account</label>
            <select id="expense-account" name="accountId" defaultValue="" required>
              <option value="" disabled>Select an account</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} — ₱{Number(account.amount ?? 0).toFixed(2)}</option>)}
            </select>
            {accounts.length === 0 && <p className="add-form-helper add-form-helper-warning">Add an account first so this expense can be deducted from a real balance.</p>}
          </>
        )}
        {formType === 'Income' && (
          <>
            <label className="add-form-label" htmlFor="income-account">Deposit into account</label>
            <select id="income-account" name="accountId" defaultValue="" required>
              <option value="" disabled>Select an account</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} — ₱{Number(account.amount ?? 0).toFixed(2)}</option>)}
            </select>
            {accounts.length === 0 && <p className="add-form-helper add-form-helper-warning">Add an account first so this income can be recorded in a destination account.</p>}
          </>
        )}
        {formType !== 'Expenses' && formType !== 'Income' && (
          <>
            <label className="add-form-label" htmlFor="entry-action">Add money to</label>
            <select id="entry-action" name="entryAction" value={entryAction} onChange={(event) => setEntryAction(event.target.value)}>
              <option value="new">Create new {formDefinition.title}</option>
              {entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </>
        )}
        {(formType === 'Expenses' || formType === 'Income') && formDefinition.fields.map((field) => <div className="add-form-field" key={field.name}><label className="add-form-label" htmlFor={`${formType.toLowerCase()}-${field.name}`}>{field.label}</label><input id={`${formType.toLowerCase()}-${field.name}`} name={field.name} type={field.type} placeholder={field.placeholder} required /></div>)}
        {formType !== 'Expenses' && formType !== 'Income' && entryAction === 'new' && <input {...formDefinition.nameField} required />}
        {formType !== 'Expenses' && formType !== 'Income' && <input {...formDefinition.amountField} min="0.01" step="0.01" required />}
        <button type="submit" disabled={(formType === 'Expenses' || formType === 'Income') && accounts.length === 0}>{formType === 'Expenses' ? 'Add Expense' : formType === 'Income' ? 'Add Income' : formType === 'Categories' ? (entryAction === 'new' ? 'Add Category' : 'Add to Category') : (entryAction === 'new' ? 'Add Account' : 'Add to Account')}</button>
      </form>
    </div>
  )
}

export default AddForm
