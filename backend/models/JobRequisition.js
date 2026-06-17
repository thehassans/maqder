import mongoose from 'mongoose';

const jobRequisitionSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  requisitionId: { type: String, required: true },
  title: { type: String, required: true },
  titleAr: { type: String },
  department: { type: String },
  position: { type: String },
  employmentType: { type: String, enum: ['full_time', 'part_time', 'contract', 'internship'], default: 'full_time' },
  location: { type: String },
  vacancies: { type: Number, default: 1 },
  salaryMin: { type: Number, default: 0 },
  salaryMax: { type: Number, default: 0 },
  description: { type: String },
  requirements: { type: String },
  status: { type: String, enum: ['draft', 'open', 'on_hold', 'closed', 'filled'], default: 'draft' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  postedDate: { type: Date },
  closingDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

jobRequisitionSchema.index({ tenantId: 1, status: 1 });
jobRequisitionSchema.index({ tenantId: 1, requisitionId: 1 }, { unique: true });

export default mongoose.model('JobRequisition', jobRequisitionSchema);
