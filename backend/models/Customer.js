import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['individual', 'business'],
    default: 'business'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameAr: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  vatNumber: {
    type: String,
    trim: true
  },
  crNumber: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    district: String,
    postalCode: String,
    country: { type: String, default: 'SA' },
    buildingNumber: String,
    additionalNumber: String
  },
  contactPerson: {
    name: String,
    email: String,
    phone: String,
    position: String
  },
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net15', 'net30', 'net45', 'net60', 'net90'],
    default: 'net30'
  },
  creditLimit: {
    type: Number,
    default: 0
  },
  notes: {
    type: String
  },
  tags: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  totalInvoices: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  lastInvoiceDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ tenantId: 1, name: 1 });
customerSchema.index({ tenantId: 1, email: 1 });
customerSchema.index({ tenantId: 1, vatNumber: 1 });
customerSchema.index({ tenantId: 1, isActive: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
