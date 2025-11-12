export default function Table({ columns, data, keyField = 'id', tableClassName = 'table table-hover align-middle', rowClassName, rowProps }) {
  return (
    <table className={tableClassName}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key || col.accessor}
              style={col.style}
              className={col.headerClassName}
              scope="col"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => {
          const rowKey = colKey(row, keyField, index);
          const extraProps = resolveRowProps(rowProps, row, index);
          const mergedClassName = mergeClassNames(
            typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName,
            extraProps.className
          );
          const { className, ...restProps } = extraProps;
          return (
            <tr key={rowKey} className={mergedClassName} {...restProps}>
              {columns.map((col) => (
                <td key={(col.key || col.accessor) ?? col.label} className={col.className} style={col.cellStyle}>
                  {typeof col.render === 'function' ? col.render(row, index) : resolveValue(row, col.accessor)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function colKey(row, keyField, index) {
  if (typeof keyField === 'function') return keyField(row, index);
  if (row && typeof row === 'object' && keyField in row) return row[keyField];
  return index;
}

function resolveRowProps(rowProps, row, index) {
  if (!rowProps) return {};
  if (typeof rowProps === 'function') {
    const result = rowProps(row, index);
    return result && typeof result === 'object' ? result : {};
  }
  return rowProps && typeof rowProps === 'object' ? rowProps : {};
}

function mergeClassNames(...classes) {
  return classes
    .filter((cls) => typeof cls === 'string' && cls.trim().length > 0)
    .join(' ')
    .trim() || undefined;
}

function resolveValue(row, accessor) {
  if (!accessor) return null;
  if (typeof accessor === 'function') return accessor(row);
  return row?.[accessor];
}
