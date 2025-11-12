import { Fragment, useEffect, useRef } from 'react';
import useKeyboardShortcut from '../hooks/useKeyboardShortcut.js';

export default function ConfirmModal({
  show,
  title = 'Confirmación',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  cancelVariant = 'secondary',
  onConfirm,
  onCancel,
  disabled = false,
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (show) {
      document.body.classList.add('modal-open');
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 0);
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [show]);

  useKeyboardShortcut('Escape', () => {
    if (!show || disabled) return;
    onCancel?.();
  }, { enabled: show });

  useKeyboardShortcut('Enter', (event) => {
    if (!show || disabled) return;
    event.preventDefault();
    onConfirm?.();
  }, { enabled: show });

  if (!show) return null;

  return (
    <Fragment>
      <div className="modal fade show" style={{ display: 'block' }} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onCancel} disabled={disabled} />
            </div>
            <div className="modal-body">
              {typeof message === 'string' ? <p className="mb-0">{message}</p> : message}
            </div>
            <div className="modal-footer">
              <button type="button" className={`btn btn-${cancelVariant}`} onClick={onCancel} disabled={disabled}>
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
                disabled={disabled}
                ref={confirmButtonRef}
              >
                {disabled && (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                )}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </Fragment>
  );
}
