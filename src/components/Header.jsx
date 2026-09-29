import '../assets/styles/Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
const Header = ({ pageTitle, onOpenAddForm, showMonthFilter, monthValue, onMonthChange }) => {

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
        {showMonthFilter && <div className="header-period-filter"><label htmlFor="header-month-filter">Month</label><div className="header-period-controls"><input id="header-month-filter" type="month" value={monthValue} onChange={(event) => onMonthChange?.(event.target.value)} aria-label="Select month" /><label className="header-pay-period-label" htmlFor="header-budget-cycle">Pay period</label><select id="header-budget-cycle" value={budgetCycle ?? 'monthly'} onChange={(event) => handlePayPeriodChange(event.target.value)} aria-label="Pay period"><option value="monthly">Full month</option><option value="fortnightly-1">1st–15th</option><option value="fortnightly-2">16th–end</option></select></div></div>
        {renderButton()}
      </div>
    </header>
  )
}

export default Header