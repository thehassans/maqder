import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['trial', 'starter', 'professional', 'enterprise'],
    default: 'trial'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  maxUsers: { type: Number, default: 5 },
  maxInvoices: { type: Number, default: 100 },
  features: [{
    type: String,
    enum: ['hr', 'payroll', 'invoicing', 'inventory', 'ai', 'api_access', 'multi_warehouse', 'advanced_reports']
  }],
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  price: { type: Number, default: 0 }
});

const businessDetailsSchema = new mongoose.Schema({
  legalNameAr: { type: String, required: true },
  legalNameEn: { type: String, required: true },
  tradeName: { type: String },
  vatNumber: { type: String, required: true, unique: true },
  crNumber: { type: String, required: true },
  address: {
    street: { type: String },
    district: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'SA' },
    buildingNumber: { type: String },
    additionalNumber: { type: String }
  },
  contactPhone: { type: String },
  contactEmail: { type: String },
  website: { type: String }
});

const zatcaConfigSchema = new mongoose.Schema({
  isOnboarded: { type: Boolean, default: false },
  complianceCsid: { type: String },
  productionCsid: { type: String },
  privateKey: { type: String },
  certificateSerialNumber: { type: String },
  lastInvoiceHash: { type: String },
  invoiceCounter: { type: Number, default: 0 },
  deviceSerialNumber: { type: String },
  onboardedAt: { type: Date }
});

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  business: businessDetailsSchema,
  subscription: subscriptionSchema,
  zatca: zatcaConfigSchema,
  settings: {
    language: { type: String, enum: ['en', 'ar'], default: 'ar' },
    currency: { type: String, default: 'SAR' },
    timezone: { type: String, default: 'Asia/Riyadh' },
    fiscalYearStart: { type: Number, default: 1 },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    useHijriDates: { type: Boolean, default: true }
  },
  branding: {
    logo: { type: String },
    primaryColor: { type: String, default: '#14B8A6' },
    secondaryColor: { type: String, default: '#D946EF' },
    headerStyle: { type: String, enum: ['glass', 'solid'], default: 'glass' },
    sidebarStyle: { type: String, enum: ['glass', 'solid'], default: 'solid' }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

tenantSchema.index({ isActive: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);
export default Tenant;
