import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Transactions = ({ expenseEntries, onOpenAddForm }) => {
  return (
    <div>
      <Header pageTitle={"Transactions"} onOpenAddForm={onOpenAddForm}/>
      <div className="entry-list">
        {expenseEntries.length === 0 ? (
          <p className="empty-state">No expenses have been recorded yet.</p>
        ) : expenseEntries.map((expenseEntry) => (
          <div className="entry-list-item" key={expenseEntry.id}>
            <h3>{expenseEntry.title}</h3>
            <p>{expenseEntry.category}</p>
            <p>₱{expenseEntry.amount.toFixed(2)}</p>
            <p>{expenseEntry.date.toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Transactions