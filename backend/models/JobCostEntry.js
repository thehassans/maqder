import mongoose from 'mongoose';

const jobCostEntrySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobCostingJob', required: true, index: true },

  date: { type: Date, default: Date.now },

  type: {
    type: String,
    enum: ['material', 'labor', 'overhead', 'subcontract', 'other'],
    default: 'material'
  },

  description: { type: String },
  quantity: { type: Number, default: 1, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  totalCost: { type: Number, default: 0, min: 0 },

  reference: { type: String },
  notes: { type: String },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

jobCostEntrySchema.index({ tenantId: 1, jobId: 1, date: -1 });
jobCostEntrySchema.index({ tenantId: 1, type: 1 });

const JobCostEntry = mongoose.model('JobCostEntry', jobCostEntrySchema);
export default JobCostEntry;
