import Tenant from '../models/Tenant.js';

/**
 * Trial/Demo resource limits.
 * When a tenant is on trial or demo plan, these limits apply to all create operations.
 */
export const TRIAL_LIMITS = {
  invoices: 10,
  quotations: 10,
  customers: 10,
  suppliers: 1,
  purchaseOrders: 10,
  purchaseReturns: 5,
  products: 10,
  warehouses: 1,
  users: 5,
  projects: 5,
  tasks: 10,
  employees: 5,
  expenses: 10,
  vouchers: 10,
  shipments: 5,
  restaurantOrders: 10,
  restaurantMenuItems: 10,
  restaurantTables: 5,
  travelBookings: 10,
  rentalCars: 5,
  rentalCustomers: 10,
  saloonServices: 10,
  saloonStaff: 5,
  saloonAppointments: 10,
  laundryServices: 10,
  laundryCustomers: 10,
  laundryInventory: 10,
  promotions: 5,
  manpowerTimesheets: 10,
  khayyatStitchings: 10,
};

/**
 * Map of resource type -> Mongoose model name (for countDocuments).
 * The model is imported lazily to avoid circular dependencies.
 */
const MODEL_MAP = {
  invoices: 'Invoice',
  quotations: 'Quotation',
  customers: 'Customer',
  suppliers: 'Supplier',
  purchaseOrders: 'PurchaseOrder',
  purchaseReturns: 'PurchaseReturn',
  products: 'Product',
  warehouses: 'Warehouse',
  users: 'User',
  projects: 'Project',
  tasks: 'Task',
  employees: 'Employee',
  expenses: 'Expense',
  vouchers: 'Voucher',
  shipments: 'Shipment',
  restaurantOrders: 'RestaurantOrder',
  restaurantMenuItems: 'RestaurantMenuItem',
  restaurantTables: 'RestaurantTable',
  travelBookings: 'TravelBooking',
  rentalCars: 'RentalCar',
  rentalCustomers: 'RentalCustomer',
  saloonServices: 'SaloonService',
  saloonStaff: 'SaloonStaff',
  saloonAppointments: 'SaloonAppointment',
  laundryServices: 'LaundryService',
  laundryCustomers: 'LaundryCustomer',
  laundryInventory: 'LaundryInventory',
  promotions: 'Promotion',
  manpowerTimesheets: 'ManpowerTimesheet',
  khayyatStitchings: 'KhayyatStitching',
};

/**
 * Cache for dynamic model imports to avoid repeated dynamic import() calls.
 */
const modelCache = {};

async function getModel(modelName) {
  if (modelCache[modelName]) return modelCache[modelName];
  try {
    const mod = await import(`../models/${modelName}.js`);
    modelCache[modelName] = mod.default || mod;
    return modelCache[modelName];
  } catch (e) {
    return null;
  }
}

/**
 * Check if a tenant is on trial or demo.
 */
function isTrialTenant(tenant) {
  if (!tenant) return false;
  if (tenant.isDemo === true && !tenant.demoUpgraded) return true;
  if (tenant.subscription?.plan === 'trial') return true;
  return false;
}

/**
 * Middleware factory: checkTrialLimits(resourceType)
 * Usage: router.post('/', checkTrialLimits('invoices'), checkPermission('invoicing', 'create'), handler)
 *
 * If the tenant is on trial/demo, counts existing records and blocks creation if limit is reached.
 * Super admins and non-trial tenants are not affected.
 */
export function checkTrialLimits(resourceType) {
  return async (req, res, next) => {
    try {
      // Super admins bypass
      if (req.user?.role === 'super_admin') return next();

      const limit = TRIAL_LIMITS[resourceType];
      if (!limit) return next(); // no limit defined, allow

      // Get tenant from req.tenant (set by protect middleware) or fetch
      let tenant = req.tenant;
      if (!tenant && req.user?.tenantId) {
        tenant = await Tenant.findById(req.user.tenantId).lean();
      }
      if (!tenant) return next();

      // Only apply limits to trial/demo tenants
      if (!isTrialTenant(tenant)) return next();

      // Get the model and count existing records
      const modelName = MODEL_MAP[resourceType];
      if (!modelName) return next();

      const Model = await getModel(modelName);
      if (!Model) return next();

      const tenantFilter = { tenantId: req.user.tenantId };
      const currentCount = await Model.countDocuments(tenantFilter);

      if (currentCount >= limit) {
        return res.status(403).json({
          error: 'TRIAL_LIMIT_REACHED',
          limitType: resourceType,
          limit,
          current: currentCount,
          message: `Trial limit reached: ${currentCount}/${limit} ${resourceType}. Upgrade to full version to continue.`,
        });
      }

      next();
    } catch (err) {
      // On error, allow the request to proceed (fail open)
      console.error('checkTrialLimits error:', err);
      next();
    }
  };
}

export default { checkTrialLimits, TRIAL_LIMITS };
