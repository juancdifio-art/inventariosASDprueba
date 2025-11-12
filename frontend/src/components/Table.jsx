export default function Table({ columns = [], data = [], emptyMessage = 'Sin datos para mostrar' }) {
  return (
    <table className="table table-hover align-middle">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key || col.label} className={col.headerClassName} style={col.style}>
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length || 1} className="text-center text-secondary py-4">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, index) => (
            <tr key={row.id ?? index} className={row.rowClassName}>
              {columns.map((col) => (
                <td key={col.key || col.label} className={col.className} style={col.cellStyle}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
