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
import TravelBookings from './pages/travel/TravelBookings'
import TravelBookingForm from './pages/travel/TravelBookingForm'
import RestaurantMenuItems from './pages/restaurant/RestaurantMenuItems'
import RestaurantMenuItemForm from './pages/restaurant/RestaurantMenuItemForm'
import RestaurantOrders from './pages/restaurant/RestaurantOrders'
import RestaurantOrderForm from './pages/restaurant/RestaurantOrderForm'
import RestaurantKitchen from './pages/restaurant/RestaurantKitchen'
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
import Users from './pages/Users'
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

function BusinessTypeRoute({ children, allowedTypes }) {
  const { tenant } = useSelector((state) => state.auth)
  const businessType = tenant?.businessType || 'trading'

  if (Array.isArray(allowedTypes) && allowedTypes.length > 0 && !allowedTypes.includes(businessType)) {
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
        <Route path="invoices/new/purchase" element={<BusinessTypeRoute allowedTypes={['trading']}><InvoiceCreatePurchase /></BusinessTypeRoute>} />
        <Route path="invoices/:id" element={<InvoiceView />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="travel-bookings" element={<BusinessTypeRoute allowedTypes={['travel_agency']}><TravelBookings /></BusinessTypeRoute>} />
        <Route path="travel-bookings/new" element={<BusinessTypeRoute allowedTypes={['travel_agency']}><TravelBookingForm /></BusinessTypeRoute>} />
        <Route path="travel-bookings/:id" element={<BusinessTypeRoute allowedTypes={['travel_agency']}><TravelBookingForm /></BusinessTypeRoute>} />
        <Route path="restaurant/menu-items" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantMenuItems /></BusinessTypeRoute>} />
        <Route path="restaurant/menu-items/new" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantMenuItemForm /></BusinessTypeRoute>} />
        <Route path="restaurant/menu-items/:id" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantMenuItemForm /></BusinessTypeRoute>} />
        <Route path="restaurant/orders" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantOrders /></BusinessTypeRoute>} />
        <Route path="restaurant/orders/new" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantOrderForm /></BusinessTypeRoute>} />
        <Route path="restaurant/orders/:id" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantOrderForm /></BusinessTypeRoute>} />
        <Route path="restaurant/kitchen" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantKitchen /></BusinessTypeRoute>} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/new" element={<ExpenseForm />} />
        <Route path="expenses/:id" element={<ExpenseForm />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeForm />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="payroll/calculators" element={<PayrollCalculators />} />
        <Route path="products" element={<BusinessTypeRoute allowedTypes={['trading']}><Products /></BusinessTypeRoute>} />
        <Route path="products/new" element={<BusinessTypeRoute allowedTypes={['trading']}><ProductForm /></BusinessTypeRoute>} />
        <Route path="products/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><ProductForm /></BusinessTypeRoute>} />
        <Route path="warehouses" element={<BusinessTypeRoute allowedTypes={['trading']}><Warehouses /></BusinessTypeRoute>} />
        <Route path="warehouses/new" element={<BusinessTypeRoute allowedTypes={['trading']}><WarehouseForm /></BusinessTypeRoute>} />
        <Route path="warehouses/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><WarehouseForm /></BusinessTypeRoute>} />
        <Route path="suppliers" element={<BusinessTypeRoute allowedTypes={['trading']}><Suppliers /></BusinessTypeRoute>} />
        <Route path="suppliers/new" element={<BusinessTypeRoute allowedTypes={['trading']}><SupplierForm /></BusinessTypeRoute>} />
        <Route path="suppliers/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><SupplierForm /></BusinessTypeRoute>} />
        <Route path="purchase-orders" element={<BusinessTypeRoute allowedTypes={['trading']}><PurchaseOrders /></BusinessTypeRoute>} />
        <Route path="purchase-orders/new" element={<BusinessTypeRoute allowedTypes={['trading']}><PurchaseOrderForm /></BusinessTypeRoute>} />
        <Route path="purchase-orders/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><PurchaseOrderForm /></BusinessTypeRoute>} />
        <Route path="shipments" element={<BusinessTypeRoute allowedTypes={['trading']}><Shipments /></BusinessTypeRoute>} />
        <Route path="shipments/new" element={<BusinessTypeRoute allowedTypes={['trading']}><ShipmentForm /></BusinessTypeRoute>} />
        <Route path="shipments/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><ShipmentForm /></BusinessTypeRoute>} />
        <Route path="projects" element={<BusinessTypeRoute allowedTypes={['trading']}><Projects /></BusinessTypeRoute>} />
        <Route path="projects/new" element={<BusinessTypeRoute allowedTypes={['trading']}><ProjectForm /></BusinessTypeRoute>} />
        <Route path="projects/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><ProjectForm /></BusinessTypeRoute>} />
        <Route path="tasks" element={<BusinessTypeRoute allowedTypes={['trading']}><Tasks /></BusinessTypeRoute>} />
        <Route path="tasks/new" element={<BusinessTypeRoute allowedTypes={['trading']}><TaskForm /></BusinessTypeRoute>} />
        <Route path="tasks/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><TaskForm /></BusinessTypeRoute>} />
        <Route path="iot" element={<BusinessTypeRoute allowedTypes={['trading']}><IoT /></BusinessTypeRoute>} />
        <Route path="iot/devices/new" element={<BusinessTypeRoute allowedTypes={['trading']}><IoTDeviceForm /></BusinessTypeRoute>} />
        <Route path="iot/devices/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><IoTDeviceForm /></BusinessTypeRoute>} />
        <Route path="finance" element={<Finance />} />
        <Route path="job-costing" element={<BusinessTypeRoute allowedTypes={['trading']}><JobCosting /></BusinessTypeRoute>} />
        <Route path="job-costing/new" element={<BusinessTypeRoute allowedTypes={['trading']}><JobCostingForm /></BusinessTypeRoute>} />
        <Route path="job-costing/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><JobCostingForm /></BusinessTypeRoute>} />
        <Route path="mrp" element={<BusinessTypeRoute allowedTypes={['trading']}><MRP /></BusinessTypeRoute>} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
