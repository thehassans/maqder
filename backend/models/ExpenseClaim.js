import mongoose from 'mongoose';

const expenseLineSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['travel', 'meals', 'accommodation', 'transport', 'office_supplies', 'client_entertainment', 'training', 'mileage', 'per_diem', 'telecom', 'other'],
    required: true,
  },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'SAR' },
  taxAmount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },
  receiptUrl: { type: String },
  receiptFileName: { type: String },
  distanceKm: { type: Number, min: 0 },
  perDiemDays: { type: Number, min: 0 },
}, { _id: false });

const approvalStepSchema = new mongoose.Schema({
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approverName: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  actedAt: { type: Date },
  comment: { type: String },
}, { _id: false });

const expenseClaimSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  claimNumber: { type: String, required: true },

  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeName: { type: String, required: true },
  department: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title: { type: String, required: true },
  description: { type: String },
  expensePeriod: {
    from: { type: Date },
    to: { type: Date },
  },

  lines: { type: [expenseLineSchema], default: [] },

  subtotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },

  currency: { type: String, default: 'SAR' },

  status: {
    type: String,
    enum: ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'reimbursed'],
    default: 'draft',
  },

  approvalTrail: { type: [approvalStepSchema], default: [] },
  currentApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  reimbursedAt: { type: Date },
  reimbursedVia: { type: String, enum: ['payroll', 'bank_transfer', 'cash', 'cheque'] },
  payrollMonth: { type: String },

  notes: { type: String },
}, { timestamps: true });

expenseClaimSchema.index({ tenantId: 1, claimNumber: 1 }, { unique: true });
expenseClaimSchema.index({ tenantId: 1, status: 1 });
expenseClaimSchema.index({ tenantId: 1, employeeId: 1 });
expenseClaimSchema.index({ tenantId: 1, submittedBy: 1 });

export default mongoose.models.ExpenseClaim || mongoose.model('ExpenseClaim', expenseClaimSchema);
