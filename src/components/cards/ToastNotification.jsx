import '../../assets/styles/ToastNotification.css'

const ToastNotification = ({ title, message , onClose }) => {
	return (
		<div className="toast-notification" role="status" aria-live="polite">
			<div className="toast-notification-content">
				<strong>{title}</strong>
				<p>{message}</p>
			</div>
			<button type="button" onClick={onClose} aria-label="Dismiss notification">&times;</button>
		</div>
	)
}

export default ToastNotification
