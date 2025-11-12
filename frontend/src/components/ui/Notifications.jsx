import { useNotifications } from '../../context/NotificationContext.jsx';

export default function Notifications() {
  const { notifications, removeNotification } = useNotifications();

  if (!notifications.length) return null;

  return (
    <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
      {notifications.map((item) => (
        <div key={item.id} className={`toast show text-bg-${mapVariant(item.variant)}`} role="alert">
          <div className="toast-body d-flex align-items-start gap-2">
            <div className="flex-grow-1">{item.message}</div>
            <button type="button" className="btn-close btn-close-white ms-auto" onClick={() => removeNotification(item.id)} aria-label="Cerrar" />
          </div>
        </div>
      ))}
    </div>
  );
}

function mapVariant(variant) {
  switch (variant) {
    case 'success':
      return 'success';
    case 'error':
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'secondary';
  }
}
