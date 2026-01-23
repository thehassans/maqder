import mongoose from 'mongoose';
import momentHijri from 'moment-hijri';

const invoiceLineSchema = new mongoose.Schema({
  lineNumber: { type: Number, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: true },
  productNameAr: { type: String },
  description: { type: String },
  quantity: { type: Number, required: true },
  unitCode: { type: String, default: 'PCE' },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
  taxCategory: { type: String, enum: ['S', 'Z', 'E', 'O'], default: 'S' },
  taxRate: { type: Number, default: 15 },
  taxAmount: { type: Number },
  lineTotal: { type: Number },
  lineTotalWithTax: { type: Number }
});

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameAr: { type: String },
  vatNumber: { type: String },
  crNumber: { type: String },
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
  contactEmail: { type: String }
});

const zatcaSchema = new mongoose.Schema({
  uuid: { type: String },
  invoiceCounter: { type: Number },
  previousInvoiceHash: { type: String },
  invoiceHash: { type: String },
  digitalSignature: { type: String },
  publicKeyHash: { type: String },
  signedXml: { type: String },
  qrCodeData: { type: String },
  qrCodeImage: { type: String },
  submissionStatus: {
    type: String,
    enum: ['pending', 'submitted', 'cleared', 'reported', 'rejected', 'warning'],
    default: 'pending'
  },
  clearanceStatus: { type: String },
  reportingStatus: { type: String },
  zatcaResponse: { type: mongoose.Schema.Types.Mixed },
  submittedAt: { type: Date },
  clearedAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  lastError: { type: String }
});

const inventorySchema = new mongoose.Schema({
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  postedAt: { type: Date },
  reversedAt: { type: Date }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  flow: { type: String, enum: ['sell', 'purchase'], default: 'sell', index: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', index: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', index: true },
  
  // Invoice Identification
  invoiceNumber: { type: String, required: true },
  invoiceType: { type: String, enum: ['388', '381', '383'], default: '388' },
  invoiceTypeCode: {
    type: String,
    enum: ['0100000', '0200000', '0100100', '0200100'],
    required: true
  },
  transactionType: { type: String, enum: ['B2B', 'B2C'], required: true },
  
  // Dates
  issueDate: { type: Date, required: true },
  issueDateHijri: { type: String },
  issueTime: { type: String },
  supplyDate: { type: Date },
  supplyDateHijri: { type: String },
  dueDate: { type: Date },
  
  // Parties
  seller: partySchema,
  buyer: partySchema,

  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
  
  // Line Items
  lineItems: [invoiceLineSchema],
  
  // Totals
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  taxableAmount: { type: Number },
  totalTax: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  
  // Currency
  currency: { type: String, default: 'SAR' },
  exchangeRate: { type: Number, default: 1 },
  
  // Payment
  paymentMethod: { type: String, enum: ['cash', 'credit', 'bank_transfer', 'cheque', 'other'], default: 'cash' },
  paymentTerms: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  paidAmount: { type: Number, default: 0 },
  
  // Reference
  purchaseOrderNumber: { type: String },
  contractNumber: { type: String },
  originalInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  
  // ZATCA Compliance
  zatca: zatcaSchema,

  inventory: inventorySchema,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'sent', 'cancelled', 'credited'],
    default: 'draft'
  },
  
  // Metadata
  notes: { type: String },
  internalNotes: { type: String },
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String }
  }],
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, {
  timestamps: true
});

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, issueDate: -1 });
invoiceSchema.index({ tenantId: 1, 'zatca.submissionStatus': 1 });
invoiceSchema.index({ tenantId: 1, transactionType: 1 });
invoiceSchema.index({ tenantId: 1, flow: 1, issueDate: -1 });

// Pre-save hook for Hijri dates
invoiceSchema.pre('validate', function(next) {
  if (this.isModified('issueDate') && this.issueDate) {
    this.issueDateHijri = momentHijri(this.issueDate).format('iYYYY/iMM/iDD');
  }
  if (this.isModified('supplyDate') && this.supplyDate) {
    this.supplyDateHijri = momentHijri(this.supplyDate).format('iYYYY/iMM/iDD');
  }
  
  const lines = Array.isArray(this.lineItems) ? this.lineItems : [];

  // Calculate line totals
  lines.forEach(line => {
    const lineSubtotal = line.quantity * line.unitPrice;
    let discountAmount = 0;
    if (line.discountType === 'percentage') {
      discountAmount = lineSubtotal * (line.discount / 100);
    } else {
      discountAmount = line.discount;
    }
    line.lineTotal = lineSubtotal - discountAmount;
    line.taxAmount = line.lineTotal * (line.taxRate / 100);
    line.lineTotalWithTax = line.lineTotal + line.taxAmount;
  });
  
  // Calculate invoice totals
  this.subtotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  this.totalDiscount = lines.reduce((sum, line) => {
    if (line.discountType === 'percentage') {
      return sum + (line.quantity * line.unitPrice * line.discount / 100);
    }
    return sum + line.discount;
  }, 0);
  this.taxableAmount = this.subtotal - this.totalDiscount;
  this.totalTax = lines.reduce((sum, line) => sum + (line.taxAmount || 0), 0);
  this.grandTotal = this.taxableAmount + this.totalTax;
  
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
