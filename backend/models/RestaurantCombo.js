import mongoose from 'mongoose';

const comboItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantMenuItem' },
  name: { type: String, required: true },
  nameAr: { type: String },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, default: 0 }, // snapshot of item price
  isOptional: { type: Boolean, default: false },
  options: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantMenuItem' },
    name: { type: String },
    priceModifier: { type: Number, default: 0 },
  }],
}, { _id: true });

const timeSlotSchema = new mongoose.Schema({
  daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sun, 6=Sat
  startTime: { type: String }, // "14:00"
  endTime: { type: String }, // "17:00"
}, { _id: false });

const restaurantComboSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  name: { type: String, required: true },
  nameAr: { type: String },
  description: { type: String },
  descriptionAr: { type: String },

  // Combo type
  type: {
    type: String,
    enum: ['combo', 'happy_hour', 'bogo', 'family_package', 'seasonal', 'early_bird'],
    default: 'combo',
  },

  // Items included in the combo
  items: [comboItemSchema],

  // Pricing
  comboPrice: { type: Number, required: true, min: 0 }, // special combo price
  originalTotal: { type: Number, default: 0 }, // sum of individual item prices
  discountAmount: { type: Number, default: 0 }, // originalTotal - comboPrice
  discountPercent: { type: Number, default: 0 },

  // Time-based availability
  timeSlots: [timeSlotSchema], // e.g., happy hour 2-5pm on weekdays
  isTimeLimited: { type: Boolean, default: false },

  // Date range for seasonal promotions
  startDate: { type: Date },
  endDate: { type: Date },

  // Usage limits
  maxPerDay: { type: Number, default: 0 }, // 0 = unlimited
  maxPerOrder: { type: Number, default: 0 },
  totalQuantityLimit: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },

  // Display
  imageUrl: { type: String },
  badgeText: { type: String }, // e.g., "Save 20%", "Happy Hour"
  sortOrder: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

restaurantComboSchema.index({ tenantId: 1, isActive: 1, sortOrder: 1 });
restaurantComboSchema.index({ tenantId: 1, type: 1, isActive: 1 });

export default mongoose.models.RestaurantCombo || mongoose.model('RestaurantCombo', restaurantComboSchema);
