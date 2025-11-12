export default function Alert({ variant = 'primary', className = '', children, ...props }) {
  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role="alert" {...props}>
      {children}
    </div>
  );
}
