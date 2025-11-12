import { useEffect, useState } from 'react';
import useApiMutation from '../../hooks/useApiMutation.js';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';

export default function StockManager({ productoId, currentStock = 0, onUpdated }) {
  const [value, setValue] = useState(Number(currentStock ?? 0));
  const [message, setMessage] = useState('');
  const { addNotification } = useNotifications();

  useEffect(() => {
    setValue(Number(currentStock ?? 0));
  }, [currentStock]);

  const mutation = useApiMutation({
    method: 'put',
    url: `/productos/${productoId}`,
    invalidate: [['productos'], ['dashboard'], ['alertas']],
    onSuccess: async () => {
      setMessage('Stock actualizado correctamente');
      addNotification({ variant: 'success', message: 'Stock actualizado correctamente' });
      if (onUpdated) await onUpdated();
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || 'Error al actualizar stock';
      addNotification({ variant: 'danger', message: msg });
    },
  });

  if (!productoId) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');
    mutation.mutate({ stock_actual: Number(value) });
  };

  const errorMessage = mutation.isError
    ? mutation.error?.response?.data?.message || mutation.error?.message || 'Error al actualizar stock'
    : '';

  return (
    <div>
      <h5 className="mb-3">Gestión rápida de stock</h5>
      {errorMessage && <Alert variant="danger" className="py-2">{errorMessage}</Alert>}
      {message && <Alert variant="success" className="py-2">{message}</Alert>}
      <form className="row g-2 align-items-end" onSubmit={handleSubmit}>
        <div className="col-12 col-sm-4 col-lg-3">
          <label className="form-label">Stock actual</label>
          <input
            type="number"
            className="form-control"
            min="0"
            step="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={mutation.isLoading}
          />
        </div>
        <div className="col-12 col-sm-auto">
          <Button type="submit" variant="primary" isLoading={mutation.isLoading}>
            Actualizar stock
          </Button>
        </div>
      </form>
    </div>
  );
}
