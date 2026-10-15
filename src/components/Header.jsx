import '../assets/styles/Header.css'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faXmark, faTrashCan } from '@fortawesome/free-solid-svg-icons'

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

const periodValue = (period) => `custom|${period.start}|${period.end}`
const periodLabel = (period) => {
  const format = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${format(period.start)} – ${format(period.end)}`
}

const Header = ({ pageTitle, onOpenAddForm, showMonthFilter, monthValue, onMonthChange, budgetCycle, onBudgetCycleChange, payPeriods = [], onPayPeriodsChange }) => {
  const customPeriod = parseCustomPeriod(budgetCycle)
  const [periodModalOpen, setPeriodModalOpen] = useState(false)
  const [draftStart, setDraftStart] = useState(customPeriod?.start || getMonthBounds(monthValue).start)
  const [draftEnd, setDraftEnd] = useState(customPeriod?.end || getMonthBounds(monthValue).end)
  const selectedSavedPeriod = payPeriods.find((period) => periodValue(period) === budgetCycle)

  const handlePayPeriodChange = (value) => {
    if (value === 'set-period') {
      const bounds = customPeriod || getMonthBounds(monthValue)
      setDraftStart(bounds.start)
      setDraftEnd(bounds.end)
      setPeriodModalOpen(true)
      return
    }
    onBudgetCycleChange?.(value)
  }

  const deleteSelectedPeriod = () => {
    if (!selectedSavedPeriod || typeof onPayPeriodsChange !== 'function') return
    if (!window.confirm(`Delete pay period ${periodLabel(selectedSavedPeriod)}? Its saved budget allocations will no longer be included in the Full month view.`)) return
    onPayPeriodsChange(payPeriods.filter((period) => periodValue(period) !== budgetCycle))
    onBudgetCycleChange?.('monthly')
  }

  const savePeriod = (event) => {
    event.preventDefault()
    if (!draftStart || !draftEnd || draftStart > draftEnd) return
    const period = { start: draftStart, end: draftEnd }
    const existing = payPeriods.filter((item) => !(item.start === period.start && item.end === period.end))
    onPayPeriodsChange?.([...existing, period])
    onBudgetCycleChange?.(periodValue(period))
    setPeriodModalOpen(false)
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
    <>
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
                <div className="header-pay-period-select">
                  <select id="header-budget-cycle" value={customPeriod ? budgetCycle : 'monthly'} onChange={(event) => handlePayPeriodChange(event.target.value)} aria-label="Pay period">
                    <option value="monthly">Full month</option>
                    {payPeriods.map((period) => <option key={periodValue(period)} value={periodValue(period)}>{periodLabel(period)}</option>)}
                    <option value="set-period">＋ Set period…</option>
                  </select>
                  {selectedSavedPeriod && <button type="button" className="header-delete-period" onClick={deleteSelectedPeriod} title="Delete selected pay period" aria-label="Delete selected pay period"><FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /></button>}
                </div>
              </div>
            </div>
          )}
          {renderButton()}
        </div>
      </header>
      {periodModalOpen && (
        <div className="expense-card-overlay" role="dialog" aria-modal="true" aria-labelledby="set-pay-period-title">
          <form className="add-form edit-form" onSubmit={savePeriod}>
            <div className="add-form-header">
              <div><p className="header-eyebrow">Budget settings</p><h3 id="set-pay-period-title">Set pay period</h3></div>
              <button className="add-form-close" type="button" onClick={() => setPeriodModalOpen(false)} aria-label="Close set pay period"><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>
            </div>
            <p>Choose the exact dates covered by this paycheck. Saved periods remain available in the Pay period selector, and each period keeps its own budget allocations.</p>
            <div className="add-form-fields">
              <label className="add-form-label" htmlFor="pay-period-start">Period starts</label>
              <input id="pay-period-start" type="date" value={draftStart} onChange={(event) => setDraftStart(event.target.value)} required />
              <label className="add-form-label" htmlFor="pay-period-end">Period ends</label>
              <input id="pay-period-end" type="date" min={draftStart || undefined} value={draftEnd} onChange={(event) => setDraftEnd(event.target.value)} required />
              {draftStart && draftEnd && draftStart > draftEnd && <p className="amount-negative">The end date must be on or after the start date.</p>}
            </div>
            <div className="budget-card-actions edit-action-row">
              <button type="button" className="budget-card-button budget-card-button-cancel" onClick={() => setPeriodModalOpen(false)}>Cancel</button>
              <button type="submit" className="budget-card-button budget-card-button-save" disabled={!draftStart || !draftEnd || draftStart > draftEnd}>Save pay period</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default Header
