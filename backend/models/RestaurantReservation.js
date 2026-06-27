import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: { type: String },

  partySize: { type: Number, required: true, min: 1, default: 2 },

  date: { type: Date, required: true },
  time: { type: String, required: true }, // "19:30"
  durationMinutes: { type: Number, default: 90 },

  tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantTable' },
  tableNumber: { type: String },

  status: {
    type: String,
    enum: ['confirmed', 'seated', 'completed', 'cancelled', 'no_show', 'waitlist'],
    default: 'confirmed',
  },

  source: { type: String, enum: ['phone', 'walk_in', 'online', 'whatsapp'], default: 'phone' },

  specialRequests: { type: String },
  occasion: { type: String, enum: ['none', 'birthday', 'anniversary', 'business', 'other'], default: 'none' },

  smsReminderSent: { type: Boolean, default: false },
  confirmationSent: { type: Boolean, default: false },

  seatedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelReason: { type: String },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

reservationSchema.index({ tenantId: 1, date: 1, status: 1 });
reservationSchema.index({ tenantId: 1, customerPhone: 1 });
reservationSchema.index({ tenantId: 1, status: 1, date: 1 });

export default mongoose.models.RestaurantReservation || mongoose.model('RestaurantReservation', reservationSchema);
