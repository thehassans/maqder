import mongoose from 'mongoose';

const EcommerceGiftCardSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  balance: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'SAR' },
  status: { type: String, enum: ['active', 'redeemed', 'expired', 'disabled'], default: 'active' },
  recipientName: { type: String, default: '' },
  recipientEmail: { type: String, default: '' },
  note: { type: String, default: '' },
  expiresAt: { type: Date, default: null },
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  redeemedOrders: [{
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceOrder' },
    amount: Number,
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

EcommerceGiftCardSchema.statics.generateCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GC-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

export default mongoose.model('EcommerceGiftCard', EcommerceGiftCardSchema);
