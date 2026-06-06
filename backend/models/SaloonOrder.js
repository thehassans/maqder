import mongoose from 'mongoose';
import { generateZatcaQr } from '../lib/zatcaQr.js';

const saloonOrderItemSchema = new mongoose.Schema({
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'SaloonService' },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 15 },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, required: true },
  total: { type: Number, required: true },
  staff: { type: String } // e.g. Barber name
}, { _id: true });

const saloonOrderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  orderNumber: { type: String },
  queueNumber: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  
  status: { 
    type: String, 
    enum: ['waiting', 'in_progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  
  items: [saloonOrderItemSchema],
  
  appointmentDate: { type: Date },

  // Financials
  subtotal: { type: Number, required: true, default: 0 },
  totalVat: { type: Number, required: true, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', 'other', 'none'], default: 'none' },
  posPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PosPayment' },
  
  zatcaQrCode: { type: String },
  notes: { type: String },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

saloonOrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
saloonOrderSchema.index({ tenantId: 1, status: 1 });

// Pre-save to calculate ZATCA QR
saloonOrderSchema.pre('save', async function(next) {
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && !this.zatcaQrCode) {
    try {
      const tenant = await mongoose.model('Tenant').findById(this.tenantId).select('business.legalNameAr business.vatNumber');
      if (tenant?.business?.vatNumber) {
        this.zatcaQrCode = generateZatcaQr({
          sellerName: tenant.business.legalNameAr || 'Saloon',
          vatRegistrationNumber: tenant.business.vatNumber,
          timestamp: new Date().toISOString(),
          invoiceTotal: this.grandTotal,
          vatTotal: this.totalVat
        });
      }
    } catch (err) {
      console.error('Error generating ZATCA QR for Saloon Order:', err);
    }
  }
  next();
});

const SaloonOrder = mongoose.model('SaloonOrder', saloonOrderSchema);
export default SaloonOrder;
