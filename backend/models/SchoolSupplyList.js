import mongoose from 'mongoose';

const supplyListItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookStoreProduct' },
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  estimatedPrice: { type: Number, default: 0 },
}, { _id: false });

const schoolSupplyListSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  schoolName: { type: String, required: true },
  schoolNameAr: { type: String },
  grade: { type: String, required: true },
  gradeAr: { type: String },
  academicYear: { type: String, default: '2025-2026' },
  items: [supplyListItemSchema],
  totalEstimatedPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

schoolSupplyListSchema.index({ tenantId: 1, schoolName: 1, grade: 1, academicYear: 1 }, { unique: true });

export default mongoose.models.SchoolSupplyList || mongoose.model('SchoolSupplyList', schoolSupplyListSchema);
