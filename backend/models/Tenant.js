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
  hasEmailAddon: { type: Boolean, default: false },
  features: [{
    type: String,
    enum: ['hr', 'payroll', 'invoicing', 'inventory', 'ai', 'api_access', 'multi_warehouse', 'advanced_reports', 'email_automation']
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
    // How SAR is rendered next to amounts on invoices and PDFs.
    // - 'icon'  → Saudi Riyal symbol (﷼)
    // - 'text'  → the letters "SAR"
    invoiceCurrencyDisplay: { type: String, enum: ['icon', 'text'], default: 'text' },
    // Where the currency marker sits relative to the amount.
    invoiceCurrencyPosition: { type: String, enum: ['before', 'after'], default: 'after' },
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
    },
    communication: {
      email: {
        enabled: { type: Boolean, default: false },
        autoSendInvoices: { type: Boolean, default: false },
        identityType: { type: String, enum: ['platform', 'custom_smtp'], default: 'platform' },
        identityStatus: { type: String, enum: ['not_requested', 'requested', 'configured', 'verified'], default: 'not_requested' },
        platformProvider: { type: String, enum: ['platform', 'brevo'], default: 'platform' },
        providerSenderId: { type: String, default: '' },
        providerSenderStatus: { type: String, default: '' },
        requestedSenderName: { type: String, default: '' },
        requestedSenderEmail: { type: String, default: '' },
        senderName: { type: String, default: '' },
        fromEmail: { type: String, default: '' },
        replyTo: { type: String, default: '' },
        inboundAddress: { type: String, default: '' },
        smtpHost: { type: String, default: '' },
        smtpPort: { type: Number, default: 587 },
        smtpSecure: { type: Boolean, default: false },
        smtpUser: { type: String, default: '' },
        smtpPass: { type: String, default: '' },
        subjectEn: { type: String, default: '' },
        subjectAr: { type: String, default: '' },
        bodyEn: { type: String, default: '' },
        bodyAr: { type: String, default: '' },
        signatureEn: { type: String, default: '' },
        signatureAr: { type: String, default: '' }
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
  const currentSubscription = this.subscription?.toObject?.() || this.subscription || {};
  const features = Array.isArray(currentSubscription.features) ? currentSubscription.features.filter(Boolean) : [];
  const hasEmailAddon = currentSubscription.hasEmailAddon === true;

  const normalized = [...new Set(values.filter((value) => BUSINESS_TYPES.includes(value)))];
  this.businessTypes = normalized.length ? normalized : ['trading'];

  this.subscription = {
    ...currentSubscription,
    hasEmailAddon,
    features: hasEmailAddon
      ? [...new Set([...features, 'email_automation'])]
      : features.filter((feature) => feature !== 'email_automation'),
  };

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
