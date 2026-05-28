import mongoose from 'mongoose';

const saloonServiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String, required: true },
  category: { type: String, required: true },
  durationMinutes: { type: Number, default: 30 },
  price: { type: Number, default: 0, min: 0 },
  taxRate: { type: Number, default: 15 },
  isActive: { type: Boolean, default: true },
  imageUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

saloonServiceSchema.index({ tenantId: 1, category: 1 });
saloonServiceSchema.index({ tenantId: 1, isActive: 1 });

const SaloonService = mongoose.model('SaloonService', saloonServiceSchema);
export default SaloonService;
