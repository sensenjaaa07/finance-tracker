import Header from '../components/Header'
import '../assets/styles/EntryList.css'
import '../assets/styles/Dashboard.css'

const NetWorth = ({ netWorthEntries, onOpenAddForm }) => {
  const totalSaved = netWorthEntries.reduce((total, entry) => total + entry.amount, 0)

  return (
    <div>
      <Header pageTitle={"Savings & Accounts"} onOpenAddForm={onOpenAddForm} />
      <div className="dashboard-summary">
        <div className="summary-card">
          <p>Total saved across accounts</p>
          <strong>₱{totalSaved.toFixed(2)}</strong>
        </div>
      </div>
      <div className="entry-list">
        {netWorthEntries.length === 0 ? (
          <p className="empty-state">Add each savings account to see your total money saved.</p>
        ) : netWorthEntries.map((entry) => (
          <div className="entry-list-item" key={entry.id}>
            <h3>{entry.name}</h3>
            <p>Saved: ₱{entry.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NetWorth