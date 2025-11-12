import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Badge from '../Badge';

describe('Badge Component', () => {
  it('renderiza correctamente con texto', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('aplica la variante primary por defecto', () => {
    render(<Badge data-testid="badge">Test</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-primary');
  });

  it('aplica diferentes variantes correctamente', () => {
    const { rerender } = render(<Badge variant="success" data-testid="badge">Success</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-success');

    rerender(<Badge variant="danger" data-testid="badge">Danger</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-danger');

    rerender(<Badge variant="warning" data-testid="badge">Warning</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-warning');

    rerender(<Badge variant="info" data-testid="badge">Info</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-info');

    rerender(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-secondary');
  });

  it('aplica la clase badge por defecto', () => {
    render(<Badge data-testid="badge">Test</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('badge');
  });

  it('aplica clases personalizadas', () => {
    render(<Badge className="custom-badge" data-testid="badge">Test</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('badge');
    expect(badge).toHaveClass('custom-badge');
  });

  it('renderiza números', () => {
    render(<Badge>5</Badge>);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('pasa props adicionales correctamente', () => {
    render(<Badge data-testid="badge" id="badge-1" title="Badge title">Test</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('id', 'badge-1');
    expect(badge).toHaveAttribute('title', 'Badge title');
  });
});
