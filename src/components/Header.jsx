import '../assets/styles/Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

const VALID_PAY_PERIODS = ['monthly', 'fortnightly-1', 'fortnightly-2']

const getMonthBounds = (monthValue) => {
  const fallback = new Date()
  const month = monthValue || `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}`
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` }
}

const parseCustomPeriod = (value) => {
  if (!value?.startsWith('custom|')) return null
  const [, start, end] = value.split('|')
  return start && end ? { start, end } : null
}

const Header = ({ pageTitle, onOpenAddForm, showMonthFilter, monthValue, onMonthChange, budgetCycle, onBudgetCycleChange }) => {
  const customPeriod = parseCustomPeriod(budgetCycle)
  const displayedPayPeriod = customPeriod ? 'custom' : (VALID_PAY_PERIODS.includes(budgetCycle) ? budgetCycle : 'monthly')

  const handlePayPeriodChange = (value) => {
    if (value === 'custom') {
      const bounds = customPeriod || getMonthBounds(monthValue)
      onBudgetCycleChange?.(`custom|${bounds.start}|${bounds.end}`)
      return
    }
    onBudgetCycleChange?.(value)
  }

  const handleCustomDateChange = (field, value) => {
    const next = { ...(customPeriod || getMonthBounds(monthValue)), [field]: value }
    if (next.start && next.end && next.start <= next.end) {
      onBudgetCycleChange?.(`custom|${next.start}|${next.end}`)
    } else if (next.start && !next.end) {
      onBudgetCycleChange?.(`custom|${next.start}|${next.start}`)
    }
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
        {showMonthFilter && (
          <div className="header-period-filter">
            <div className="header-period-control">
              <label htmlFor="header-month-filter">Month</label>
              <input id="header-month-filter" type="month" value={monthValue} onChange={(event) => onMonthChange?.(event.target.value)} aria-label="Select month" />
            </div>
            <div className="header-period-control">
              <label htmlFor="header-budget-cycle">Pay period</label>
              <select id="header-budget-cycle" value={displayedPayPeriod} onChange={(event) => handlePayPeriodChange(event.target.value)} aria-label="Pay period">
                <option value="monthly">Full month</option>
                <option value="fortnightly-1">1st–15th</option>
                <option value="fortnightly-2">16th–end</option>
                <option value="custom">Custom dates</option>
              </select>
            </div>
            {displayedPayPeriod === 'custom' && customPeriod && (
              <>
                <div className="header-period-control">
                  <label htmlFor="header-pay-period-start">Start</label>
                  <input id="header-pay-period-start" type="date" value={customPeriod.start} onChange={(event) => handleCustomDateChange('start', event.target.value)} aria-label="Pay period start date" />
                </div>
                <div className="header-period-control">
                  <label htmlFor="header-pay-period-end">End</label>
                  <input id="header-pay-period-end" type="date" min={customPeriod.start || undefined} value={customPeriod.end} onChange={(event) => handleCustomDateChange('end', event.target.value)} aria-label="Pay period end date" />
                </div>
              </>
            )}
          </div>
        )}
        {renderButton()}
      </div>
    </header>
  )
}

export default Header
