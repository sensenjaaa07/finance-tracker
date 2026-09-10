import '../assets/styles/Navigation.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faGauge, faMoneyBill, faExchangeAlt, faMoneyBillTrendUp, faCoins, faBars, faXmark } from '@fortawesome/free-solid-svg-icons'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)

  const closeNavigation = () => setIsOpen(false)

  return (
    <>
      <button
        type="button"
        className={`mobile-nav-toggle${isOpen ? ' mobile-nav-toggle-open' : ''}`}
        onClick={() => setIsOpen(previous => !previous)}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isOpen}
      >
        <FontAwesomeIcon icon={isOpen ? faXmark : faBars} aria-hidden="true" />
      </button>

      {isOpen && <button type="button" className="mobile-nav-backdrop" onClick={closeNavigation} aria-label="Close navigation" />}

      <aside className={`navigation-container${isOpen ? ' mobile-nav-open' : ''}`}>
        <div className="logo-container">
          <FontAwesomeIcon icon={faWallet} className="wallet-icon" />
          <div>
            <p className="logo-eyebrow">Personal</p>
            <h2 className="nav-title">Finance Tracker</h2>
          </div>
        </div>
        <nav aria-label="Main navigation">
          <ul>
            <li><NavLink to="/" end onClick={closeNavigation}><FontAwesomeIcon icon={faGauge} aria-hidden="true" /><span>Dashboard</span></NavLink></li>
            <li><NavLink to="/budget" onClick={closeNavigation}><FontAwesomeIcon icon={faMoneyBill} aria-hidden="true" /><span>Budget</span></NavLink></li>
            <li><NavLink to="/transactions" onClick={closeNavigation}><FontAwesomeIcon icon={faExchangeAlt} aria-hidden="true" /><span>Transactions</span></NavLink></li>
            <li><NavLink to="/income" onClick={closeNavigation}><FontAwesomeIcon icon={faCoins} aria-hidden="true" /><span>Income</span></NavLink></li>
            <li><NavLink to="/net-worth" onClick={closeNavigation}><FontAwesomeIcon icon={faMoneyBillTrendUp} aria-hidden="true" /><span>Net Worth</span></NavLink></li>
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Navigation
