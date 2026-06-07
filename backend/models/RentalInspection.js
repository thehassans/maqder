import mongoose from 'mongoose';

const damagePinSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  panel: { type: String, required: true },
  severity: { type: String, enum: ['Scratch', 'Dent', 'Major Damage'], required: true },
  photoUrl: { type: String }
}, { _id: false });

const rentalInspectionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'RentalContract', required: true, index: true },
  type: {
    type: String,
    enum: ['Pre-Rental', 'Post-Rental'],
    required: true
  },
  
  damagePins: [damagePinSchema],
  
  inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  notes: { type: String }
}, {
  timestamps: true
});

rentalInspectionSchema.index({ tenantId: 1, contractId: 1, type: 1 });

const RentalInspection = mongoose.model('RentalInspection', rentalInspectionSchema);
export default RentalInspection;
