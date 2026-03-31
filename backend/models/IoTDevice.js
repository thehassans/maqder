import mongoose from 'mongoose';

const iotDeviceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  code: { type: String, required: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String },

  type: {
    type: String,
    enum: ['sensor', 'gateway', 'meter', 'tracker', 'custom'],
    default: 'sensor'
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },

  location: {
    name: { type: String },
    zone: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  },

  tags: [{ type: String }],
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },

  lastSeenAt: { type: Date },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

iotDeviceSchema.index({ tenantId: 1, code: 1 }, { unique: true });
iotDeviceSchema.index({ tenantId: 1, status: 1 });
iotDeviceSchema.index({ tenantId: 1, type: 1 });
iotDeviceSchema.index({ tenantId: 1, lastSeenAt: -1 });

const IoTDevice = mongoose.model('IoTDevice', iotDeviceSchema);
export default IoTDevice;
