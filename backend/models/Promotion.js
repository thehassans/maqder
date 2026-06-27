import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  name: { type: String, required: true },
  nameAr: { type: String },
  description: { type: String },

  type: {
    type: String,
    enum: ['bogo', 'bundle', 'flash_sale', 'category_discount', 'happy_hour', 'product_discount'],
    required: true,
  },

  // Rules object — structure depends on type
  rules: {
    // BOGO: buyQty, getQtyFree, applicableCategory or applicableProductIds
    // Bundle: bundleProductIds, bundlePrice
    // Flash sale / product discount: discountPercent, productIds or categoryIds
    // Category discount: category, discountPercent
    // Happy hour: discountPercent, startTime, endTime, applicableDays []
    buyQty: { type: Number, default: 0 },
    getQtyFree: { type: Number, default: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    bundlePrice: { type: Number, default: 0 },
    applicableProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BakalaProduct' }],
    applicableCategory: { type: String },
    startTime: { type: String }, // "14:00"
    endTime: { type: String },   // "17:00"
    applicableDays: [{ type: Number }], // 0=Sun..6=Sat
    minPurchaseAmount: { type: Number, default: 0 },
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  isActive: { type: Boolean, default: true },

  priority: { type: Number, default: 0 }, // higher = applied first

  usageCount: { type: Number, default: 0 },
  maxUsage: { type: Number, default: 0 }, // 0 = unlimited

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

promotionSchema.index({ tenantId: 1, startDate: -1 });
promotionSchema.index({ tenantId: 1, type: 1, isActive: 1 });

promotionSchema.methods.isCurrentlyActive = function() {
  if (!this.isActive) return false;
  const now = new Date();
  if (now < this.startDate || now > this.endDate) return false;
  if (this.maxUsage > 0 && this.usageCount >= this.maxUsage) return false;

  // Happy hour time check
  if (this.type === 'happy_hour' && this.rules.startTime && this.rules.endTime) {
    const nowTime = now.toTimeString().slice(0, 5);
    if (nowTime < this.rules.startTime || nowTime > this.rules.endTime) return false;
    if (this.rules.applicableDays?.length && !this.rules.applicableDays.includes(now.getDay())) return false;
  }

  return true;
};

export default mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);
