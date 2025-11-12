export default function Button({ variant = 'primary', size = 'md', className = '', children, isLoading = false, disabled = false, ...props }) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const computedDisabled = disabled || isLoading;
  return (
    <button className={`btn btn-${variant} ${sizeClass} ${className}`.trim()} disabled={computedDisabled} {...props}>
      {isLoading && (
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
