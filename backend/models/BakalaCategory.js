import mongoose from 'mongoose';

const bakalaCategorySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  nameAr: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.BakalaCategory || mongoose.model('BakalaCategory', bakalaCategorySchema);
