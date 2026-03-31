import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  taskNumber: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },

  titleEn: { type: String, required: true },
  titleAr: { type: String },
  description: { type: String },

  status: {
    type: String,
    enum: ['todo', 'in_progress', 'blocked', 'done', 'cancelled'],
    default: 'todo'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },

  startDate: { type: Date },
  dueDate: { type: Date },
  completedAt: { type: Date },

  assigneeName: { type: String },
  tags: [{ type: String }],

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

taskSchema.index({ tenantId: 1, taskNumber: 1 }, { unique: true });
taskSchema.index({ tenantId: 1, status: 1 });
taskSchema.index({ tenantId: 1, projectId: 1 });
taskSchema.index({ tenantId: 1, dueDate: 1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
