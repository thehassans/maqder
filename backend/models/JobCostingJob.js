import mongoose from 'mongoose';

const jobCostingJobSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  code: { type: String, required: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String },
  description: { type: String },

  status: {
    type: String,
    enum: ['planned', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planned'
  },

  startDate: { type: Date },
  dueDate: { type: Date },
  completedAt: { type: Date },

  budget: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },

  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  notes: { type: String },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

jobCostingJobSchema.index({ tenantId: 1, code: 1 }, { unique: true });
jobCostingJobSchema.index({ tenantId: 1, status: 1 });
jobCostingJobSchema.index({ tenantId: 1, dueDate: 1 });

const JobCostingJob = mongoose.model('JobCostingJob', jobCostingJobSchema);
export default JobCostingJob;
