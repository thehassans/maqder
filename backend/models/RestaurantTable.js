import mongoose from 'mongoose';

const restaurantTableSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  
  tableNumber: { type: String, required: true },
  name: { type: String }, // Optional display name
  seats: { type: Number, default: 4 },
  
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved'],
    default: 'available'
  },
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

restaurantTableSchema.index({ tenantId: 1, tableNumber: 1 }, { unique: true });
restaurantTableSchema.index({ tenantId: 1, status: 1 });

const RestaurantTable = mongoose.model('RestaurantTable', restaurantTableSchema);
export default RestaurantTable;
