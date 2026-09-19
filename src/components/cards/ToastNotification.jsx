import '../../assets/styles/ToastNotification.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

const ToastNotification = ({ title, message, onClose }) => {
  const displayMessage = message ?? title ?? 'Notification'

  return (
    <div className="toast-notification" role="status" aria-live="polite">
      <div className="toast-notification-content">
        {title && message && <strong>{title}</strong>}
        <p>{displayMessage}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><FontAwesomeIcon icon={faXmark} aria-hidden="true" /></button>
    </div>
  )
}

export default ToastNotification
