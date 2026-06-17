import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  jobRequisitionId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRequisition', required: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  nationality: { type: String },
  source: { type: String, enum: ['career_site', 'referral', 'linkedin', 'indeed', 'social_media', 'agency', 'walk_in', 'other'], default: 'other' },
  stage: { type: String, enum: ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'], default: 'new' },
  rating: { type: Number, min: 1, max: 5 },
  appliedDate: { type: Date, default: Date.now },
  resumeUrl: { type: String },
  coverLetter: { type: String },
  notes: { type: String },
  interviewDate: { type: Date },
  offerSalary: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

candidateSchema.index({ tenantId: 1, stage: 1 });
candidateSchema.index({ tenantId: 1, jobRequisitionId: 1 });

export default mongoose.model('Candidate', candidateSchema);
