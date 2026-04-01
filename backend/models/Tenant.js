import mongoose from 'mongoose';
import { BUSINESS_TYPES } from '../utils/businessTypes.js';

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

const invoiceBrandingProfileSchema = new mongoose.Schema({
  templateId: { type: Number, min: 1, max: 6 },
  logo: { type: String },
  headerTextEn: { type: String, default: '' },
  headerTextAr: { type: String, default: '' },
  footerTextEn: { type: String, default: '' },
  footerTextAr: { type: String, default: '' },
}, { _id: false });

const invoiceTypographySchema = new mongoose.Schema({
  bodyFontFamily: { type: String, enum: ['helvetica', 'times', 'courier'], default: 'helvetica' },
  headingFontFamily: { type: String, enum: ['helvetica', 'times', 'courier'], default: 'helvetica' },
  bodyFontSize: { type: Number, min: 9, max: 40, default: 12 },
  headingFontSize: { type: Number, min: 9, max: 40, default: 18 },
}, { _id: false });

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  businessType: { type: String, enum: BUSINESS_TYPES, default: 'trading', index: true },
  businessTypes: {
    type: [{ type: String, enum: BUSINESS_TYPES }],
    default: ['trading'],
  },
  business: businessDetailsSchema,
  subscription: subscriptionSchema,
  zatca: zatcaConfigSchema,
  settings: {
    language: { type: String, enum: ['en', 'ar'], default: 'ar' },
    currency: { type: String, default: 'SAR' },
    timezone: { type: String, default: 'Asia/Riyadh' },
    fiscalYearStart: { type: Number, default: 1 },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    useHijriDates: { type: Boolean, default: true },
    invoicePdfTemplate: { type: Number, default: 1, min: 1, max: 6 },
    invoicePdfPageSize: { type: String, enum: ['a4', 'letter', 'a5'], default: 'a4' },
    invoicePdfOrientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
    invoiceBranding: {
      logo: { type: String },
      headerTextEn: { type: String, default: '' },
      headerTextAr: { type: String, default: '' },
      footerTextEn: { type: String, default: '' },
      footerTextAr: { type: String, default: '' },
      typography: { type: invoiceTypographySchema, default: () => ({}) },
      showVision2030: { type: Boolean, default: true },
      vision2030Logo: { type: String },
      contextProfiles: {
        trading: { type: invoiceBrandingProfileSchema, default: () => ({ templateId: 5 }) },
        construction: { type: invoiceBrandingProfileSchema, default: () => ({ templateId: 6 }) },
        travel_agency: { type: invoiceBrandingProfileSchema, default: () => ({ templateId: 4 }) },
      }
    }
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

tenantSchema.pre('validate', function(next) {
  const values = Array.isArray(this.businessTypes) && this.businessTypes.length > 0
    ? this.businessTypes
    : [this.businessType || 'trading'];

  const normalized = [...new Set(values.filter((value) => BUSINESS_TYPES.includes(value)))];
  this.businessTypes = normalized.length ? normalized : ['trading'];

  if (!this.businessType || !this.businessTypes.includes(this.businessType)) {
    this.businessType = this.businessTypes[0] || 'trading';
  }

  next();
});

tenantSchema.index({ isActive: 1 });
tenantSchema.index({ businessType: 1 });
tenantSchema.index({ businessTypes: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);
export default Tenant;
