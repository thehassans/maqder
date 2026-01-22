import mongoose from 'mongoose';
import momentHijri from 'moment-hijri';

const deductionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['gosi_employee', 'gosi_employer', 'tax', 'loan', 'advance', 'absence', 'penalty', 'other'],
    required: true
  },
  description: { type: String },
  descriptionAr: { type: String },
  amount: { type: Number, required: true },
  isRecurring: { type: Boolean, default: false }
});

const earningSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['basic', 'housing', 'transport', 'food', 'overtime', 'bonus', 'commission', 'allowance', 'other'],
    required: true
  },
  description: { type: String },
  descriptionAr: { type: String },
  amount: { type: Number, required: true },
  hours: { type: Number },
  rate: { type: Number }
});

const payrollSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  
  // Period
  periodMonth: { type: Number, required: true },
  periodYear: { type: Number, required: true },
  periodMonthHijri: { type: String },
  periodYearHijri: { type: String },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  
  // Earnings
  earnings: [earningSchema],
  totalEarnings: { type: Number, required: true },
  
  // Deductions
  deductions: [deductionSchema],
  totalDeductions: { type: Number, required: true },
  
  // GOSI Details
  gosi: {
    employeeShare: { type: Number, default: 0 },
    employerShare: { type: Number, default: 0 },
    totalContribution: { type: Number, default: 0 },
    calculationBase: { type: Number }
  },
  
  // Net Pay
  grossPay: { type: Number, required: true },
  netPay: { type: Number, required: true },
  
  // Working Days
  workingDays: { type: Number, default: 30 },
  workedDays: { type: Number, default: 30 },
  absentDays: { type: Number, default: 0 },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'paid', 'cancelled'],
    default: 'draft'
  },
  
  // WPS
  wps: {
    included: { type: Boolean, default: false },
    batchId: { type: String },
    processedAt: { type: Date }
  },
  
  // Payment Details
  paymentMethod: { type: String, enum: ['bank_transfer', 'cash', 'cheque'], default: 'bank_transfer' },
  paymentDate: { type: Date },
  paymentReference: { type: String },
  
  // Approval
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

payrollSchema.index({ tenantId: 1, employeeId: 1, periodMonth: 1, periodYear: 1 }, { unique: true });
payrollSchema.index({ tenantId: 1, status: 1 });
payrollSchema.index({ tenantId: 1, periodYear: 1, periodMonth: 1 });

// Pre-save hook for Hijri period
payrollSchema.pre('save', function(next) {
  if (this.periodStart) {
    const hijriDate = momentHijri(this.periodStart);
    this.periodMonthHijri = hijriDate.format('iMM');
    this.periodYearHijri = hijriDate.format('iYYYY');
  }
  next();
});

const Payroll = mongoose.model('Payroll', payrollSchema);
export default Payroll;
