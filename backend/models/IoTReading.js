import mongoose from 'mongoose';

const iotReadingSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'IoTDevice', required: true, index: true },

  recordedAt: { type: Date, default: Date.now, index: true },

  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  battery: { type: Number },
  signal: { type: Number },

  status: {
    type: String,
    enum: ['ok', 'warning', 'alert'],
    default: 'ok'
  },

  notes: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

iotReadingSchema.index({ tenantId: 1, deviceId: 1, recordedAt: -1 });

iotReadingSchema.set('toJSON', { virtuals: true });
iotReadingSchema.set('toObject', { virtuals: true });

const IoTReading = mongoose.model('IoTReading', iotReadingSchema);
export default IoTReading;
