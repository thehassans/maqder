import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'FleetAsset', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  date: { type: Date, required: true, default: Date.now },
  liters: { type: Number, required: true, min: 0 },
  costPerLiter: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  odometerReading: { type: Number },
  fuelStation: { type: String },
  receiptNumber: { type: String },
  filledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

fuelLogSchema.index({ tenantId: 1, asset: 1, date: -1 });
fuelLogSchema.index({ tenantId: 1, project: 1 });
fuelLogSchema.index({ tenantId: 1, date: -1 });

const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
export default FuelLog;
