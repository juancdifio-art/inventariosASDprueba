export default function Select({ className = '', options, children, ...props }) {
  const normalizedOptions = Array.isArray(options) ? options : [];

  return (
    <select className={`form-select ${className}`.trim()} {...props}>
      {normalizedOptions.map((option, index) => (
        <option
          key={option.value ?? option.label ?? index}
          value={option.value ?? ''}
          disabled={Boolean(option.disabled)}
          hidden={Boolean(option.hidden)}
        >
          {option.label ?? option.value ?? ''}
        </option>
      ))}
      {children}
    </select>
  );
}
