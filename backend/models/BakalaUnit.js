import mongoose from 'mongoose';

const bakalaUnitSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true }, // e.g. PCS, CTN
  nameAr: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.BakalaUnit || mongoose.model('BakalaUnit', bakalaUnitSchema);
