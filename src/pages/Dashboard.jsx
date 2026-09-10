import '../assets/styles/Dashboard.css'
import Header from '../components/Header'

const formatCurrency = (amount) => `₱${amount.toFixed(2)}`

const Dashboard = ({ expenseEntries, categoryEntries, onOpenAddForm }) => {
  const totalBudgeted = categoryEntries.reduce((total, entry) => total + entry.amount, 0)
  const totalSpent = expenseEntries.reduce((total, entry) => total + entry.amount, 0)
  const totalRemaining = totalBudgeted - totalSpent

  return (
    <section>
      <Header pageTitle={"Overview"} onOpenAddForm={onOpenAddForm}/>
      <div className="dashboard-summary">
        <div className="summary-card">
          <p>Dedicated budget</p>
          <strong>{formatCurrency(totalBudgeted)}</strong>
        </div>
        <div className="summary-card">
          <p>Spent</p>
          <strong>{formatCurrency(totalSpent)}</strong>
        </div>
        <div className="summary-card">
          <p>Budget left</p>
          <strong className={totalRemaining < 0 ? 'amount-negative' : ''}>{formatCurrency(totalRemaining)}</strong>
        </div>
      </div>
      <div className="dashboard-section">
        <h2>Budget left by category</h2>
        {categoryEntries.length === 0 ? (
          <p className="empty-state">Create a budget category to start tracking what is left.</p>
        ) : (
          <div className="entry-list">
            {categoryEntries.map((category) => {
              const spent = expenseEntries
                .filter((expense) => expense.category === category.name)
                .reduce((total, expense) => total + expense.amount, 0)
              const remaining = category.amount - spent

              return (
                <div className="entry-list-item" key={category.id}>
                  <h3>{category.name}</h3>
                  <p>Left: <span className={remaining < 0 ? 'amount-negative' : ''}>{formatCurrency(remaining)}</span></p>
                  <p>Spent: {formatCurrency(spent)} of {formatCurrency(category.amount)}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export default Dashboard