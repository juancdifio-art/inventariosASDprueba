export default function Badge({ variant = 'primary', className = '', children, ...props }) {
  return (
    <span className={`badge bg-${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
