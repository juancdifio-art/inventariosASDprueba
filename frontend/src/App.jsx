import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const Login = lazy(() => import('./pages/Login.jsx'))
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Productos = lazy(() => import('./pages/Productos.jsx'))
const Categorias = lazy(() => import('./pages/Categorias.jsx'))
const Proveedores = lazy(() => import('./pages/Proveedores.jsx'))
const Movimientos = lazy(() => import('./pages/Movimientos.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const Configuracion = lazy(() => import('./pages/Configuracion.jsx'))
const ConfiguracionCamposPage = lazy(() => import('./pages/ConfiguracionCamposPage.jsx'))
const ImportExportPage = lazy(() => import('./pages/ImportExportPage.jsx'))
const Alertas = lazy(() => import('./pages/Alertas.jsx'))
const Auditorias = lazy(() => import('./pages/Auditorias.jsx'))
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'))
const ProductEdit = lazy(() => import('./pages/ProductEdit.jsx'))
const ProductCreate = lazy(() => import('./pages/ProductCreate.jsx'))
const ProveedorCreate = lazy(() => import('./pages/ProveedorCreate.jsx'))
const ProveedorEdit = lazy(() => import('./pages/ProveedorEdit.jsx'))
const CategoriaCreate = lazy(() => import('./pages/CategoriaCreate.jsx'))
const CategoriaEdit = lazy(() => import('./pages/CategoriaEdit.jsx'))
const DashboardPreview = lazy(() => import('./pages/DashboardPreview.jsx'))
const DashboardPreviewABC = lazy(() => import('./pages/DashboardPreviewABC.jsx'))

function App() {
  return (
    <Suspense
      fallback={(
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
          <span className="spinner-border text-primary" role="status" aria-hidden="true"></span>
          <span className="visually-hidden">Cargando...</span>
        </div>
      )}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}> 
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard-preview" element={<DashboardPreview />} />
          <Route path="/dashboard-preview/abc" element={<DashboardPreviewABC />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/productos/nuevo" element={<ProductCreate />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/productos/:id/editar" element={<ProductEdit />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/categorias/nueva" element={<CategoriaCreate />} />
          <Route path="/categorias/:id/editar" element={<CategoriaEdit />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/proveedores/nuevo" element={<ProveedorCreate />} />
          <Route path="/proveedores/:id/editar" element={<ProveedorEdit />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/reportes" element={<Reports />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/configuracion-campos" element={<ConfiguracionCamposPage />} />
          <Route path="/importacion-exportacion" element={<ImportExportPage />} />
          <Route path="/auditorias" element={<Auditorias />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
