import mongoose from 'mongoose';

const laundryInventorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  itemNameEn: { type: String, required: true },
  itemNameAr: { type: String },
  stockLevel: { type: Number, required: true, min: 0 },
  unit: { 
    type: String, 
    enum: ['kg', 'liter', 'pieces', 'rolls'],
    required: true
  },
  reorderThreshold: { type: Number, required: true, min: 0 },
  lastRestocked: { type: Date },
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

laundryInventorySchema.index({ tenantId: 1, stockLevel: 1 });

const LaundryInventory = mongoose.model('LaundryInventory', laundryInventorySchema);
export default LaundryInventory;
