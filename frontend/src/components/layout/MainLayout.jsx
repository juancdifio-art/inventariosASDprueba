import { Children, useMemo, useId } from 'react';
import Sidebar from '../Sidebar.jsx';
import Footer from './Footer.jsx';
import useLocalStorageState from '../../hooks/useLocalStorageState.js';

const STORAGE_KEY = 'app_sidebar_expanded';

export default function MainLayout({ children }) {
  const [expanded, setExpanded] = useLocalStorageState(STORAGE_KEY, true);
  const arrayChildren = useMemo(() => Children.toArray(children), [children]);
  const header = arrayChildren.find((child) => child?.type?.displayName === 'MainLayout.Navbar') || arrayChildren[0] || null;
  const content = header ? arrayChildren.filter((child) => child !== header) : arrayChildren;
  const mainId = useId();

  const toggleSidebar = (next) => {
    setExpanded(next);
  };

  return (
    <div className="app-container">
      <a href={`#${mainId}`} className="visually-hidden-focusable skip-link">Saltar al contenido</a>
      {header}
      <div className="app-body">
        <Sidebar expanded={Boolean(expanded)} onToggle={toggleSidebar} />
        {Boolean(expanded) && <div className="sidebar-backdrop d-lg-none" onClick={() => toggleSidebar(false)} />}
        <main id={mainId} className={`main-content ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
          <div className="layout-content">
            {content}
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

MainLayout.Navbar = function MainLayoutNavbar({ children }) {
  return children;
};
MainLayout.Navbar.displayName = 'MainLayout.Navbar';
