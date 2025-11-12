import Breadcrumbs from '../components/Breadcrumbs.jsx';

const sections = [
  {
    title: 'Campos personalizados',
    description: 'Configurá qué atributos adicionales tendrá cada producto según tu industria.',
    icon: 'bi-sliders',
  },
  {
    title: 'Alertas y notificaciones',
    description: 'Próximamente vas a poder definir umbrales, destinatarios y frecuencia de avisos.',
    icon: 'bi-bell',
  },
  {
    title: 'Preferencias generales',
    description: 'Idiomas, formatos y otras opciones globales estarán disponibles en esta sección.',
    icon: 'bi-gear',
  },
];

export default function Configuracion() {
  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Configuración</h3>
          <p className="text-secondary mb-0">Panel de ajustes todavía en desarrollo. Te adelantamos lo que se viene.</p>
        </div>
      </div>
      <Breadcrumbs />

      <div className="card p-3 mt-3">
        <div className="d-grid gap-3">
          {sections.map((section) => (
            <div key={section.title} className="d-flex align-items-start gap-3">
              <div className="text-primary" style={{ fontSize: 28 }}>
                <i className={`bi ${section.icon}`} />
              </div>
              <div>
                <h5 className="mb-1">{section.title}</h5>
                <p className="text-secondary mb-0">{section.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
