import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Select from '../Select';

describe('Select Component', () => {
  it('renderiza correctamente con opciones', () => {
    render(
      <Select>
        <option value="">Seleccionar</option>
        <option value="1">Opción 1</option>
        <option value="2">Opción 2</option>
      </Select>
    );
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Seleccionar')).toBeInTheDocument();
    expect(screen.getByText('Opción 1')).toBeInTheDocument();
  });

  it('aplica la clase form-select por defecto', () => {
    render(<Select data-testid="select"><option>Test</option></Select>);
    expect(screen.getByTestId('select')).toHaveClass('form-select');
  });

  it('aplica clases personalizadas', () => {
    render(
      <Select className="custom-class" data-testid="select">
        <option>Test</option>
      </Select>
    );
    
    const select = screen.getByTestId('select');
    expect(select).toHaveClass('form-select');
    expect(select).toHaveClass('custom-class');
  });

  it('maneja cambios de selección', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(
      <Select onChange={handleChange}>
        <option value="">Seleccionar</option>
        <option value="1">Opción 1</option>
        <option value="2">Opción 2</option>
      </Select>
    );
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '1');
    
    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('1');
  });

  it('maneja el estado deshabilitado', () => {
    render(
      <Select disabled>
        <option>Test</option>
      </Select>
    );
    
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('pasa props adicionales correctamente', () => {
    render(
      <Select
        name="category"
        required
        data-testid="category-select"
      >
        <option>Test</option>
      </Select>
    );
    
    const select = screen.getByTestId('category-select');
    expect(select).toHaveAttribute('name', 'category');
    expect(select).toBeRequired();
  });

  it('maneja valor controlado', () => {
    const { rerender } = render(
      <Select value="1" onChange={() => {}}>
        <option value="1">Opción 1</option>
        <option value="2">Opción 2</option>
      </Select>
    );
    
    expect(screen.getByRole('combobox')).toHaveValue('1');
    
    rerender(
      <Select value="2" onChange={() => {}}>
        <option value="1">Opción 1</option>
        <option value="2">Opción 2</option>
      </Select>
    );
    
    expect(screen.getByRole('combobox')).toHaveValue('2');
  });
});
