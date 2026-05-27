import mongoose from 'mongoose';

const restaurantInventorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  
  nameEn: { type: String, required: true },
  nameAr: { type: String },
  category: { type: String }, // e.g. Meat, Seafood, Dry Goods
  
  unit: { type: String, required: true }, // e.g. kg, liter, piece
  quantity: { type: Number, default: 0 },
  minimumStock: { type: Number, default: 0 },
  
  costPerUnit: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

restaurantInventorySchema.index({ tenantId: 1, nameEn: 1 });
restaurantInventorySchema.index({ tenantId: 1, category: 1 });

const RestaurantInventory = mongoose.model('RestaurantInventory', restaurantInventorySchema);
export default RestaurantInventory;
