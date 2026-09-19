import '../../assets/styles/ToastNotification.css'

const ToastNotification = ({ title, message, onClose }) => {
  const displayMessage = message ?? title ?? 'Notification'

  return (
    <div className="toast-notification" role="status" aria-live="polite">
      <div className="toast-notification-content">
        {title && message && <strong>{title}</strong>}
        <p>{displayMessage}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss notification">&times;</button>
    </div>
  )
}

export default ToastNotification
