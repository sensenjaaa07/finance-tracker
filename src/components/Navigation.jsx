import '../assets/styles/Navigation.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faGauge, faMoneyBill, faExchangeAlt, faMoneyBillTrendUp } from '@fortawesome/free-solid-svg-icons'
import { NavLink } from 'react-router-dom'

const Navigation = () => {

  return (
    <aside className="navigation-container">
        <div className="logo-container">
            <FontAwesomeIcon icon={faWallet} className="wallet-icon" />
            <div>
              <p className="logo-eyebrow">Personal</p>
              <h2 className="nav-title">Finance Tracker</h2>
            </div>
        </div>
        <nav aria-label="Main navigation">
          <ul>
            <li><NavLink to="/" end><FontAwesomeIcon icon={faGauge} aria-hidden="true" /><span>Dashboard</span></NavLink></li>
            <li><NavLink to="/budget"><FontAwesomeIcon icon={faMoneyBill} aria-hidden="true" /><span>Budget</span></NavLink></li>
            <li><NavLink to="/transactions"><FontAwesomeIcon icon={faExchangeAlt} aria-hidden="true" /><span>Transactions</span></NavLink></li>
            <li><NavLink to="/net-worth"><FontAwesomeIcon icon={faMoneyBillTrendUp} aria-hidden="true" /><span>Net Worth</span></NavLink></li>
          </ul>
        </nav>
    </aside>
  )
}

export default Navigation