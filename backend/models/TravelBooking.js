import mongoose from 'mongoose';

const travelSegmentSchema = new mongoose.Schema({
  from: { type: String },
  to: { type: String },
}, { _id: false });

const travelBookingSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  bookingNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'ticketed', 'completed', 'cancelled'],
    default: 'confirmed',
    index: true
  },

  customerName: { type: String, required: true },
  customerEmail: { type: String },
  customerPhone: { type: String },
  passportNumber: { type: String },
  travelerName: { type: String },
  ticketNumber: { type: String },
  pnr: { type: String },
  airlineName: { type: String },
  routeFrom: { type: String },
  routeTo: { type: String },
  segments: [travelSegmentSchema],

  serviceType: {
    type: String,
    enum: ['flight', 'hotel', 'package', 'visa', 'other'],
    default: 'flight',
    index: true
  },

  departureDate: { type: Date },
  hasReturnDate: { type: Boolean, default: false },
  returnDate: { type: Date },
  layoverStay: { type: String },

  currency: { type: String, default: 'SAR' },
  subtotal: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },

  notes: { type: String },

  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', index: true },
  invoiceNumber: { type: String },
  invoicedAt: { type: Date },

  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

travelBookingSchema.index({ tenantId: 1, bookingNumber: 1 }, { unique: true });
travelBookingSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

const TravelBooking = mongoose.model('TravelBooking', travelBookingSchema);
export default TravelBooking;
