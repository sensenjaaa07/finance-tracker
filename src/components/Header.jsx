import '../assets/styles/Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'

const HEADER_PERIOD_STORAGE_KEY = 'finance-tracker-header-budget-cycle'
const CUSTOM_PERIOD_STORAGE_KEY = 'finance-tracker-custom-pay-period'
const VALID_PAY_PERIODS = ['monthly', 'fortnightly-1', 'fortnightly-2']

const getMonthBounds = (monthValue) => {
  const fallback = new Date()
  const month = monthValue || `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}`
  const [year, monthNumber] = month.split('-').map(Number)
  const lastDay = new Date(year, monthNumber, 0).getDate()
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

const Header = ({
  pageTitle,
  onOpenAddForm,
  showMonthFilter,
  monthValue,
  onMonthChange,
  budgetCycle,
  onBudgetCycleChange,
}) => {
  const [customPeriod, setCustomPeriod] = useState(() => {
    if (typeof window === 'undefined') return { start: '', end: '' }
    try {
      const saved = JSON.parse(window.localStorage.getItem(CUSTOM_PERIOD_STORAGE_KEY) || 'null')
      return saved?.start && saved?.end ? { start: saved.start, end: saved.end } : { start: '', end: '' }
    } catch {
      return { start: '', end: '' }
    }
  })

  useEffect(() => {
    if (!showMonthFilter || typeof window === 'undefined') return
    const savedPeriod = window.localStorage.getItem(HEADER_PERIOD_STORAGE_KEY)
    if (VALID_PAY_PERIODS.includes(savedPeriod) && !customPeriod.start && savedPeriod !== budgetCycle) {
      onBudgetCycleChange?.(savedPeriod)
    }
  }, [showMonthFilter, onBudgetCycleChange, budgetCycle, customPeriod.start])

  const saveCustomPeriod = (nextPeriod) => {
    setCustomPeriod(nextPeriod)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CUSTOM_PERIOD_STORAGE_KEY, JSON.stringify(nextPeriod))
      window.localStorage.setItem(HEADER_PERIOD_STORAGE_KEY, 'custom')
    }
    // Keep the app's internal cycle on monthly; the date filter service uses these custom dates.
    onBudgetCycleChange?.('monthly')
  }

  const handlePayPeriodChange = (value) => {
    if (value === 'custom') {
      const bounds = getMonthBounds(monthValue)
      saveCustomPeriod(customPeriod.start && customPeriod.end ? customPeriod : bounds)
      return
    }

    setCustomPeriod({ start: '', end: '' })
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CUSTOM_PERIOD_STORAGE_KEY)
      if (VALID_PAY_PERIODS.includes(value)) {
        window.localStorage.setItem(HEADER_PERIOD_STORAGE_KEY, value)
      }
    }
    onBudgetCycleChange?.(value)
  }

  const handleCustomDateChange = (field, value) => {
    const next = { ...customPeriod, [field]: value }
    setCustomPeriod(next)
    if (next.start && next.end && next.start <= next.end) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(CUSTOM_PERIOD_STORAGE_KEY, JSON.stringify(next))
        window.localStorage.setItem(HEADER_PERIOD_STORAGE_KEY, 'custom')
      }
      onBudgetCycleChange?.('monthly')
    }
  }

  const displayedPayPeriod = customPeriod.start && customPeriod.end ? 'custom' : (budgetCycle ?? 'monthly')

  function renderButton() {
    const buttonProps = {
      className: 'header-button',
      type: 'button',
      onClick: () => onOpenAddForm?.(),
    }

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
              <input
                id="header-month-filter"
                type="month"
                value={monthValue}
                onChange={(event) => onMonthChange?.(event.target.value)}
                aria-label="Select month"
              />
            </div>
            <div className="header-period-control">
              <label htmlFor="header-budget-cycle">Pay period</label>
              <select
                id="header-budget-cycle"
                value={displayedPayPeriod}
                onChange={(event) => handlePayPeriodChange(event.target.value)}
                aria-label="Pay period"
              >
                <option value="monthly">Full month</option>
                <option value="fortnightly-1">1st–15th</option>
                <option value="fortnightly-2">16th–end</option>
                <option value="custom">Custom dates</option>
              </select>
            </div>
            {displayedPayPeriod === 'custom' && (
              <>
                <div className="header-period-control">
                  <label htmlFor="header-pay-period-start">Start</label>
                  <input
                    id="header-pay-period-start"
                    type="date"
                    value={customPeriod.start}
                    onChange={(event) => handleCustomDateChange('start', event.target.value)}
                    aria-label="Pay period start date"
                  />
                </div>
                <div className="header-period-control">
                  <label htmlFor="header-pay-period-end">End</label>
                  <input
                    id="header-pay-period-end"
                    type="date"
                    min={customPeriod.start || undefined}
                    value={customPeriod.end}
                    onChange={(event) => handleCustomDateChange('end', event.target.value)}
                    aria-label="Pay period end date"
                  />
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
