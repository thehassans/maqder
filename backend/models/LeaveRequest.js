import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  leaveType: { type: String, enum: ['annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity', 'bereavement', 'hajj', 'other'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, required: true },
  reason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  attachments: [{ name: String, url: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

leaveRequestSchema.index({ tenantId: 1, employeeId: 1 });
leaveRequestSchema.index({ tenantId: 1, status: 1 });
leaveRequestSchema.index({ tenantId: 1, startDate: -1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
