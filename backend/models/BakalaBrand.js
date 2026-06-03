import mongoose from 'mongoose';

const bakalaBrandSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  nameAr: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.BakalaBrand || mongoose.model('BakalaBrand', bakalaBrandSchema);
