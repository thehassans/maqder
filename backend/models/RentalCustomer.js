import mongoose from 'mongoose';

const rentalCustomerSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  // Identity
  fullName: { type: String, required: true, trim: true },
  fullNameAr: { type: String, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  alternativeMobile: { type: String, trim: true },
  nationality: { type: String, trim: true, default: 'SA' },
  dateOfBirth: { type: Date },
  email: { type: String, trim: true, lowercase: true },

  // ID Document (Iqama / National ID)
  idType: {
    type: String,
    enum: ['national_id', 'iqama', 'passport', 'gcc_id'],
    default: 'national_id'
  },
  iqamaId: { 
    type: String, 
    required: true, 
    trim: true,
    match: [/^[12]\d{9}$/, 'Must be a valid 10-digit Saudi National ID or Iqama starting with 1 or 2']
  },
  idExpiry: { type: Date },
  idPhotoUrl: { type: String },
  idPhotoBackUrl: { type: String },

  // Driving License
  licenseNumber: { type: String, trim: true },
  licenseExpiry: { type: Date },
  licensePhotoUrl: { type: String },
  licenseIssuingCountry: { type: String, default: 'SA' },

  // Compliance
  isYakeenVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  blocklistReason: { type: String },
  blockedAt: { type: Date },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Stats (updated on contract events)
  totalRentals: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  lastRentalDate: { type: Date },

  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Compound unique: one record per tenant per national ID
rentalCustomerSchema.index({ tenantId: 1, iqamaId: 1 }, { unique: true });
rentalCustomerSchema.index({ tenantId: 1, phoneNumber: 1 });
rentalCustomerSchema.index({ tenantId: 1, isBlocked: 1 });
rentalCustomerSchema.index({ tenantId: 1, isActive: 1 });

const RentalCustomer = mongoose.model('RentalCustomer', rentalCustomerSchema);
export default RentalCustomer;
