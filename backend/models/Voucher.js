import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  voucherNumber: { type: String, required: true },
  type: { type: String, enum: ['receive', 'payment'], required: true },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  
  partyType: { type: String, enum: ['customer', 'supplier', 'employee', 'other'], required: true },
  partyId: { type: mongoose.Schema.Types.ObjectId },
  partyName: { type: String },
  
  paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'cheque', 'card', 'other'], default: 'cash' },
  reference: { type: String },
  description: { type: String },
  
  status: { type: String, enum: ['draft', 'approved', 'cancelled'], default: 'approved' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

voucherSchema.index({ tenantId: 1, voucherNumber: 1 }, { unique: true });
voucherSchema.index({ tenantId: 1, type: 1, date: -1 });
voucherSchema.index({ tenantId: 1, partyId: 1 });

export default mongoose.models.Voucher || mongoose.model('Voucher', voucherSchema);
