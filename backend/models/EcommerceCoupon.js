import mongoose from 'mongoose';

const ecommerceCouponSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'], default: 'percentage' },
  value: { type: Number, required: true, default: 0 }, // percentage (1-100) or fixed amount
  minSubtotal: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 }, // cap for percentage discounts
  usageLimit: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  perCustomerLimit: { type: Number, default: 0 }, // 0 = unlimited
  startsAt: { type: Date, default: Date.now },
  endsAt: { type: Date },
  isActive: { type: Boolean, default: true },
  appliesTo: { type: String, enum: ['all', 'specific_products', 'specific_categories'], default: 'all' },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EcommerceProduct' }],
  categories: [String],
}, { timestamps: true });

ecommerceCouponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export default mongoose.model('EcommerceCoupon', ecommerceCouponSchema);
