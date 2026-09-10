import '../assets/styles/Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

const Header = ({ pageTitle, onOpenAddForm, showMonthFilter, monthValue, onMonthChange, budgetCycle, onBudgetCycleChange }) => {
  const isMonthlyCycle = budgetCycle === 'monthly'

  function formatMonthLabel(monthValue) {
    if (!monthValue) {
      return 'Select month'
    }

    const [year, month] = monthValue.split('-')
    const formattedDate = new Date(Number(year), Number(month) - 1, 1)
    return formattedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  function formatCycleOptionLabel(value) {
    if (!monthValue) {
      return value
    }

    const year = Number(monthValue.slice(0, 4))
    const monthIndex = Number(monthValue.slice(5, 7))
    const lastDay = new Date(year, monthIndex, 0).getDate()

    if (value === 'monthly') {
      return `Monthly · ${formatMonthLabel(monthValue)} (${new Date(year, monthIndex - 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(year, monthIndex, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
    }

    if (value === 'fortnightly-1') {
      return `Every 15 days · ${new Date(year, monthIndex - 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(year, monthIndex - 1, 15).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    }

    return `Every 15 days · ${new Date(year, monthIndex - 1, 16).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(year, monthIndex, 0).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  }

  function renderButton() {
    const buttonProps = {
      className: 'header-button',
      type: 'button',
      disabled: isMonthlyCycle,
      onClick: () => {
        if (!isMonthlyCycle) {
          onOpenAddForm?.()
        }
      },
    }

    if (pageTitle === "Overview") {
      return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Expense</span></button>
    }

    if (pageTitle === "Net Worth") {
      return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Net Worth</span></button>
    }

    if (pageTitle === "Budget & Categories") {
      return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Category</span></button>
    }

    if (pageTitle === "Transactions") {
      return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Expense</span></button>
    }

    if (pageTitle === "Income") {
      return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Income</span></button>
    }

    if (pageTitle === "Savings & Accounts") {
      return <button {...buttonProps}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Savings</span></button>
    }

    return null
  }

  return (
    <header className="header-container">
      <div className="header-title">
        <p className="header-eyebrow">Your finances</p>
        <h1>{pageTitle}</h1>
      </div>
      <div className="header-actions">
        {showMonthFilter && (
          <div className="header-period-filter">
            <label htmlFor="header-month-filter">Period</label>
            <div className="header-period-controls">
              <input
                id="header-month-filter"
                type="month"
                value={monthValue}
                onChange={(event) => onMonthChange?.(event.target.value)}
              />
              <select
                id="header-budget-cycle"
                value={budgetCycle ?? 'monthly'}
                onChange={(event) => onBudgetCycleChange?.(event.target.value)}
                aria-label="Budget cycle"
              >
                <option value="monthly">Monthly</option>
                <option value="fortnightly-1">1–15</option>
                <option value="fortnightly-2">16–end</option>
              </select>
            </div>
          </div>
        )}
        {renderButton()}
      </div>
    </header>
  )
}

export default Header