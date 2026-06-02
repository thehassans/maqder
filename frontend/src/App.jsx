import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { getMe, setTenantInactive } from './store/slices/authSlice'
import { setLanguage, setTheme } from './store/slices/uiSlice'
import { applyTenantBranding } from './lib/branding'
import { getTenantBusinessTypes } from './lib/businessTypes'
import { ErrorBoundary } from './lib/errorBoundary'

import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import SuperAdminLayout from './layouts/SuperAdminLayout'
import MarketingLayout from './layouts/MarketingLayout'

import Login from './pages/auth/Login'
import MarketingHome from './pages/marketing/Home'
import MarketingSolutions from './pages/marketing/Solutions'
import SolutionDetail from './pages/marketing/SolutionDetail'
import MarketingPricing from './pages/marketing/Pricing'
import MarketingAbout from './pages/marketing/About'
import MarketingContact from './pages/marketing/Contact'
import MarketingPrivacy from './pages/marketing/Privacy'
import MarketingTerms from './pages/marketing/Terms'
import InactiveTenant from './pages/auth/InactiveTenant'
import KhayyatDashboard from './pages/khayyat/Dashboard'
import KhayyatWorkers from './pages/khayyat/Workers'
import KhayyatWorkerForm from './pages/khayyat/WorkerForm'
import KhayyatWorkerAmounts from './pages/khayyat/WorkerAmounts'
import KhayyatStitchings from './pages/khayyat/Stitchings'
import KhayyatStitchingForm from './pages/khayyat/StitchingForm'
import KhayyatEmbroideryDesigns from './pages/khayyat/EmbroideryDesigns'
import KhayyatFabrics from './pages/khayyat/Fabrics'
import KhayyatLaundry from './pages/khayyat/Laundry'
import KhayyatLoyalty from './pages/khayyat/Loyalty'
import Dashboard from './pages/Dashboard'
import Invoices from './pages/invoices/Invoices'
import InvoiceCreate from './pages/invoices/InvoiceCreate'
import InvoiceCreateSell from './pages/invoices/InvoiceCreateSellPage'
import InvoiceCreatePurchase from './pages/invoices/InvoiceCreatePurchasePage'
import InvoiceEditPage from './pages/invoices/InvoiceEditPage'
import InvoiceView from './pages/invoices/InvoiceView'
import Quotations from './pages/quotations/Quotations'
import QuotationCreatePage from './pages/quotations/QuotationCreatePage'
import QuotationEditPage from './pages/quotations/QuotationEditPage'
import QuotationView from './pages/quotations/QuotationView'
import Employees from './pages/hr/Employees'
import EmployeeForm from './pages/hr/EmployeeForm'
import Payroll from './pages/hr/Payroll'
import PayrollCalculators from './pages/hr/PayrollCalculators'
import Attendance from './pages/hr/Attendance'
import Products from './pages/inventory/Products'
import ProductForm from './pages/inventory/ProductForm'
import Warehouses from './pages/inventory/Warehouses'
import WarehouseForm from './pages/inventory/WarehouseForm'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import VatReturns from './pages/VatReturns'
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
import RestaurantPOS from './pages/restaurant/RestaurantPOS'
import RestaurantTables from './pages/restaurant/Tables'
import RestaurantInventory from './pages/restaurant/Inventory'
import RestaurantBranches from './pages/restaurant/Branches'
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
import TenantCustomization from './pages/super-admin/TenantCustomization'
import UserManagement from './pages/super-admin/UserManagement'
import IdentitySettings from './pages/super-admin/IdentitySettings'
import GeminiSettings from './pages/super-admin/GeminiSettings'
import EmailSettings from './pages/super-admin/EmailSettings'
import WebsiteSettings from './pages/super-admin/WebsiteSettings'
import ManpowerDashboard from './pages/manpower/ManpowerDashboard'
import ManpowerWorkers from './pages/manpower/ManpowerWorkers'
import ManpowerWorkerForm from './pages/manpower/ManpowerWorkerForm'
import ManpowerWorkersBulk from './pages/manpower/ManpowerWorkersBulk'
import ManpowerAssignments from './pages/manpower/ManpowerAssignments'
import ManpowerAssignmentForm from './pages/manpower/ManpowerAssignmentForm'
import ManpowerContractPrint from './pages/manpower/ManpowerContractPrint'
import SystemSettings from './pages/super-admin/SystemSettings'
import EmailCommunication from './pages/EmailCommunication'
import FleetAssets from './pages/fleet/FleetAssets'
import FleetAssetForm from './pages/fleet/FleetAssetForm'
import MaintenanceAlerts from './pages/fleet/MaintenanceAlerts'
import Contracts from './pages/contracts/Contracts'
import ContractForm from './pages/contracts/ContractForm'
import LandedCosts from './pages/landed-costs/LandedCosts'
import LandedCostForm from './pages/landed-costs/LandedCostForm'
import Compliance from './pages/compliance/Compliance'
import Communicate from './pages/Communicate'
import SaudiCompliance from './pages/compliance/SaudiCompliance'
import CarRentalLayout from './layouts/CarRentalLayout'
import FleetList from './pages/car-rental/FleetList'
import CarForm from './pages/car-rental/CarForm'
import CustomerRegistry from './pages/car-rental/CustomerRegistry'
import CustomerKycForm from './pages/car-rental/CustomerForm'
import ActiveRentals from './pages/car-rental/ActiveRentals'
import CheckoutPOS from './pages/car-rental/CheckoutPOS'
import CheckinPOS from './pages/car-rental/CheckinPOS'
import ContractDetail from './pages/car-rental/ContractDetail'

import LaundryLayout from './layouts/LaundryLayout'
import LaundryPOS from './pages/laundry/LaundryPOS'
import LaundryServices from './pages/laundry/LaundryServices'
import LaundryKanban from './pages/laundry/LaundryKanban'
import LaundryCustomers from './pages/laundry/LaundryCustomers'
import LaundryInventory from './pages/laundry/LaundryInventory'

import SaloonLayout from './layouts/SaloonLayout'
import SaloonPOS from './pages/saloon/SaloonPOS'
import SaloonServices from './pages/saloon/SaloonServices'
import SaloonOrders from './pages/saloon/SaloonOrders'
import Letterhead from './pages/Letterhead'

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
    const handler = () => dispatch(setTenantInactive())
    window.addEventListener('tenant-inactive', handler)
    return () => window.removeEventListener('tenant-inactive', handler)
  }, [dispatch])

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
        <Route path="solutions" element={<MarketingSolutions />} />
        <Route path="solutions/:slug" element={<SolutionDetail />} />
        <Route path="pricing" element={<MarketingPricing />} />
        <Route path="about" element={<MarketingAbout />} />
        <Route path="contact" element={<MarketingContact />} />
        <Route path="privacy" element={<MarketingPrivacy />} />
        <Route path="terms" element={<MarketingTerms />} />
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/inactive" element={<InactiveTenant />} />
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
          <Route path="tenants/:id/customization" element={<TenantCustomization />}>
            <Route path="new" element={<RestaurantMenuItemForm />} />
            <Route path=":itemId" element={<RestaurantMenuItemForm />} />
          </Route>
          <Route path="users" element={<UserManagement />} />
        <Route path="website" element={<WebsiteSettings />} />
        <Route path="email" element={<EmailSettings />} />
        <Route path="identity" element={<IdentitySettings />} />
        <Route path="gemini" element={<GeminiSettings />} />
        <Route path="system-settings" element={<SystemSettings />} />
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
          {/* Khayyat Routes */}
          <Route path="khayyat" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatStitchingForm /></BusinessTypeRoute>} />
          <Route path="khayyat/analytics" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatDashboard /></BusinessTypeRoute>} />
          <Route path="khayyat/workers" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatWorkers /></BusinessTypeRoute>} />
          <Route path="khayyat/workers/new" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatWorkerForm /></BusinessTypeRoute>} />
          <Route path="khayyat/workers/:id" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatWorkerForm /></BusinessTypeRoute>} />
          <Route path="khayyat/worker-amounts" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatWorkerAmounts /></BusinessTypeRoute>} />
          <Route path="khayyat/stitchings" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatStitchings /></BusinessTypeRoute>} />
          <Route path="khayyat/stitchings/new" element={<Navigate to="/app/dashboard/khayyat" replace />} />
          <Route path="khayyat/stitchings/:id" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatStitchingForm /></BusinessTypeRoute>} />
          <Route path="khayyat/embroidery-designs" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatEmbroideryDesigns /></BusinessTypeRoute>} />
          <Route path="khayyat/fabrics" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatFabrics /></BusinessTypeRoute>} />
          <Route path="khayyat/laundry" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatLaundry /></BusinessTypeRoute>} />
          <Route path="khayyat/loyalty" element={<BusinessTypeRoute allowedTypes={['khayyat']}><KhayyatLoyalty /></BusinessTypeRoute>} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<InvoiceCreate />} />
        <Route path="invoices/new/sell" element={<InvoiceCreateSell />} />
        <Route path="invoices/new/purchase" element={<BusinessTypeRoute allowedTypes={['trading', 'construction', 'travel_agency']}><InvoiceCreatePurchase /></BusinessTypeRoute>} />
        <Route path="invoices/:id/edit" element={<InvoiceEditPage />} />
        <Route path="invoices/:id" element={<InvoiceView />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="quotations/new" element={<QuotationCreatePage />} />
        <Route path="quotations/:id/edit" element={<QuotationEditPage />} />
        <Route path="quotations/:id" element={<QuotationView />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        
        <Route path="letterhead" element={<Letterhead />} />

        {/* Manpower Routes */}
        <Route path="manpower" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerDashboard /></BusinessTypeRoute>} />
        <Route path="manpower/workers" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerWorkers /></BusinessTypeRoute>} />
        <Route path="manpower/workers/new" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerWorkerForm /></BusinessTypeRoute>} />
        <Route path="manpower/workers/bulk" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerWorkersBulk /></BusinessTypeRoute>} />
        <Route path="manpower/workers/:id" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerWorkerForm /></BusinessTypeRoute>} />
        <Route path="manpower/assignments" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerAssignments /></BusinessTypeRoute>} />
        <Route path="manpower/assignments/new" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerAssignmentForm /></BusinessTypeRoute>} />
        <Route path="manpower/assignments/:id" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerAssignmentForm /></BusinessTypeRoute>} />
        <Route path="manpower/assignments/:id/print" element={<BusinessTypeRoute allowedTypes={['manpower']}><ManpowerContractPrint /></BusinessTypeRoute>} />

        <Route path="travel-bookings" element={<BusinessTypeRoute allowedTypes={['travel_agency']}><TravelBookings /></BusinessTypeRoute>} />
        <Route path="travel-bookings/new" element={<BusinessTypeRoute allowedTypes={['travel_agency']}><TravelBookingForm /></BusinessTypeRoute>} />
        <Route path="travel-bookings/:id" element={<BusinessTypeRoute allowedTypes={['travel_agency']}><TravelBookingForm /></BusinessTypeRoute>} />
        <Route path="restaurant/pos" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantPOS /></BusinessTypeRoute>} />
        <Route path="restaurant/tables" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantTables /></BusinessTypeRoute>} />
        <Route path="restaurant/inventory" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantInventory /></BusinessTypeRoute>} />
        <Route path="restaurant/branches" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantBranches /></BusinessTypeRoute>} />
        <Route path="restaurant/menu-items" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantMenuItems /></BusinessTypeRoute>} />
        <Route path="restaurant/menu-items/new" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantMenuItemForm /></BusinessTypeRoute>} />
        <Route path="restaurant/menu-items/:id" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantMenuItemForm /></BusinessTypeRoute>} />
        <Route path="restaurant/orders" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantOrders /></BusinessTypeRoute>} />
        <Route path="restaurant/orders/new" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantOrderForm /></BusinessTypeRoute>} />
        <Route path="restaurant/orders/:id" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantOrderForm /></BusinessTypeRoute>} />
        <Route path="laundry/pos" element={<BusinessTypeRoute allowedTypes={['laundry']}><LaundryPOS /></BusinessTypeRoute>} />
        <Route path="laundry/services" element={<BusinessTypeRoute allowedTypes={['laundry']}><LaundryServices /></BusinessTypeRoute>} />
        <Route path="laundry/orders" element={<BusinessTypeRoute allowedTypes={['laundry']}><LaundryKanban /></BusinessTypeRoute>} />
        <Route path="restaurant/kitchen" element={<BusinessTypeRoute allowedTypes={['restaurant']}><RestaurantKitchen /></BusinessTypeRoute>} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="expenses/new" element={<ExpenseForm />} />
        <Route path="expenses/:id" element={<ExpenseForm />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id" element={<EmployeeForm />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="payroll/calculators" element={<PayrollCalculators />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="products" element={<BusinessTypeRoute allowedTypes={['trading']}><Products /></BusinessTypeRoute>} />
        <Route path="products/new" element={<BusinessTypeRoute allowedTypes={['trading']}><ProductForm /></BusinessTypeRoute>} />
        <Route path="products/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><ProductForm /></BusinessTypeRoute>} />
        <Route path="warehouses" element={<BusinessTypeRoute allowedTypes={['trading']}><Warehouses /></BusinessTypeRoute>} />
        <Route path="warehouses/new" element={<BusinessTypeRoute allowedTypes={['trading']}><WarehouseForm /></BusinessTypeRoute>} />
        <Route path="warehouses/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><WarehouseForm /></BusinessTypeRoute>} />
        <Route path="suppliers" element={<BusinessTypeRoute allowedTypes={['trading']}><Suppliers /></BusinessTypeRoute>} />
        <Route path="suppliers/new" element={<BusinessTypeRoute allowedTypes={['trading']}><SupplierForm /></BusinessTypeRoute>} />
        <Route path="suppliers/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><SupplierForm /></BusinessTypeRoute>} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchase-orders/new" element={<PurchaseOrderForm />} />
        <Route path="purchase-orders/:id" element={<PurchaseOrderForm />} />
        <Route path="shipments" element={<BusinessTypeRoute allowedTypes={['trading']}><Shipments /></BusinessTypeRoute>} />
        <Route path="shipments/new" element={<BusinessTypeRoute allowedTypes={['trading']}><ShipmentForm /></BusinessTypeRoute>} />
        <Route path="shipments/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><ShipmentForm /></BusinessTypeRoute>} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/:id" element={<ProjectForm />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/new" element={<TaskForm />} />
        <Route path="tasks/:id" element={<TaskForm />} />
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
        <Route path="communicate" element={<ErrorBoundary><Communicate /></ErrorBoundary>} />
        <Route path="saudi-compliance" element={<ErrorBoundary><SaudiCompliance /></ErrorBoundary>} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        {/* Fleet & Machinery */}
        <Route path="fleet" element={<BusinessTypeRoute allowedTypes={['construction','trading']}><FleetAssets /></BusinessTypeRoute>} />
        <Route path="fleet/new" element={<BusinessTypeRoute allowedTypes={['construction','trading']}><FleetAssetForm /></BusinessTypeRoute>} />
        <Route path="fleet/maintenance-alerts" element={<BusinessTypeRoute allowedTypes={['construction','trading']}><MaintenanceAlerts /></BusinessTypeRoute>} />
        <Route path="fleet/:id" element={<BusinessTypeRoute allowedTypes={['construction','trading']}><FleetAssetForm /></BusinessTypeRoute>} />
        {/* Contract Management */}
        <Route path="contracts" element={<Contracts />} />
        <Route path="contracts/new" element={<ContractForm />} />
        <Route path="contracts/:id" element={<ContractForm />} />
        {/* Landed Costs */}
        <Route path="landed-costs" element={<BusinessTypeRoute allowedTypes={['trading']}><LandedCosts /></BusinessTypeRoute>} />
        <Route path="landed-costs/new" element={<BusinessTypeRoute allowedTypes={['trading']}><LandedCostForm /></BusinessTypeRoute>} />
        <Route path="landed-costs/:id" element={<BusinessTypeRoute allowedTypes={['trading']}><LandedCostForm /></BusinessTypeRoute>} />
        {/* Local Compliance */}
        <Route path="compliance" element={<Compliance />} />
      </Route>

      {/* ───── Car Rental Shell ───── */}
      <Route
        path="/app/rental"
        element={
          <ProtectedRoute redirectSuperAdmin>
            <BusinessTypeRoute allowedTypes={['car_rental']}>
              <CarRentalLayout />
            </BusinessTypeRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/rental/active" replace />} />
        {/* POS */}
        <Route path="checkout" element={<CheckoutPOS />} />
        <Route path="active" element={<ActiveRentals />} />
        {/* Fleet */}
        <Route path="fleet" element={<FleetList />} />
        <Route path="fleet/new" element={<CarForm />} />
        <Route path="fleet/:id" element={<CarForm />} />
        {/* Customers */}
        <Route path="customers" element={<CustomerRegistry />} />
        <Route path="customers/new" element={<CustomerKycForm />} />
        <Route path="customers/:id" element={<CustomerKycForm />} />
        {/* Contracts */}
        <Route path="contracts" element={<Navigate to="/app/rental/active" replace />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="contracts/:id/checkin" element={<CheckinPOS />} />
      </Route>

      {/* ───── Laundry Shell ───── */}
      <Route
        path="/app/laundry"
        element={
          <ProtectedRoute redirectSuperAdmin>
            <BusinessTypeRoute allowedTypes={['laundry']}>
              <LaundryLayout />
            </BusinessTypeRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/laundry/pos" replace />} />
        <Route path="pos" element={<LaundryPOS />} />
        <Route path="orders" element={<LaundryKanban />} />
        <Route path="customers" element={<LaundryCustomers />} />
        <Route path="inventory" element={<LaundryInventory />} />
        <Route path="catalog" element={<LaundryServices />} />
      </Route>

      <Route
        path="/app/saloon"
        element={
          <ProtectedRoute redirectSuperAdmin>
            <BusinessTypeRoute allowedTypes={['saloon']}>
              <SaloonLayout />
            </BusinessTypeRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/saloon/pos" replace />} />
        <Route path="pos" element={<SaloonPOS />} />
        <Route path="services" element={<SaloonServices />} />
        <Route path="orders" element={<SaloonOrders />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

