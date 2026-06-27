import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },

  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaloonService' },
  serviceName: { type: String },
  servicePrice: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 30 },

  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  staffName: { type: String },

  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // "14:30"
  endTime: { type: String }, // computed from start + duration

  status: {
    type: String,
    enum: ['booked', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'booked',
  },

  source: { type: String, enum: ['phone', 'walk_in', 'online', 'whatsapp'], default: 'phone' },

  isRecurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['weekly', 'biweekly', 'monthly'], default: 'weekly' },
  parentAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'SaloonAppointment' },

  // Commission tracking
  commissionPercent: { type: Number, default: 0, min: 0, max: 100 },
  commissionAmount: { type: Number, default: 0 },
  commissionPaid: { type: Boolean, default: false },
  commissionPaidAt: { type: Date },

  notes: { type: String },
  reminderSent: { type: Boolean, default: false },

  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelReason: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

appointmentSchema.index({ tenantId: 1, date: 1, status: 1 });
appointmentSchema.index({ tenantId: 1, staffId: 1, date: 1 });
appointmentSchema.index({ tenantId: 1, customerPhone: 1 });

export default mongoose.models.SaloonAppointment || mongoose.model('SaloonAppointment', appointmentSchema);
