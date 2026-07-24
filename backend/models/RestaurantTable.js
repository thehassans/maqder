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
  
  // Layout properties for 3D floor plan
  positionX: { type: Number, default: 0 },
  positionY: { type: Number, default: 0 },
  shape: { type: String, enum: ['rectangle', 'circle', 'square'], default: 'rectangle' },
  width: { type: Number, default: 100 },
  height: { type: Number, default: 100 },
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

restaurantTableSchema.index({ tenantId: 1, tableNumber: 1 }, { unique: true });
restaurantTableSchema.index({ tenantId: 1, status: 1 });

const RestaurantTable = mongoose.model('RestaurantTable', restaurantTableSchema);
export default RestaurantTable;
