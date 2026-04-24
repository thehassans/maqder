import mongoose from 'mongoose';

const reportScheduleSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true, trim: true },
  reportType: { type: String, enum: ['vat', 'business'], required: true },
  rangePreset: { type: String, enum: ['this_month', 'last_month', 'this_week', 'last_7_days'], default: 'this_month' },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  dayOfWeek: { type: Number, min: 0, max: 6, default: 1 },
  dayOfMonth: { type: Number, min: 1, max: 28, default: 1 },
  sendAtHour: { type: Number, min: 0, max: 23, default: 8 },
  sendAtMinute: { type: Number, min: 0, max: 59, default: 0 },
  recipients: [{ type: String, trim: true, lowercase: true }],
  language: { type: String, enum: ['en', 'ar'], default: 'en' },
  enabled: { type: Boolean, default: true },
  nextRunAt: { type: Date, default: null, index: true },
  lastRunAt: { type: Date, default: null },
  lastStatus: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  lastError: { type: String, default: '' },
  lastReportPeriod: {
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
});

reportScheduleSchema.index({ tenantId: 1, enabled: 1, nextRunAt: 1 });
reportScheduleSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('ReportSchedule', reportScheduleSchema);
