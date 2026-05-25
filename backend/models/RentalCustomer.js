import mongoose from 'mongoose';

const rentalCustomerSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },

  // Identity
  fullName: { type: String, required: true, trim: true },
  fullNameAr: { type: String, trim: true },
  mobile: { type: String, required: true, trim: true },
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
  idNumber: { type: String, required: true, trim: true },
  idExpiry: { type: Date },
  idPhotoUrl: { type: String },

  // Driving License
  licenseNumber: { type: String, trim: true },
  licenseExpiry: { type: Date },
  licensePhotoUrl: { type: String },
  licenseIssuingCountry: { type: String, default: 'SA' },

  // Compliance
  isBlacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String },
  blacklistedAt: { type: Date },
  blacklistedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

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
rentalCustomerSchema.index({ tenantId: 1, idNumber: 1 }, { unique: true });
rentalCustomerSchema.index({ tenantId: 1, mobile: 1 });
rentalCustomerSchema.index({ tenantId: 1, isBlacklisted: 1 });
rentalCustomerSchema.index({ tenantId: 1, isActive: 1 });

const RentalCustomer = mongoose.model('RentalCustomer', rentalCustomerSchema);
export default RentalCustomer;
