import '../assets/styles/Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

const Header = ({ pageTitle, onOpenAddForm }) => {
  function renderButton() {
    if (pageTitle === "Overview") {
      return <button className="header-button" type="button" onClick={onOpenAddForm}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Expense</span></button>
    }

    if (pageTitle === "Net Worth") {
      return <button className="header-button" type="button" onClick={onOpenAddForm}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Net Worth</span></button>
    }

    if (pageTitle === "Budget & Categories") {
      return <button className="header-button" type="button" onClick={onOpenAddForm}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Category</span></button>
    }

    if (pageTitle === "Transactions") {
      return <button className="header-button" type="button" onClick={onOpenAddForm}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Expense</span></button>
    }

    if (pageTitle === "Savings & Accounts") {
      return <button className="header-button" type="button" onClick={onOpenAddForm}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /><span>Add Savings</span></button>
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
        {renderButton()}
      </div>
    </header>
  )
}

export default Header