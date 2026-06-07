import mongoose from 'mongoose';

const rentalCarSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },

  // Identity
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  color: { type: String, trim: true },
  colorAr: { type: String, trim: true },
  vin: { type: String, trim: true, uppercase: true, unique: true },

  // Saudi Plate
  plateNumber: { type: String, required: true, trim: true },
  plateArabicLetters: { type: String, trim: true },   // e.g. "أ ب ج"
  plateEnglishLetters: { type: String, trim: true },  // e.g. "A B C"
  sequenceNumber: { type: String, trim: true },       // Tamm Sequence Number

  // Status
  status: {
    type: String,
    enum: ['AVAILABLE', 'RESERVED', 'RENTED', 'PENDING_INSPECTION', 'MAINTENANCE'],
    default: 'AVAILABLE',
    index: true
  },

  // Tracking
  currentOdometer: { type: Number, default: 0, min: 0 },
  nextOilChangeKm: { type: Number, default: 0 },

  // Compliance dates (Saudi)
  insuranceExpiry: { type: Date },
  fahasExpiry: { type: Date },     // Fahas = Saudi vehicle inspection
  istimaraExpiry: { type: Date },  // Registration/Istimara

  // Pricing defaults
  dailyRateDefault: { type: Number, default: 0, min: 0 },
  hourlyLateRateDefault: { type: Number, default: 0, min: 0 },
  perKmOverageRateDefault: { type: Number, default: 0, min: 0 },
  allowedKmPerDayDefault: { type: Number, default: 200, min: 0 },
  securityDepositDefault: { type: Number, default: 0, min: 0 },

  // Category
  category: {
    type: String,
    enum: ['economy', 'compact', 'midsize', 'fullsize', 'suv', 'luxury', 'van', 'truck'],
    default: 'economy'
  },

  // Media
  photos: [{ type: String }], // URLs

  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

rentalCarSchema.index({ tenantId: 1, plateNumber: 1 }, { unique: true });
rentalCarSchema.index({ tenantId: 1, status: 1 });
rentalCarSchema.index({ branchId: 1, status: 1 });
rentalCarSchema.index({ tenantId: 1, isActive: 1 });

const RentalCar = mongoose.model('RentalCar', rentalCarSchema);
export default RentalCar;
