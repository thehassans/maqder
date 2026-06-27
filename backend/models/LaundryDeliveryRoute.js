import mongoose from 'mongoose';

const deliveryStopSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'LaundryOrder', required: true },
  orderNumber: { type: String },
  customerName: { type: String },
  customerPhone: { type: String },
  address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },

  stopType: { type: String, enum: ['pickup', 'delivery'], required: true },

  sequence: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'arrived', 'completed', 'failed', 'skipped'],
    default: 'pending',
  },

  completedAt: { type: Date },
  failedReason: { type: String },
  notes: { type: String },
}, { _id: true });

const deliveryRouteSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  routeNumber: { type: String },
  routeDate: { type: Date, required: true },

  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  driverName: { type: String },

  stops: [deliveryStopSchema],

  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned',
  },

  totalStops: { type: Number, default: 0 },
  completedStops: { type: Number, default: 0 },
  failedStops: { type: Number, default: 0 },

  startedAt: { type: Date },
  completedAt: { type: Date },

  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

deliveryRouteSchema.index({ tenantId: 1, routeDate: -1 });
deliveryRouteSchema.index({ tenantId: 1, status: 1 });
deliveryRouteSchema.index({ tenantId: 1, driverId: 1 });

export default mongoose.models.LaundryDeliveryRoute || mongoose.model('LaundryDeliveryRoute', deliveryRouteSchema);
