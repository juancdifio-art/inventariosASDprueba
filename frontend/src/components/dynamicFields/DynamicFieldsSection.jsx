import DynamicFieldsGroup from './DynamicFieldsGroup.jsx';

export default function DynamicFieldsSection({
  groups = [],
  values = {},
  errors = {},
  onChange,
  readOnly = false,
  className = '',
}) {
  if (!groups.length) {
    return <div className={`dynamic-fields-section empty ${className}`.trim()}>No hay campos configurados</div>;
  }

  return (
    <div className={`dynamic-fields-section d-flex flex-column gap-3 ${className}`.trim()}>
      {groups.map((group) => (
        <DynamicFieldsGroup
          key={group.id ?? group.title}
          title={group.title}
          description={group.description}
          icon={group.icon}
          campos={group.campos ?? []}
          values={values}
          errors={errors}
          onChange={onChange}
          readOnly={readOnly}
          columns={group.columns}
          className={group.className ?? ''}
          renderExtra={group.renderExtra}
        />
      ))}
    </div>
  );
}
