import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  weight: { type: Number, default: 0 },
  targetValue: { type: String },
  actualValue: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'not_met'], default: 'pending' },
}, { _id: true });

const competencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
}, { _id: true });

const performanceReviewSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  period: { type: String, required: true },
  periodStart: { type: Date },
  periodEnd: { type: Date },
  reviewType: { type: String, enum: ['annual', 'mid_year', 'quarterly', 'probation', 'adhoc'], default: 'annual' },
  goals: [goalSchema],
  competencies: [competencySchema],
  overallRating: { type: Number, min: 1, max: 5 },
  strengths: { type: String },
  improvements: { type: String },
  employeeComments: { type: String },
  status: { type: String, enum: ['draft', 'submitted', 'acknowledged', 'closed'], default: 'draft' },
  submittedAt: { type: Date },
  acknowledgedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

performanceReviewSchema.index({ tenantId: 1, employeeId: 1 });
performanceReviewSchema.index({ tenantId: 1, status: 1 });
performanceReviewSchema.index({ tenantId: 1, period: -1 });

export default mongoose.model('PerformanceReview', performanceReviewSchema);
