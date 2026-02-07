import mongoose from 'mongoose';

const restaurantMenuItemSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  sku: { type: String },
  nameEn: { type: String, required: true },
  nameAr: { type: String },
  category: { type: String },

  sellingPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 15 },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

restaurantMenuItemSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
restaurantMenuItemSchema.index({ tenantId: 1, nameEn: 1 });

const RestaurantMenuItem = mongoose.model('RestaurantMenuItem', restaurantMenuItemSchema);
export default RestaurantMenuItem;
