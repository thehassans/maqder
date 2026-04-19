import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { getMe } from './store/slices/authSlice'
import { setLanguage, setTheme } from './store/slices/uiSlice'
import { applyTenantBranding } from './lib/branding'
import { getTenantBusinessTypes } from './lib/businessTypes'

import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import MarketingLayout from './layouts/MarketingLayout'

import Login from './pages/auth/Login'
import LoadingScreen from './components/ui/LoadingScreen'

// Lazy-loaded pages (code-split so the initial tenant-login bundle stays tiny)
const MarketingHome = lazy(() => import('./pages/marketing/Home'))
const MarketingPricing = lazy(() => import('./pages/marketing/Pricing'))
const MarketingAbout = lazy(() => import('./pages/marketing/About'))
const MarketingContact = lazy(() => import('./pages/marketing/Contact'))
const MarketingPrivacy = lazy(() => import('./pages/marketing/Privacy'))
const MarketingTerms = lazy(() => import('./pages/marketing/Terms'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Invoices = lazy(() => import('./pages/invoices/Invoices'))
const InvoiceCreate = lazy(() => import('./pages/invoices/InvoiceCreate'))
const InvoiceCreateSell = lazy(() => import('./pages/invoices/InvoiceCreateSellPage'))
const InvoiceCreatePurchase = lazy(() => import('./pages/invoices/InvoiceCreatePurchasePage'))
const InvoiceEditPage = lazy(() => import('./pages/invoices/InvoiceEditPage'))
const InvoiceView = lazy(() => import('./pages/invoices/InvoiceView'))
const Employees = lazy(() => import('./pages/hr/Employees'))
const EmployeeForm = lazy(() => import('./pages/hr/EmployeeForm'))
const Payroll = lazy(() => import('./pages/hr/Payroll'))
const PayrollCalculators = lazy(() => import('./pages/hr/PayrollCalculators'))
const Products = lazy(() => import('./pages/inventory/Products'))
const ProductForm = lazy(() => import('./pages/inventory/ProductForm'))
const Warehouses = lazy(() => import('./pages/inventory/Warehouses'))
const WarehouseForm = lazy(() => import('./pages/inventory/WarehouseForm'))
const Settings = lazy(() => import('./pages/Settings'))
const Reports = lazy(() => import('./pages/Reports'))
const VatReturns = lazy(() => import('./pages/VatReturns'))
const Suppliers = lazy(() => import('./pages/Suppliers'))
const SupplierForm = lazy(() => import('./pages/SupplierForm'))
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'))
const PurchaseOrderForm = lazy(() => import('./pages/PurchaseOrderForm'))
const Shipments = lazy(() => import('./pages/Shipments'))
const ShipmentForm = lazy(() => import('./pages/ShipmentForm'))
const TravelBookings = lazy(() => import('./pages/travel/TravelBookings'))
const TravelBookingForm = lazy(() => import('./pages/travel/TravelBookingForm'))
const RestaurantMenuItems = lazy(() => import('./pages/restaurant/RestaurantMenuItems'))
const RestaurantMenuItemForm = lazy(() => import('./pages/restaurant/RestaurantMenuItemForm'))
const RestaurantOrders = lazy(() => import('./pages/restaurant/RestaurantOrders'))
const RestaurantOrderForm = lazy(() => import('./pages/restaurant/RestaurantOrderForm'))
const RestaurantKitchen = lazy(() => import('./pages/restaurant/RestaurantKitchen'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectForm = lazy(() => import('./pages/ProjectForm'))
const Tasks = lazy(() => import('./pages/Tasks'))
const TaskForm = lazy(() => import('./pages/TaskForm'))
const IoT = lazy(() => import('./pages/IoT'))
const IoTDeviceForm = lazy(() => import('./pages/IoTDeviceForm'))
const Finance = lazy(() => import('./pages/Finance'))
const JobCosting = lazy(() => import('./pages/JobCosting'))
const JobCostingForm = lazy(() => import('./pages/JobCostingForm'))
const MRP = lazy(() => import('./pages/MRP'))
const WhatsApp = lazy(() => import('./pages/WhatsApp'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Expenses = lazy(() => import('./pages/Expenses'))
const ExpenseForm = lazy(() => import('./pages/ExpenseForm'))
const CustomerList = lazy(() => import('./pages/customers/CustomerList'))
const CustomerForm = lazy(() => import('./pages/customers/CustomerForm'))
const Users = lazy(() => import('./pages/Users'))
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'))
const TenantManagement = lazy(() => import('./pages/super-admin/TenantManagement'))
const TenantForm = lazy(() => import('./pages/super-admin/TenantForm'))
const UserManagement = lazy(() => import('./pages/super-admin/UserManagement'))
const GeminiSettings = lazy(() => import('./pages/super-admin/GeminiSettings'))
const EmailSettings = lazy(() => import('./pages/super-admin/EmailSettings'))
const WebsiteSettings = lazy(() => import('./pages/super-admin/WebsiteSettings'))
const EmailCommunication = lazy(() => import('./pages/EmailCommunication'))

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
  if (isLoading && !isAuthenticated) return <LoadingScreen />
  
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
  const businessTypes = getTenantBusinessTypes(tenant)
  
  if (Array.isArray(allowedTypes) && allowedTypes.length > 0 && !allowedTypes.some((type) => businessTypes.includes(type))) {
    return <Navigate to="/app/dashboard" replace />
  }
  
  return children
}

function App() {
  const dispatch = useDispatch()
  const { token, tenant, user } = useSelector((state) => state.auth)
  const { language, theme } = useSelector((state) => state.ui)

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe())
    }
  }, [dispatch, token, user])

  useEffect(() => {
    dispatch(setLanguage(language))
    dispatch(setTheme(theme))
  }, [])

  useEffect(() => {
    applyTenantBranding(tenant?.branding)
  }, [tenant])

  return (
    <Suspense fallback={<LoadingScreen />}>
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
        <Route path="email" element={<EmailSettings />} />
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
        <Route path="invoices/new/purchase" element={<BusinessTypeRoute allowedTypes={['trading', 'construction', 'travel_agency']}><InvoiceCreatePurchase /></BusinessTypeRoute>} />
        <Route path="invoices/:id/edit" element={<InvoiceEditPage />} />
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
        <Route path="vat-returns" element={<VatReturns />} />
        <Route path="email" element={<EmailCommunication />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}

export default App
