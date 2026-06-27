import mongoose from 'mongoose';

const restaurantKDSStationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  name: { type: String, required: true }, // e.g., "Grill", "Cold Station", "Drinks"
  nameAr: { type: String },
  color: { type: String, default: 'blue' }, // blue, amber, red, emerald, violet, cyan
  icon: { type: String, default: 'UtensilsCrossed' },

  // Categories from menu items that route to this station
  categories: [{ type: String }], // e.g., ["Arabic", "Grilled"]

  // Display settings
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },

  // Prep time targets (minutes) for urgency coloring
  prepTargetMinutes: { type: Number, default: 15 },
  prepWarningMinutes: { type: Number, default: 10 },
  prepCriticalMinutes: { type: Number, default: 20 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

restaurantKDSStationSchema.index({ tenantId: 1, sortOrder: 1, isActive: 1 });

export default mongoose.models.RestaurantKDSStation || mongoose.model('RestaurantKDSStation', restaurantKDSStationSchema);
