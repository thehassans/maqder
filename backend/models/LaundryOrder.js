import mongoose from 'mongoose';
import { generateZatcaQr } from '../lib/zatcaQr.js';

const laundryOrderItemSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryService', required: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  billingType: { type: String, enum: ['per_kg', 'per_piece'], required: true },
  quantity: { type: Number, required: true, min: 0.1 }, // KG or Pieces
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 15 },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  total: { type: Number, required: true },
  treatment: { type: String, enum: ['Wash & Fold', 'Dry Clean', 'Wash & Iron', 'Iron Only', 'Pressing'], default: 'Wash & Fold' },
  customizations: [{ type: String }] // e.g., 'On Hanger', 'Folded', 'Starch'
}, { _id: true });

const laundryOrderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  orderNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryCustomer' },
  
  status: { 
    type: String, 
    enum: ['received', 'processing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'received'
  },
  
  isUrgent: { type: Boolean, default: false },
  
  items: [laundryOrderItemSchema],
  
  garmentTags: [{ type: String }], // Generated barcodes
  promisedDate: { type: Date },
  deliveryType: { type: String, enum: ['walk_in', 'delivery'], default: 'walk_in' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },

  // Financials
  subtotal: { type: Number, required: true, default: 0 },
  totalVat: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'none'], default: 'none' },
  
  zatcaQrCode: { type: String }, // Phase 2 TLMV Base64 String
  notes: { type: String },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

laundryOrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
laundryOrderSchema.index({ tenantId: 1, status: 1 });
laundryOrderSchema.index({ tenantId: 1, customer: 1 });
laundryOrderSchema.index({ tenantId: 1, createdAt: -1 });

// Pre-save hook for ZATCA QR and Auto-Numbering
laundryOrderSchema.pre('save', async function(next) {
  // 1. Auto-generate Order Number
  if (this.isNew && !this.orderNumber) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.constructor.countDocuments({ 
      tenantId: this.tenantId,
      createdAt: { $gte: new Date().setHours(0,0,0,0) }
    });
    this.orderNumber = `LND-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  // 2. Compute Financials
  if (this.isModified('items')) {
    let subtotal = 0;
    let totalVat = 0;
    
    this.items.forEach(item => {
      item.subtotal = item.quantity * item.unitPrice;
      item.taxAmount = item.subtotal * (item.taxRate / 100);
      item.total = item.subtotal + item.taxAmount;
      
      subtotal += item.subtotal;
      totalVat += item.taxAmount;
    });
    
    this.subtotal = subtotal;
    this.totalVat = totalVat;
    this.grandTotal = subtotal + totalVat;
  }
  
  // 3. Payment Status
  if (this.amountPaid >= this.grandTotal && this.grandTotal > 0) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'unpaid';
  }

  // 4. Generate ZATCA QR if paid
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && !this.zatcaQrCode) {
    try {
      await this.populate('tenantId', 'business.legalNameAr business.vatNumber');
      const sellerName = this.tenantId?.business?.legalNameAr || 'مغسلة';
      const vatNumber = this.tenantId?.business?.vatNumber || '300000000000003';
      
      this.zatcaQrCode = generateZatcaQr({
        sellerName,
        vatRegistrationNumber: vatNumber,
        timestamp: new Date().toISOString(),
        invoiceTotal: this.grandTotal,
        vatTotal: this.totalVat
      });
    } catch (err) {
      console.error('Failed to generate ZATCA QR for Laundry Order:', err);
    }
  }

  next();
});

const LaundryOrder = mongoose.model('LaundryOrder', laundryOrderSchema);
export default LaundryOrder;
