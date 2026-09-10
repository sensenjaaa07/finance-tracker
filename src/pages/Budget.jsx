import Header from '../components/Header'
import '../assets/styles/EntryList.css'

const Budget = ({ categoryEntries, expenseEntries, onOpenAddForm }) => {
  return (
    <div>
      <Header pageTitle={"Budget & Categories"} onOpenAddForm={onOpenAddForm}/>
      <div className="entry-list">
        {categoryEntries.length === 0 ? (
          <p className="empty-state">Add a category and its dedicated spending amount.</p>
        ) : categoryEntries.map((entry) => {
          const spent = expenseEntries
            .filter((expense) => expense.category === entry.name)
            .reduce((total, expense) => total + expense.amount, 0)
          const remaining = entry.amount - spent

          return (
            <div className="entry-list-item" key={entry.id}>
              <h3>{entry.name}</h3>
              <p>Dedicated: ₱{entry.amount.toFixed(2)}</p>
              <p>Spent: ₱{spent.toFixed(2)}</p>
              <p>Left: <span className={remaining < 0 ? 'amount-negative' : ''}>₱{remaining.toFixed(2)}</span></p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Budget