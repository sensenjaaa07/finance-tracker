import '../assets/styles/Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

const Header = ({ pageTitle, onOpenAddForm, showMonthFilter, monthValue, onMonthChange, budgetCycle, onBudgetCycleChange }) => {
  function formatMonthLabel(monthValue) {
    if (!monthValue) return 'Select month'
    const [year, month] = monthValue.split('-')
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  function renderButton() {
    const buttonProps = { className: 'header-button', type: 'button', onClick: () => onOpenAddForm?.() }
    if (pageTitle === 'Overview') return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Expense</span></button>
    if (pageTitle === 'Accounts' || pageTitle === 'Net Worth') return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Account</span></button>
    if (pageTitle === 'Budget & Categories') return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Category</span></button>
    if (pageTitle === 'Transactions') return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Expense</span></button>
    if (pageTitle === 'Income') return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Income</span></button>
    return null
  }

  return (
    <header className="header-container">
      <div className="header-title"><p className="header-eyebrow">Your finances</p><h1>{pageTitle}</h1></div>
      <div className="header-actions">
        {showMonthFilter && <div className="header-period-filter"><label htmlFor="header-month-filter">Period</label><div className="header-period-controls"><input id="header-month-filter" type="month" value={monthValue} onChange={(event) => onMonthChange?.(event.target.value)} /><select id="header-budget-cycle" value={budgetCycle ?? 'monthly'} onChange={(event) => onBudgetCycleChange?.(event.target.value)} aria-label="Budget cycle"><option value="monthly">Monthly</option><option value="fortnightly-1">1–15</option><option value="fortnightly-2">16–end</option></select></div></div>}
        {renderButton()}
      </div>
    </header>
  )
}

export default Header