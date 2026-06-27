import mongoose from 'mongoose';

const rentalMaintenanceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalCar', required: true },
  carDisplay: { type: String }, // "Toyota Camry 2021 - 1234 ABC"

  maintenanceType: {
    type: String,
    enum: ['oil_change', 'tire_rotation', 'tire_change', 'brake_service', 'battery', 'inspection', 'fahas_renewal', 'insurance_renewal', 'istimara_renewal', 'repair', 'other'],
    required: true,
  },

  description: { type: String, required: true },
  scheduledDate: { type: Date },
  completedDate: { type: Date },

  cost: { type: Number, default: 0 },
  laborCost: { type: Number, default: 0 },
  partsCost: { type: Number, default: 0 },
  vendor: { type: String },
  vendorInvoiceNumber: { type: String },

  odometerAtService: { type: Number },

  // Next service scheduling
  nextServiceDate: { type: Date },
  nextServiceOdometer: { type: Number },
  alertDaysBefore: { type: Number, default: 7 },
  alertSent: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
  },

  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

rentalMaintenanceSchema.index({ tenantId: 1, carId: 1, scheduledDate: -1 });
rentalMaintenanceSchema.index({ tenantId: 1, status: 1 });
rentalMaintenanceSchema.index({ tenantId: 1, nextServiceDate: 1 });

export default mongoose.models.RentalMaintenance || mongoose.model('RentalMaintenance', rentalMaintenanceSchema);
