import mongoose from 'mongoose';

const fleetAssetSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  assetNumber: { type: String, required: true },
  name: { type: String, required: true },
  nameAr: { type: String },
  assetType: {
    type: String,
    enum: ['vehicle', 'heavy_equipment', 'light_equipment', 'generator', 'other'],
    required: true
  },

  // Vehicle specifics
  make: { type: String },
  model: { type: String },
  year: { type: Number },
  registrationNumber: { type: String },
  registrationExpiry: { type: Date },
  chassisNumber: { type: String },
  engineNumber: { type: String },
  color: { type: String },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'electric', 'hybrid', 'gas', 'other'],
    default: 'diesel'
  },

  // Assignment
  department: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  assignedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  // Meter / usage
  currentMeterReading: { type: Number, default: 0 },
  meterUnit: { type: String, enum: ['km', 'hours'], default: 'km' },

  // Financial
  purchaseDate: { type: Date },
  purchaseCost: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  insuranceProvider: { type: String },
  insurancePolicyNumber: { type: String },
  insuranceExpiry: { type: Date },

  status: {
    type: String,
    enum: ['active', 'in_maintenance', 'retired', 'sold'],
    default: 'active'
  },

  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

fleetAssetSchema.index({ tenantId: 1, assetNumber: 1 }, { unique: true });
fleetAssetSchema.index({ tenantId: 1, status: 1 });
fleetAssetSchema.index({ tenantId: 1, assetType: 1 });
fleetAssetSchema.index({ tenantId: 1, assignedProject: 1 });

const FleetAsset = mongoose.model('FleetAsset', fleetAssetSchema);
export default FleetAsset;
