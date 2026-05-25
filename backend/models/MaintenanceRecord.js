import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetAsset', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  maintenanceType: {
    type: String,
    enum: ['scheduled', 'breakdown', 'inspection', 'repair', 'tire_change', 'oil_change', 'other'],
    required: true
  },

  description: { type: String, required: true },
  date: { type: Date, required: true },
  completedDate: { type: Date },
  cost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  partsCost: { type: Number, default: 0 },
  vendor: { type: String },
  vendorInvoiceNumber: { type: String },
  meterReadingAtService: { type: Number },

  // Next service scheduling
  nextServiceDate: { type: Date },
  nextServiceMeter: { type: Number },
  alertDaysBefore: { type: Number, default: 7 },
  alertSent: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },

  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

maintenanceRecordSchema.index({ tenantId: 1, asset: 1, date: -1 });
maintenanceRecordSchema.index({ tenantId: 1, status: 1 });
maintenanceRecordSchema.index({ tenantId: 1, nextServiceDate: 1 });

const MaintenanceRecord = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
export default MaintenanceRecord;
