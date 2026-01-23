import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { getMe } from './store/slices/authSlice'
import { setLanguage, setTheme } from './store/slices/uiSlice'
import { applyTenantBranding } from './lib/branding'

import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import MarketingLayout from './layouts/MarketingLayout'

import Login from './pages/auth/Login'
import MarketingHome from './pages/marketing/Home'
import MarketingPricing from './pages/marketing/Pricing'
import MarketingAbout from './pages/marketing/About'
import MarketingContact from './pages/marketing/Contact'
import MarketingPrivacy from './pages/marketing/Privacy'
import MarketingTerms from './pages/marketing/Terms'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/invoices/Invoices'
import InvoiceCreate from './pages/invoices/InvoiceCreate'
import InvoiceCreateSell from './pages/invoices/InvoiceCreateSell'
import InvoiceCreatePurchase from './pages/invoices/InvoiceCreatePurchase'
import InvoiceView from './pages/invoices/InvoiceView'
import Employees from './pages/hr/Employees'
import EmployeeForm from './pages/hr/EmployeeForm'
import Payroll from './pages/hr/Payroll'
import PayrollCalculators from './pages/hr/PayrollCalculators'
import Products from './pages/inventory/Products'
import ProductForm from './pages/inventory/ProductForm'
import Warehouses from './pages/inventory/Warehouses'
import WarehouseForm from './pages/inventory/WarehouseForm'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import Suppliers from './pages/Suppliers'
import SupplierForm from './pages/SupplierForm'
import PurchaseOrders from './pages/PurchaseOrders'
import PurchaseOrderForm from './pages/PurchaseOrderForm'
import Shipments from './pages/Shipments'
import ShipmentForm from './pages/ShipmentForm'
import Projects from './pages/Projects'
import ProjectForm from './pages/ProjectForm'
import Tasks from './pages/Tasks'
import TaskForm from './pages/TaskForm'
import IoT from './pages/IoT'
import IoTDeviceForm from './pages/IoTDeviceForm'
import Finance from './pages/Finance'
import JobCosting from './pages/JobCosting'
import JobCostingForm from './pages/JobCostingForm'
import MRP from './pages/MRP'
import WhatsApp from './pages/WhatsApp'
import Contacts from './pages/Contacts'
import Expenses from './pages/Expenses'
import ExpenseForm from './pages/ExpenseForm'
import CustomerList from './pages/customers/CustomerList'
import CustomerForm from './pages/customers/CustomerForm'
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard'
import TenantManagement from './pages/super-admin/TenantManagement'
import TenantForm from './pages/super-admin/TenantForm'
import UserManagement from './pages/super-admin/UserManagement'
import GeminiSettings from './pages/super-admin/GeminiSettings'
import WebsiteSettings from './pages/super-admin/WebsiteSettings'

import LoadingScreen from './components/ui/LoadingScreen'

function LegacyDashboardRedirect() {
  const location = useLocation()
  const nextPath = location.pathname.replace(/^\/dashboard/, '/app/dashboard')
  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />
}

function LegacyModuleRedirect({ module }) {
  const location = useLocation()
  const nextPath = location.pathname.replace(`/${module}`, `/app/dashboard/${module}`)
  return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />
}

function ProtectedRoute({ children, allowedRoles, redirectSuperAdmin }) {
  const { isAuthenticated, isLoading, user, token } = useSelector((state) => state.auth)

  // No token = not logged in, redirect immediately (no loading)
  if (!token) return <Navigate to="/login" replace />
  
  // Has token but still verifying - show brief loading only if not yet authenticated
  if (isLoading && !isAuthenticated) return null
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  
  // Redirect super_admin to their dashboard if they try to access regular routes
  if (redirectSuperAdmin && user?.role === 'super_admin') {
    return <Navigate to="/super-admin" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/app/dashboard" replace />
  }

  return children
}

function App() {
  const dispatch = useDispatch()
  const { token, tenant } = useSelector((state) => state.auth)
  const { language, theme } = useSelector((state) => state.ui)

  useEffect(() => {
    if (token) {
      dispatch(getMe())
    }
  }, [dispatch, token])

  useEffect(() => {
    dispatch(setLanguage(language))
    dispatch(setTheme(theme))
  }, [])

  useEffect(() => {
    applyTenantBranding(tenant?.branding)
  }, [tenant])

  return (
    <Routes>
      {/* Public Marketing Website */}
      <Route path="/" element={<MarketingLayout />}>
        <Route index element={<MarketingHome />} />
        <Route path="pricing" element={<MarketingPricing />} />
        <Route path="about" element={<MarketingAbout />} />
        <Route path="contact" element={<MarketingContact />} />
        <Route path="privacy" element={<MarketingPrivacy />} />
        <Route path="terms" element={<MarketingTerms />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />

      {/* Legacy redirect (backwards compatibility) */}
      <Route path="/dashboard/*" element={<LegacyDashboardRedirect />} />

      {/* Legacy module redirects (backwards compatibility) */}
      <Route path="/invoices/*" element={<LegacyModuleRedirect module="invoices" />} />
      <Route path="/customers/*" element={<LegacyModuleRedirect module="customers" />} />
      <Route path="/contacts/*" element={<LegacyModuleRedirect module="contacts" />} />
      <Route path="/expenses/*" element={<LegacyModuleRedirect module="expenses" />} />
      <Route path="/employees/*" element={<LegacyModuleRedirect module="employees" />} />
      <Route path="/products/*" element={<LegacyModuleRedirect module="products" />} />
      <Route path="/warehouses/*" element={<LegacyModuleRedirect module="warehouses" />} />
      <Route path="/suppliers/*" element={<LegacyModuleRedirect module="suppliers" />} />
      <Route path="/purchase-orders/*" element={<LegacyModuleRedirect module="purchase-orders" />} />
      <Route path="/shipments/*" element={<LegacyModuleRedirect module="shipments" />} />
      <Route path="/projects/*" element={<LegacyModuleRedirect module="projects" />} />
      <Route path="/tasks/*" element={<LegacyModuleRedirect module="tasks" />} />
      <Route path="/iot/*" element={<LegacyModuleRedirect module="iot" />} />
      <Route path="/job-costing/*" element={<LegacyModuleRedirect module="job-costing" />} />
      <Route path="/mrp/*" element={<LegacyModuleRedirect module="mrp" />} />
      <Route path="/finance/*" element={<LegacyModuleRedirect module="finance" />} />
      <Route path="/reports/*" element={<LegacyModuleRedirect module="reports" />} />
      <Route path="/settings/*" element={<LegacyModuleRedirect module="settings" />} />

      {/* Super Admin Routes */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SuperAdminDashboard />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="tenants/new" element={<TenantForm />} />
        <Route path="tenants/:id" element={<TenantForm />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="website" element={<WebsiteSettings />} />
        <Route path="gemini" element={<GeminiSettings />} />
      </Route>

      {/* Main App Routes */}
      <Route
        path="/app/dashboard"
        element={
          <ProtectedRoute redirectSuperAdmin>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<InvoiceCreate />} />
        <Route path="invoices/new/sell" element={<InvoiceCreateSell />} />
        <Route path="invoices/new/purchase" element={<InvoiceCreatePurchase />} />
        <Route path="invoices/:id" element={<InvoiceView />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/new" element={<ExpenseForm />} />
        <Route path="expenses/:id" element={<ExpenseForm />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeForm />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="payroll/calculators" element={<PayrollCalculators />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="warehouses/new" element={<WarehouseForm />} />
        <Route path="warehouses/:id" element={<WarehouseForm />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/new" element={<SupplierForm />} />
        <Route path="suppliers/:id" element={<SupplierForm />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderForm />} />
        <Route path="shipments" element={<Shipments />} />
        <Route path="shipments/new" element={<ShipmentForm />} />
        <Route path="shipments/:id" element={<ShipmentForm />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/:id" element={<ProjectForm />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/new" element={<TaskForm />} />
        <Route path="tasks/:id" element={<TaskForm />} />
        <Route path="iot" element={<IoT />} />
        <Route path="iot/devices/new" element={<IoTDeviceForm />} />
        <Route path="iot/devices/:id" element={<IoTDeviceForm />} />
        <Route path="finance" element={<Finance />} />
        <Route path="job-costing" element={<JobCosting />} />
        <Route path="job-costing/new" element={<JobCostingForm />} />
        <Route path="job-costing/:id" element={<JobCostingForm />} />
        <Route path="mrp" element={<MRP />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
