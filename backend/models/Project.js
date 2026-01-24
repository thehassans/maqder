import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  code: { type: String, required: true },
  nameEn: { type: String, required: true },
  nameAr: { type: String },
  description: { type: String },

  status: {
    type: String,
    enum: ['planned', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'planned'
  },

  startDate: { type: Date },
  dueDate: { type: Date },
  completedAt: { type: Date },

  progress: { type: Number, default: 0, min: 0, max: 100 },

  budget: { type: Number, default: 0 },
  currency: { type: String, default: 'SAR' },

  ownerName: { type: String },
  notes: { type: String },

  progressUpdates: [
    {
      progress: { type: Number, min: 0, max: 100 },
      note: { type: String },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],

  projectNotes: [
    {
      note: { type: String },
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

projectSchema.index({ tenantId: 1, code: 1 }, { unique: true });
projectSchema.index({ tenantId: 1, status: 1 });
projectSchema.index({ tenantId: 1, dueDate: 1 });

const Project = mongoose.model('Project', projectSchema);
export default Project;
