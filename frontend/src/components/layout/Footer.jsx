import './Footer.css';

const links = [
  { label: 'Soporte', icon: 'bi-life-preserver', href: '#' },
  { label: 'Roadmap', icon: 'bi-map', href: '#' },
  { label: 'Changelog', icon: 'bi-clock-history', href: '#' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer border-top py-3 small">
      <div className="container-fluid d-flex flex-column flex-md-row align-items-center gap-2 justify-content-between">
        <span className="text-secondary">Inventarios ABC · {year} · v0.1 beta</span>
        <div className="d-flex align-items-center gap-3 text-secondary">
          <span className="d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success">Online</span>
            <small>Servidor 5003</small>
          </span>
          <span className="vr d-none d-md-block" />
          <nav className="d-flex align-items-center gap-3">
            {links.map((link) => (
              <a key={link.label} href={link.href} className="text-secondary text-decoration-none d-flex align-items-center gap-1">
                <i className={`bi ${link.icon}`} />
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
