import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Alert from '../Alert';

describe('Alert Component', () => {
  it('renderiza correctamente con contenido', () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('aplica la variante primary por defecto', () => {
    render(<Alert>Test</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('alert-primary');
  });

  it('aplica diferentes variantes correctamente', () => {
    const { rerender } = render(<Alert variant="success">Success</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('alert-success');

    rerender(<Alert variant="danger">Error</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');

    rerender(<Alert variant="warning">Warning</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('alert-warning');

    rerender(<Alert variant="info">Info</Alert>);
    expect(screen.getByRole('alert')).toHaveClass('alert-info');
  });

  it('aplica clases personalizadas', () => {
    render(<Alert className="custom-alert">Test</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  it('renderiza contenido HTML', () => {
    render(
      <Alert>
        <strong>Important:</strong> This is a message
      </Alert>
    );
    
    expect(screen.getByText('Important:')).toBeInTheDocument();
    expect(screen.getByText('This is a message')).toBeInTheDocument();
  });

  it('pasa props adicionales correctamente', () => {
    render(<Alert data-testid="custom-alert" id="alert-1">Test</Alert>);
    const alert = screen.getByTestId('custom-alert');
    expect(alert).toHaveAttribute('id', 'alert-1');
  });
});
