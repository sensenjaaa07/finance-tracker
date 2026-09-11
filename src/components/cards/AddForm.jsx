import '../../assets/styles/AddForm.css'
import { useState } from 'react'

const formDefinitions = {
  Expenses: {
    title: 'Expense',
    fields: [
      { name: 'title', type: 'text', placeholder: 'Title' },
      { name: 'amount', type: 'number', placeholder: 'Amount' },
      { name: 'date', type: 'date', placeholder: 'Date' },
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
      { name: 'title', type: 'text', placeholder: 'Source' },
      { name: 'amount', type: 'number', placeholder: 'Amount' },
      { name: 'date', type: 'date', placeholder: 'Date' },
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
          </>
        )}
        {formType !== 'Expenses' && (
          <>
            <label className="add-form-label" htmlFor="entry-action">Add money to</label>
            <select id="entry-action" name="entryAction" value={entryAction} onChange={(event) => setEntryAction(event.target.value)}>
              <option value="new">Create new {formDefinition.title}</option>
              {entries.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </>
        )}
        {(formType === 'Expenses' || formType === 'Income') && formDefinition.fields.map((field) => <input key={field.name} {...field} required />)}
        {formType !== 'Expenses' && formType !== 'Income' && entryAction === 'new' && <input {...formDefinition.nameField} required />}
        {formType !== 'Expenses' && formType !== 'Income' && <input {...formDefinition.amountField} min="0.01" step="0.01" required />}
        <button type="submit">Add</button>
      </form>
    </div>
  )
}

export default AddForm
