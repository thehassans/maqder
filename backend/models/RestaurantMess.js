import mongoose from 'mongoose';

// Meal plan (e.g., "Monthly Lunch+Dinner", "Weekly Breakfast", "Daily All Meals")
const messPlanSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  name: { type: String, required: true }, // e.g., "Monthly Full Board"
  nameAr: { type: String },
  description: { type: String },

  // Which meals are included
  meals: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  }],

  // Billing cycle
  billingCycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly'],
    default: 'monthly',
  },

  // Pricing
  pricePerCycle: { type: Number, required: true }, // e.g., 300 SAR/month
  pricePerMeal: { type: Number, default: 0 }, // if attendance-based billing
  currency: { type: String, default: 'SAR' },

  // Billing mode
  billingMode: {
    type: String,
    enum: ['fixed', 'attendance_based', 'hybrid'],
    default: 'fixed', // fixed = pay full regardless, attendance = pay per meal, hybrid = base + per meal
  },
  basePrice: { type: Number, default: 0 }, // for hybrid mode

  // Capacity
  maxSubscribers: { type: Number, default: 0 }, // 0 = unlimited

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Subscriber (person enrolled in a mess plan)
const messSubscriberSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },

  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessPlan', required: true },

  // Person details
  name: { type: String, required: true },
  nameAr: { type: String },
  phone: { type: String },
  email: { type: String },
  idNumber: { type: String }, // Iqama / national ID
  employeeId: { type: String }, // company employee ID
  photoUrl: { type: String },

  // Company / sponsor
  companyName: { type: String },
  companyContact: { type: String },
  sponsorName: { type: String },
  sponsorPhone: { type: String },

  // Subscription dates
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // null = ongoing
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active',
    index: true,
  },

  // Billing
  billingMode: { type: String, enum: ['fixed', 'attendance_based', 'hybrid'], default: 'fixed' },
  outstandingBalance: { type: Number, default: 0 },

  // Notes
  dietaryRestrictions: { type: String }, // vegetarian, allergies, etc.
  notes: { type: String },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Daily attendance (meal check-in)
const messAttendanceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },

  subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessSubscriber', required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessPlan', required: true },

  date: { type: Date, required: true }, // the meal date
  meal: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },

  status: {
    type: String,
    enum: ['present', 'absent', 'skipped'],
    default: 'present',
  },

  checkInTime: { type: Date, default: Date.now },
  checkInMethod: {
    type: String,
    enum: ['manual', 'qr', 'biometric', 'card'],
    default: 'manual',
  },

  notes: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Monthly billing record
const messBillingSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  subscriberId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessSubscriber', required: true, index: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MessPlan', required: true },

  // Billing period
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  periodLabel: { type: String }, // e.g., "June 2026"

  // Meal counts
  mealCounts: {
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 },
    snack: { type: Number, default: 0 },
  },
  totalMeals: { type: Number, default: 0 },

  // Pricing
  billingMode: { type: String, enum: ['fixed', 'attendance_based', 'hybrid'], default: 'fixed' },
  baseAmount: { type: Number, default: 0 },
  perMealAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },

  // Payment
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true,
  },
  paidAt: { type: Date },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'company', 'other'] },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Indexes
messPlanSchema.index({ tenantId: 1, isActive: 1 });
messSubscriberSchema.index({ tenantId: 1, status: 1, planId: 1 });
messSubscriberSchema.index({ tenantId: 1, phone: 1 });
messAttendanceSchema.index({ tenantId: 1, date: 1, meal: 1 });
messAttendanceSchema.index({ subscriberId: 1, date: 1, meal: 1 }, { unique: true });
messBillingSchema.index({ tenantId: 1, status: 1, periodStart: -1 });
messBillingSchema.index({ subscriberId: 1, periodStart: -1 });

export const MessPlan = mongoose.models.MessPlan || mongoose.model('MessPlan', messPlanSchema);
export const MessSubscriber = mongoose.models.MessSubscriber || mongoose.model('MessSubscriber', messSubscriberSchema);
export const MessAttendance = mongoose.models.MessAttendance || mongoose.model('MessAttendance', messAttendanceSchema);
export const MessBilling = mongoose.models.MessBilling || mongoose.model('MessBilling', messBillingSchema);
